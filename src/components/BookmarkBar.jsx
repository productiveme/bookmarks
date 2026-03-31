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
  const [showAddMenu, setShowAddMenu] = createSignal(false);
  const [showSearch, setShowSearch] = createSignal(false);
  const [searchQuery, setSearchQuery] = createSignal('');
  const [filteredBookmarks, setFilteredBookmarks] = createSignal([]);
  
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
  
  const navigateToBreadcrumb = (targetIndex) => {
    if (targetIndex === -1) {
      // Navigate to root
      setCurrentPath([]);
      setCurrentBookmarks(bookmarks().bookmarks || []);
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
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;
    
    const newFolder = {
      name: folderName,
      type: 'folder',
      children: []
    };
    
    const updatedBookmarks = addBookmarkToCurrentPath(newFolder);
    
    // Optimistic update - update UI immediately
    updateUIAfterChange(updatedBookmarks);
    setShowAddMenu(false);
    
    // Save to Gist in background
    saveBookmarks(updatedBookmarks, true);
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
            class="px-2 py-1 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded"
            onClick={() => navigateToBreadcrumb(-1)}
          >
            Home
          </button>
          <For each={currentPath()}>
            {(pathItem, i) => (
              <>
                <span class="text-[var(--color-text-secondary)]">/</span>
                <button
                  class="px-2 py-1 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded"
                  onClick={() => navigateToBreadcrumb(i())}
                >
                  {pathItem.name}
                </button>
              </>
            )}
          </For>
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
        
        <div class="w-px h-6 bg-[var(--color-border)]"></div>
        
        {/* Scrollable bookmarks */}
        <div class="flex-1 overflow-x-auto overflow-y-hidden flex items-center gap-1">
          <For each={displayBookmarks()}>
            {(item, index) => (
              <BookmarkItem
                item={item}
                index={index()}
                onFolderClick={navigateToFolder}
                onDelete={handleDelete}
              />
            )}
          </For>
        </div>
        
        {/* Add buttons */}
        <Show 
          when={!showAddMenu()}
          fallback={
            <div class="flex items-center gap-1 shrink-0">
              <button
                class="px-2 py-1 text-xs bg-[var(--color-accent)] text-white rounded hover:bg-[var(--color-accent-hover)] transition-colors whitespace-nowrap"
                onClick={handleAddCurrentPage}
                title="Add current page as bookmark"
              >
                Page
              </button>
              <button
                class="px-2 py-1 text-xs bg-[var(--color-accent)] text-white rounded hover:bg-[var(--color-accent-hover)] transition-colors whitespace-nowrap"
                onClick={handleAddFolder}
                title="Add new folder"
              >
                Folder
              </button>
              <button
                class="px-2 py-1 text-xs bg-[var(--color-bg-hover)] text-[var(--color-text-primary)] rounded hover:bg-[var(--color-border)] transition-colors whitespace-nowrap"
                onClick={() => setShowAddMenu(false)}
                title="Cancel"
              >
                Cancel
              </button>
            </div>
          }
        >
          <div class="shrink-0">
            <button
              class="px-3 py-1.5 text-sm bg-[var(--color-accent)] text-white rounded hover:bg-[var(--color-accent-hover)] transition-colors"
              onClick={() => setShowAddMenu(true)}
            >
              + Add
            </button>
          </div>
        </Show>
      </Show>
    </div>
  );
}
