// BookmarksFullPage - Bookmarks Manager with sidebar and tile grid
import { createSignal, Show, For, onMount } from 'solid-js';
import { getGithubToken, getGistId } from '../utils/storage.js';
import { parseYaml, stringifyYaml, deleteBookmarkAtPath, getFolderList } from '../utils/yaml.js';
import BookmarksHeader from './BookmarksHeader.jsx';
import BookmarksSidebar from './BookmarksSidebar.jsx';
import BookmarkTile from './BookmarkTile.jsx';
import FolderTile from './FolderTile.jsx';
import EditModal from './EditModal.jsx';
import AddBookmarkModal from './AddBookmarkModal.jsx';

export default function BookmarksFullPage() {
  const [bookmarks, setBookmarks] = createSignal({ bookmarks: [] });
  const [currentPath, setCurrentPath] = createSignal([]);
  const [currentBookmarks, setCurrentBookmarks] = createSignal([]);
  const [folders, setFolders] = createSignal([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal(null);
  const [configured, setConfigured] = createSignal(false);
  const [searchQuery, setSearchQuery] = createSignal('');
  const [filteredBookmarks, setFilteredBookmarks] = createSignal([]);
  const [filteredFolders, setFilteredFolders] = createSignal([]);
  const [showEditModal, setShowEditModal] = createSignal(false);
  const [showAddModal, setShowAddModal] = createSignal(false);
  const [editingItem, setEditingItem] = createSignal(null);
  const [addName, setAddName] = createSignal('');
  const [addUrl, setAddUrl] = createSignal('');
  const [prefilledName, setPrefilledName] = createSignal('');
  const [prefilledUrl, setPrefilledUrl] = createSignal('');
  const [selectedFolder, setSelectedFolder] = createSignal([]);

  onMount(() => {
    const token = getGithubToken();
    const gistId = getGistId();
    const isConfigured = !!(token && gistId);
    
    setConfigured(isConfigured);
    
    if (isConfigured) {
      loadBookmarks();
    } else {
      setLoading(false);
    }

    // Check if we came from a CSP-blocked page with page info
    const params = new URLSearchParams(window.location.search);
    const fromPage = params.get('fromPage');
    const pageTitle = params.get('title');
    const pageUrl = params.get('url');

    if (fromPage === '1' && pageTitle && pageUrl && isConfigured) {
      // Store pre-filled data but don't show modal yet (user might want to navigate to a folder first)
      setPrefilledName(decodeURIComponent(pageTitle));
      setPrefilledUrl(decodeURIComponent(pageUrl));

      // Clean up URL parameters (remove them from address bar)
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
  });

  const loadBookmarks = async () => {
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
      updateCurrentView(parsed.bookmarks || [], []);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const updateCurrentView = (items, path) => {
    // Separate folders and links
    const folderItems = items.filter(item => item.type === 'folder');
    const linkItems = items.filter(item => item.type === 'link');
    
    setFolders(folderItems);
    setCurrentBookmarks(linkItems);
    setCurrentPath(path);
  };

  const navigateToFolder = (folder, index) => {
    const newPath = [...currentPath(), { name: folder.name, index }];
    updateCurrentView(folder.children || [], newPath);
  };

  const navigateToBreadcrumb = async (targetIndex) => {
    if (targetIndex === -1) {
      // Navigate to root - reload from Gist
      await loadBookmarks();
    } else {
      // Navigate to specific breadcrumb
      const newPath = currentPath().slice(0, targetIndex + 1);
      
      let current = bookmarks().bookmarks;
      for (const pathItem of newPath) {
        const folder = current[pathItem.index];
        if (folder && folder.type === 'folder') {
          current = folder.children || [];
        }
      }
      updateCurrentView(current, newPath);
    }
  };

  const saveBookmarks = async (updatedBookmarks) => {
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
    } catch (err) {
      throw new Error('Failed to save: ' + err.message);
    }
  };

  const handleDelete = async (index, isFolder) => {
    if (!confirm('Are you sure you want to delete this ' + (isFolder ? 'folder' : 'bookmark') + '?')) {
      return;
    }

    try {
      const allItems = [...folders(), ...currentBookmarks()];
      const actualIndex = isFolder ? index : folders().length + index;
      const path = [...currentPath().map(p => p.index), actualIndex];
      
      const updatedBookmarks = deleteBookmarkAtPath(bookmarks(), path);
      
      setBookmarks(updatedBookmarks);
      
      // Update current view
      let current = updatedBookmarks.bookmarks;
      for (const pathItem of currentPath()) {
        const folder = current[pathItem.index];
        if (folder && folder.type === 'folder') {
          current = folder.children || [];
        }
      }
      updateCurrentView(current, currentPath());
      
      await saveBookmarks(updatedBookmarks);
    } catch (err) {
      alert('Error deleting: ' + err.message);
    }
  };

  const handleEdit = (item, index, isFolder) => {
    setEditingItem({ item, index, isFolder });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (editedData) => {
    try {
      const { item, index, isFolder } = editingItem();
      
      // For folders, just update in place
      if (isFolder) {
        const actualIndex = index;
        const path = [...currentPath().map(p => p.index), actualIndex];
        
        const data = JSON.parse(JSON.stringify(bookmarks()));
        
        let current = data.bookmarks;
        for (let i = 0; i < path.length - 1; i++) {
          current = current[path[i]].children;
        }
        
        current[path[path.length - 1]] = {
          ...item,
          name: editedData.name
        };
        
        setBookmarks(data);
        
        // Update current view
        let viewCurrent = data.bookmarks;
        for (const pathItem of currentPath()) {
          const folder = viewCurrent[pathItem.index];
          if (folder && folder.type === 'folder') {
            viewCurrent = folder.children || [];
          }
        }
        updateCurrentView(viewCurrent, currentPath());
        
        await saveBookmarks(data);
      } else {
        // For bookmarks, check if folder changed
        const actualIndex = folders().length + index;
        const currentItemPath = [...currentPath().map(p => p.index), actualIndex];
        const newFolderPath = editedData.folderPath || [];
        
        const data = JSON.parse(JSON.stringify(bookmarks()));
        
        // Check if we're moving to a different folder
        const currentFolderPath = currentPath().map(p => p.index);
        const isMoving = JSON.stringify(currentFolderPath) !== JSON.stringify(newFolderPath);
        
        if (isMoving) {
          // Delete from current location
          let current = data.bookmarks;
          for (let i = 0; i < currentItemPath.length - 1; i++) {
            current = current[currentItemPath[i]].children;
          }
          current.splice(currentItemPath[currentItemPath.length - 1], 1);
          
          // Add to new location
          let target = data.bookmarks;
          for (const idx of newFolderPath) {
            if (target[idx] && target[idx].type === 'folder') {
              target = target[idx].children;
            }
          }
          target.push({
            type: 'link',
            name: editedData.name,
            url: editedData.url
          });
        } else {
          // Update in place
          let current = data.bookmarks;
          for (let i = 0; i < currentItemPath.length - 1; i++) {
            current = current[currentItemPath[i]].children;
          }
          
          current[currentItemPath[currentItemPath.length - 1]] = {
            ...item,
            name: editedData.name,
            url: editedData.url
          };
        }
        
        setBookmarks(data);
        
        // Update current view
        let viewCurrent = data.bookmarks;
        for (const pathItem of currentPath()) {
          const folder = viewCurrent[pathItem.index];
          if (folder && folder.type === 'folder') {
            viewCurrent = folder.children || [];
          }
        }
        updateCurrentView(viewCurrent, currentPath());
        
        await saveBookmarks(data);
      }
      
      setShowEditModal(false);
      setEditingItem(null);
    } catch (err) {
      alert('Error saving: ' + err.message);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingItem(null);
  };

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
      setFilteredFolders(results.filter(item => item.type === 'folder'));
      setFilteredBookmarks(results.filter(item => item.type === 'link'));
    } else {
      setFilteredFolders([]);
      setFilteredBookmarks([]);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setFilteredFolders([]);
    setFilteredBookmarks([]);
  };

  const handleSearchFolderClick = (folder) => {
    // Find the path to this folder in the bookmarks tree
    const findFolderPath = (items, target, currentPath = []) => {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item === target) {
          return [...currentPath, { name: item.name, index: i }];
        }
        if (item.type === 'folder' && item.children) {
          const found = findFolderPath(item.children, target, [...currentPath, { name: item.name, index: i }]);
          if (found) return found;
        }
      }
      return null;
    };

    const path = findFolderPath(bookmarks().bookmarks || [], folder);
    if (path) {
      // Clear search
      handleClearSearch();
      
      // Navigate to the folder
      setCurrentPath(path);
      updateCurrentView(folder.children || [], path);
    }
  };

  const handleFolderTileClick = (folder, index) => {
    if (searchQuery().trim()) {
      // When searching, find the folder path and navigate to it
      handleSearchFolderClick(folder);
    } else {
      // When browsing normally, navigate to the folder directly
      navigateToFolder(folder, index);
    }
  };

  const displayBookmarks = () => {
    if (searchQuery().trim()) {
      return filteredBookmarks();
    }
    return currentBookmarks();
  };

  const displayFolders = () => {
    if (searchQuery().trim()) {
      return filteredFolders();
    }
    // Show current folders as tiles when not searching
    return folders();
  };

  const handleAddFolder = async () => {
    const name = prompt('Enter folder name:');
    if (!name || !name.trim()) return;

    try {
      const data = JSON.parse(JSON.stringify(bookmarks()));
      
      let current = data.bookmarks;
      for (const pathItem of currentPath()) {
        current = current[pathItem.index].children;
      }
      
      if (!Array.isArray(current)) {
        current = [];
      }
      
      current.push({
        type: 'folder',
        name: name.trim(),
        children: []
      });
      
      setBookmarks(data);
      
      // Update current view
      let viewCurrent = data.bookmarks;
      for (const pathItem of currentPath()) {
        const folder = viewCurrent[pathItem.index];
        if (folder && folder.type === 'folder') {
          viewCurrent = folder.children || [];
        }
      }
      updateCurrentView(viewCurrent, currentPath());
      
      await saveBookmarks(data);
    } catch (err) {
      alert('Error adding folder: ' + err.message);
    }
  };

  const handleAddBookmark = () => {
    // Check if we have pre-filled values from CSP fallback
    if (prefilledName() || prefilledUrl()) {
      // Use pre-filled values on first click
      setAddName(prefilledName());
      setAddUrl(prefilledUrl());
      // Clear pre-filled values so next time starts fresh
      setPrefilledName('');
      setPrefilledUrl('');
    } else {
      // Clear any previous values and show modal
      setAddName('');
      setAddUrl('');
    }
    // Set selected folder to current path
    setSelectedFolder(currentPath().map(p => p.index));
    setShowAddModal(true);
  };

  const handleSaveAdd = async (addData) => {
    try {
      const data = JSON.parse(JSON.stringify(bookmarks()));
      
      // Use the selected folder path from addData, or current path as fallback
      const targetPath = addData.folderPath !== null ? addData.folderPath : currentPath().map(p => p.index);
      
      let current = data.bookmarks;
      for (const index of targetPath) {
        if (current[index] && current[index].type === 'folder') {
          current = current[index].children;
        }
      }
      
      if (!Array.isArray(current)) {
        current = [];
      }
      
      current.push({
        type: 'link',
        name: addData.name,
        url: addData.url
      });
      
      setBookmarks(data);
      
      // Update current view only if we're still in the same folder
      const currentIndices = currentPath().map(p => p.index);
      if (JSON.stringify(currentIndices) === JSON.stringify(targetPath)) {
        let viewCurrent = data.bookmarks;
        for (const pathItem of currentPath()) {
          const folder = viewCurrent[pathItem.index];
          if (folder && folder.type === 'folder') {
            viewCurrent = folder.children || [];
          }
        }
        updateCurrentView(viewCurrent, currentPath());
      }
      
      await saveBookmarks(data);
      
      // Close modal and clear state
      setShowAddModal(false);
      setAddName('');
      setAddUrl('');
      // Also clear any remaining pre-filled values
      setPrefilledName('');
      setPrefilledUrl('');
    } catch (err) {
      alert('Error adding bookmark: ' + err.message);
    }
  };

  const handleCancelAdd = () => {
    setShowAddModal(false);
    setAddName('');
    setAddUrl('');
    // Also clear any remaining pre-filled values
    setPrefilledName('');
    setPrefilledUrl('');
  };

  return (
    <div class="min-h-screen bg-[var(--color-bg-secondary)] flex flex-col">
      {/* Header */}
      <BookmarksHeader
        loading={loading()}
        configured={configured()}
        searchQuery={searchQuery()}
        currentPath={currentPath()}
        onSearchInput={handleSearchInput}
        onClearSearch={handleClearSearch}
        onRefresh={loadBookmarks}
        onNavigateToBreadcrumb={navigateToBreadcrumb}
      />

      {/* Main Content */}
      <div class="flex-1 flex max-w-[1920px] mx-auto w-full">
        <Show when={loading()}>
          <div class="flex-1 flex items-center justify-center p-8">
            <div class="text-[var(--color-text-secondary)] text-lg">Loading bookmarks...</div>
          </div>
        </Show>

        <Show when={error()}>
          <div class="flex-1 flex items-center justify-center p-8">
            <div class="text-red-500 text-lg">{error()}</div>
          </div>
        </Show>

        <Show when={!loading() && !error() && !configured()}>
          <div class="flex-1 flex items-center justify-center p-8">
            <div class="text-center">
              <p class="text-[var(--color-text-secondary)] mb-4">Please configure your GitHub token and Gist ID</p>
              <a href="/setup" target="_blank" class="px-6 py-3 bg-[var(--color-accent)] text-white rounded hover:bg-[var(--color-accent-hover)] transition-colors inline-block">
                Go to Setup
              </a>
            </div>
          </div>
        </Show>

        <Show when={!loading() && !error() && configured()}>
          {/* Sidebar - Folders (hidden on mobile) */}
          <BookmarksSidebar
            folders={folders()}
            onAddFolder={handleAddFolder}
            onNavigateToFolder={navigateToFolder}
            onEdit={handleEdit}
            onDelete={(index) => handleDelete(index, true)}
          />

          {/* Main Area - Bookmarks Grid */}
          <div class="flex-1 p-4 sm:p-6 overflow-y-auto">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <h2 class="text-lg font-semibold text-[var(--color-text-primary)]">
                {searchQuery().trim() ? 'Search Results' : 'Bookmarks'}
              </h2>
              <Show when={!searchQuery().trim()}>
                <button
                  onClick={handleAddBookmark}
                  class="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-white rounded hover:bg-[var(--color-accent-hover)] transition-colors w-full sm:w-auto justify-center"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add Bookmark</span>
                </button>
              </Show>
            </div>
            
            <Show when={displayBookmarks().length === 0 && displayFolders().length === 0}>
              <div class="text-center py-12">
                <p class="text-[var(--color-text-secondary)]">
                  {searchQuery().trim() ? 'No results found' : 'No bookmarks in this folder'}
                </p>
              </div>
            </Show>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {/* Folder tiles */}
              <For each={displayFolders()}>
                {(folder, index) => (
                  <FolderTile
                    folder={folder}
                    onClick={() => handleFolderTileClick(folder, index())}
                  />
                )}
              </For>
              
              {/* Bookmark tiles */}
              <For each={displayBookmarks()}>
                {(bookmark, index) => (
                  <BookmarkTile
                    bookmark={bookmark}
                    onEdit={() => handleEdit(bookmark, index(), false)}
                    onDelete={() => handleDelete(index(), false)}
                  />
                )}
              </For>
            </div>
          </div>
        </Show>
      </div>

      {/* Edit Modal */}
      <EditModal
        show={showEditModal()}
        item={editingItem()?.item}
        isFolder={editingItem()?.isFolder}
        currentFolderPath={currentPath().map(p => p.index)}
        folderList={getFolderList(bookmarks())}
        onSave={handleSaveEdit}
        onCancel={handleCancelEdit}
      />

      {/* Add Bookmark Modal */}
      <AddBookmarkModal
        show={showAddModal()}
        name={addName}
        setName={setAddName}
        url={addUrl}
        setUrl={setAddUrl}
        selectedFolder={selectedFolder}
        setSelectedFolder={setSelectedFolder}
        folderList={getFolderList(bookmarks())}
        onSave={handleSaveAdd}
        onCancel={handleCancelAdd}
      />
    </div>
  );
}
