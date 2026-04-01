// BookmarkBar - Main bar with breadcrumbs and scrollable bookmarks
import { createSignal, Show, For, onMount } from 'solid-js';
import BookmarkItem from './BookmarkItem';
import { getGithubToken, getGistId, hasConfiguration } from '../utils/storage';
import { parseYaml, stringifyYaml, deleteBookmarkAtPath } from '../utils/yaml';

export default function BookmarkBar(props) {
  const [bookmarks, setBookmarks] = createSignal({ bookmarks: [] });
  const [currentPath, setCurrentPath] = createSignal([]);
  const [currentBookmarks, setCurrentBookmarks] = createSignal([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal(null);
  const [configured, setConfigured] = createSignal(false);
  const [showSearch, setShowSearch] = createSignal(false);
  const [searchQuery, setSearchQuery] = createSignal('');
  const [filteredBookmarks, setFilteredBookmarks] = createSignal([]);
  
  // Inline folder creation state
  const [showFolderInput, setShowFolderInput] = createSignal(false);
  const [folderInputValue, setFolderInputValue] = createSignal('');
  
  // Edit state tracking
  const [editingIndex, setEditingIndex] = createSignal(null);
  
  // Drag-to-scroll state
  let scrollContainer;
  const [isDragging, setIsDragging] = createSignal(false);
  const [startX, setStartX] = createSignal(0);
  const [scrollLeft, setScrollLeft] = createSignal(0);
  
  onMount(() => {
    // Check configuration on mount (client-side only)
    // Add a small delay to ensure localStorage is fully accessible in iframe context
    const checkConfig = () => {
      const token = getGithubToken();
      const gistId = getGistId();
      const isConfigured = !!(token && gistId);
      
      console.log('BookmarkBar mounted. Configured:', isConfigured);
      console.log('Token:', token ? 'exists' : 'missing');
      console.log('GistId:', gistId ? 'exists' : 'missing');
      
      setConfigured(isConfigured);
      
      if (isConfigured) {
        loadBookmarks();
      } else {
        setLoading(false);
      }
    };
    
    // Check immediately
    checkConfig();
    
    // Also check after a short delay in case localStorage wasn't ready
    setTimeout(checkConfig, 200);
  });
  
  const loadBookmarks = async () => {
    console.log('loadBookmarks called. Configured:', configured());
    if (!configured()) {
      console.log('Not configured, skipping bookmark load');
      setLoading(false);
      return;
    }
    
    try {
      const token = getGithubToken();
      const gistId = getGistId();
      
      const response = await fetch(`/api/bookmarks?token=${encodeURIComponent(token)}&gistId=${encodeURIComponent(gistId)}`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      const parsed = parseYaml(data.content);
      setBookmarks(parsed);
      setCurrentBookmarks(parsed.bookmarks || []);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };
  
  const navigateToFolder = (folder, index) => {
    setCurrentPath([...currentPath(), { name: folder.name, index }]);
    setCurrentBookmarks(folder.children || []);
  };
  
  const navigateToBreadcrumb = async (targetIndex) => {
    if (targetIndex === -1) {
      // Navigate to root - reload from Gist to get latest data
      await loadBookmarks();
      setCurrentPath([]);
      // currentBookmarks will be set by loadBookmarks
    } else {
      // Navigate to specific breadcrumb
      const newPath = currentPath().slice(0, targetIndex + 1);
      setCurrentPath(newPath);
      
      // Navigate through the path
      let current = bookmarks().bookmarks;
      for (const pathItem of newPath) {
        const folder = current[pathItem.index];
        if (folder && folder.type === 'folder') {
          current = folder.children || [];
        }
      }
      setCurrentBookmarks(current);
    }
  };
  
  const handleAddCurrentPage = async () => {
    // Get current page info from parent window
    try {
      console.log('handleAddCurrentPage called');
      
      // Access the global function
      const getCurrentPageInfo = window.getCurrentPageInfo;
      if (!getCurrentPageInfo) {
        console.error('getCurrentPageInfo not available');
        alert('Unable to get current page info. Make sure you\'re using the bookmarklet.');
        return;
      }
      
      const pageInfo = await getCurrentPageInfo();
      console.log('Page info received:', pageInfo);
      
      if (!pageInfo) {
        console.error('No page info returned');
        alert('Could not get page information from the parent window.');
        return;
      }
      
      const newBookmark = {
        name: pageInfo.title || pageInfo.url,
        type: 'link',
        url: pageInfo.url
      };
      
      console.log('Adding bookmark:', newBookmark);
      
      // Add to current location
      const updatedBookmarks = addBookmarkToCurrentPath(newBookmark);
      
      // Optimistic update - update UI immediately
      updateUIAfterChange(updatedBookmarks);
      setShowAddMenu(false);
      
      // Save to Gist in background
      await saveBookmarks(updatedBookmarks, true);
    } catch (err) {
      console.error('Error adding bookmark:', err);
      alert('Error adding bookmark: ' + err.message);
    }
  };
  
  const handleAddFolder = () => {
    console.log('handleAddFolder called - showing inline input');
    setShowFolderInput(true);
    setFolderInputValue('');
    // Focus the input after it's rendered
    setTimeout(() => {
      const input = document.getElementById('inline-folder-input');
      if (input) input.focus();
    }, 10);
  };
  
  const handleFolderInputSave = () => {
    const folderName = folderInputValue().trim();
    if (!folderName) {
      setShowFolderInput(false);
      return;
    }
    
    console.log('Creating folder:', folderName);
    
    const newFolder = {
      name: folderName,
      type: 'folder',
      children: []
    };
    
    const updatedBookmarks = addBookmarkToCurrentPath(newFolder);
    
    // Optimistic update - update UI immediately
    updateUIAfterChange(updatedBookmarks);
    setShowFolderInput(false);
    setFolderInputValue('');
    
    // Save to Gist in background
    saveBookmarks(updatedBookmarks, true);
  };
  
  const handleFolderInputCancel = () => {
    setShowFolderInput(false);
    setFolderInputValue('');
  };
  
  const addBookmarkToCurrentPath = (newItem) => {
    const data = JSON.parse(JSON.stringify(bookmarks()));
    let current = data.bookmarks;
    
    for (const pathItem of currentPath()) {
      current = current[pathItem.index].children;
    }
    
    current.push(newItem);
    return data;
  };
  
  const saveBookmarks = async (updatedBookmarks, skipReload = false) => {
    try {
      const token = getGithubToken();
      const gistId = getGistId();
      const yamlContent = stringifyYaml(updatedBookmarks);
      
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, gistId, content: yamlContent })
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Only reload if not skipped (for optimistic updates)
      if (!skipReload) {
        await loadBookmarks();
      }
    } catch (err) {
      setError(err.message);
      // Reload on error to revert optimistic update
      await loadBookmarks();
    }
  };
  
  const updateUIAfterChange = (updatedBookmarks) => {
    // Update the bookmarks state
    setBookmarks(updatedBookmarks);
    
    // Update current view
    let current = updatedBookmarks.bookmarks;
    for (const pathItem of currentPath()) {
      const folder = current[pathItem.index];
      if (folder && folder.type === 'folder') {
        current = folder.children || [];
      }
    }
    setCurrentBookmarks(current);
  };
  
  const handleDelete = async (index) => {
    try {
      // Build the full path to this bookmark
      const path = [...currentPath().map(p => p.index), index];
      
      // Delete from bookmarks data
      const updatedBookmarks = deleteBookmarkAtPath(bookmarks(), path);
      
      // Optimistic update - update UI immediately
      updateUIAfterChange(updatedBookmarks);
      
      // Save to Gist in background
      await saveBookmarks(updatedBookmarks, true);
    } catch (err) {
      console.error('Error deleting bookmark:', err);
      alert('Error deleting bookmark: ' + err.message);
    }
  };
  
  const handleEdit = async (index, updatedItem) => {
    try {
      // Build the full path to this bookmark
      const path = [...currentPath().map(p => p.index), index];
      
      // Deep clone the bookmarks data
      const data = JSON.parse(JSON.stringify(bookmarks()));
      
      // Navigate to the item and update it
      let current = data.bookmarks;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]].children;
      }
      
      // Update the item at the final index
      current[path[path.length - 1]] = updatedItem;
      
      // Optimistic update - update UI immediately
      updateUIAfterChange(data);
      
      // Save to Gist in background
      await saveBookmarks(data, true);
    } catch (err) {
      console.error('Error editing bookmark:', err);
      alert('Error editing bookmark: ' + err.message);
    }
  };
  
  const handleMove = async (index, direction) => {
    try {
      // Build the full path to this bookmark
      const path = [...currentPath().map(p => p.index), index];
      
      // Deep clone the bookmarks data
      const data = JSON.parse(JSON.stringify(bookmarks()));
      
      // Navigate to the parent array
      let current = data.bookmarks;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]].children;
      }
      
      // Calculate new position
      const currentIndex = path[path.length - 1];
      const newIndex = currentIndex + direction;
      
      // Check bounds
      if (newIndex < 0 || newIndex >= current.length) {
        return;
      }
      
      // Swap items
      const temp = current[currentIndex];
      current[currentIndex] = current[newIndex];
      current[newIndex] = temp;
      
      // Update editing index if this item is being edited
      if (editingIndex() === index) {
        setEditingIndex(newIndex);
      } else if (editingIndex() === newIndex) {
        // If the item at newIndex was being edited, it moves to currentIndex
        setEditingIndex(currentIndex);
      }
      
      // Optimistic update - update UI immediately
      updateUIAfterChange(data);
      
      // Save to Gist in background
      await saveBookmarks(data, true);
    } catch (err) {
      console.error('Error moving bookmark:', err);
      alert('Error moving bookmark: ' + err.message);
    }
  };
  
  // Search functionality
  const searchAllBookmarks = (items, query, results = []) => {
    for (const item of items) {
      if (item.name.toLowerCase().includes(query.toLowerCase())) {
        results.push(item);
      }
      if (item.type === 'folder' && item.children) {
        searchAllBookmarks(item.children, query, results);
      }
    }
    return results;
  };
  
  const handleSearchInput = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim()) {
      const results = searchAllBookmarks(bookmarks().bookmarks || [], query);
      setFilteredBookmarks(results);
    } else {
      setFilteredBookmarks([]);
    }
  };
  
  const handleSearchToggle = () => {
    setShowSearch(!showSearch());
    if (showSearch()) {
      // Focus the search input after it appears
      setTimeout(() => {
        document.getElementById('bookmark-search-input')?.focus();
      }, 0);
    } else {
      // Reset search
      setSearchQuery('');
      setFilteredBookmarks([]);
    }
  };
  
  const handleSearchClear = () => {
    setSearchQuery('');
    setFilteredBookmarks([]);
    setShowSearch(false);
  };
  
  // Determine which bookmarks to display
  const displayBookmarks = () => {
    if (searchQuery().trim()) {
      return filteredBookmarks();
    }
    return currentBookmarks();
  };
  
  // Get initials from a name for mobile breadcrumbs
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  // Handle reload button click - request storage access first
  const handleReload = async () => {
    try {
      if (window.requestStorageAccessForSetup) {
        const granted = await window.requestStorageAccessForSetup();
        console.log('Storage access granted:', granted);
      }
    } catch (err) {
      console.error('Error requesting storage access:', err);
    }
    window.location.reload();
  };
  
  // Drag-to-scroll handlers
  const handleMouseDown = (e) => {
    if (!scrollContainer) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainer.offsetLeft);
    setScrollLeft(scrollContainer.scrollLeft);
    scrollContainer.style.cursor = 'grabbing';
    scrollContainer.style.userSelect = 'none';
  };
  
  const handleMouseLeave = () => {
    if (!scrollContainer) return;
    setIsDragging(false);
    scrollContainer.style.cursor = 'grab';
    scrollContainer.style.userSelect = 'auto';
  };
  
  const handleMouseUp = () => {
    if (!scrollContainer) return;
    setIsDragging(false);
    scrollContainer.style.cursor = 'grab';
    scrollContainer.style.userSelect = 'auto';
  };
  
  const handleMouseMove = (e) => {
    if (!isDragging() || !scrollContainer) return;
    e.preventDefault();
    const x = e.pageX - scrollContainer.offsetLeft;
    const walk = (x - startX()) * 2; // Multiply by 2 for faster scrolling
    scrollContainer.scrollLeft = scrollLeft() - walk;
  };
  
  return (
    <div class="flex items-center h-full bg-[var(--color-bg-primary)] border-b border-[var(--color-border)] px-2 gap-2">
      <Show when={loading()}>
        <div class="text-[var(--color-text-secondary)] text-sm">Loading...</div>
      </Show>
      
      <Show when={error()}>
        <div class="text-red-500 text-sm">{error()}</div>
      </Show>
      
      <Show when={!loading() && !error() && !configured()}>
        <div class="text-[var(--color-text-secondary)] text-sm flex items-center gap-2">
          <span>Please configure your GitHub token and Gist ID</span>
          <button
            class="text-[var(--color-accent)] hover:underline"
            onClick={() => window.open('/setup', '_blank', 'width=600,height=700')}
          >
            Setup
          </button>
          <span class="text-xs text-[var(--color-text-secondary)]">(After saving, close the setup window)</span>
        </div>
      </Show>
      
      <Show when={!loading() && !error() && configured()}>
        {/* Breadcrumbs - Fixed on left */}
        <div class="flex items-center gap-1 shrink-0">
          <button
            class="p-1.5 text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded"
            onClick={() => navigateToBreadcrumb(-1)}
            title="Home"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
          <For each={currentPath()}>
            {(pathItem, i) => (
              <>
                <span class="text-[var(--color-text-secondary)]">/</span>
                <button
                  class="px-2 py-1 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded"
                  onClick={() => navigateToBreadcrumb(i())}
                  title={pathItem.name}
                >
                  <span class="hidden sm:inline">{pathItem.name}</span>
                  <span class="sm:hidden">{getInitials(pathItem.name)}</span>
                </button>
              </>
            )}
          </For>
        </div>
        
        {/* Inline folder creation */}
        <Show 
          when={!showFolderInput()}
          fallback={
            <div class="flex items-center gap-1 shrink-0">
              <input
                id="inline-folder-input"
                type="text"
                value={folderInputValue()}
                onInput={(e) => setFolderInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleFolderInputSave();
                  } else if (e.key === 'Escape') {
                    handleFolderInputCancel();
                  }
                }}
                placeholder="Folder name..."
                class="px-2 py-1 text-xs bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded focus:outline-none focus:border-[var(--color-accent)] w-32"
              />
              <button
                onClick={handleFolderInputSave}
                title="Save folder"
                class="p-1 text-green-600 hover:text-green-700 transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                onClick={handleFolderInputCancel}
                title="Cancel"
                class="p-1 text-red-600 hover:text-red-700 transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          }
        >
          <button
            class="px-0.5 py-0.5 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors leading-none flex-shrink-0"
            onClick={handleAddFolder}
            title="Add new folder"
          >
            <sup class="inline-block relative -top-1">
              <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </sup>
          </button>
        </Show>
        
        <div class="w-px h-6 bg-[var(--color-border)]"></div>
        
        {/* Scrollable bookmarks */}
        <div 
          ref={scrollContainer}
          class="flex-1 overflow-x-auto overflow-y-hidden flex items-center gap-1 scrollbar-thin"
          style="cursor: grab;"
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          <For each={displayBookmarks()}>
            {(item, index) => (
              <BookmarkItem
                item={item}
                index={index()}
                isFirst={index() === 0}
                isLast={index() === displayBookmarks().length - 1}
                isEditing={editingIndex() === index()}
                onEditStart={() => setEditingIndex(index())}
                onEditEnd={() => setEditingIndex(null)}
                onFolderClick={navigateToFolder}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onMove={handleMove}
              />
            )}
          </For>
        </div>
        
        {/* Add bookmark button */}
        <div class="shrink-0">
          <button
            class="px-3 py-1.5 text-sm bg-[var(--color-accent)] text-white rounded hover:bg-[var(--color-accent-hover)] transition-colors"
            onClick={handleAddCurrentPage}
            title="Add current page as bookmark"
          >
            <span class="hidden sm:inline">+ Add</span>
            <svg class="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        
        <div class="w-px h-6 bg-[var(--color-border)]"></div>
        
        {/* Search */}
        <Show 
          when={!showSearch()}
          fallback={
            <div class="flex items-center gap-1 shrink-0">
              <input
                id="bookmark-search-input"
                type="text"
                value={searchQuery()}
                onInput={handleSearchInput}
                placeholder="Search bookmarks..."
                class="px-2 py-1 text-sm bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded focus:outline-none focus:border-[var(--color-accent)] w-48"
              />
              <button
                class="p-1 text-[var(--color-text-secondary)] hover:text-red-500 transition-colors"
                onClick={handleSearchClear}
                title="Clear search"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          }
        >
          <button
            class="p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] rounded transition-colors shrink-0"
            onClick={handleSearchToggle}
            title="Search bookmarks"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </Show>
      </Show>
    </div>
  );
}
