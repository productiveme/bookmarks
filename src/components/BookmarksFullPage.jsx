// BookmarksFullPage - Bookmarks Manager with sidebar and tile grid
import { createSignal, Show, For, onMount } from 'solid-js';
import { getGithubToken, getGistId } from '../utils/storage.js';
import { parseYaml, stringifyYaml, deleteBookmarkAtPath, getFolderList } from '../utils/yaml.js';
import BookmarksHeader from './BookmarksHeader.jsx';
import BookmarksSidebar from './BookmarksSidebar.jsx';
import BookmarkTile from './BookmarkTile.jsx';
import FolderTile from './FolderTile.jsx';
import DropZone from './DropZone.jsx';
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
  
  // Drag and drop state
  const [draggedItem, setDraggedItem] = createSignal(null);
  const [dropTargetItem, setDropTargetItem] = createSignal(null);
  const [dropOnFolder, setDropOnFolder] = createSignal(false);
  const [dropZoneIndex, setDropZoneIndex] = createSignal(null); // Track which drop zone is active

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
    // Keep all items together in original order
    setCurrentBookmarks(items);
    setCurrentPath(path);
    
    // Still extract folders for sidebar
    const folderItems = items.filter(item => item.type === 'folder');
    setFolders(folderItems);
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
      
      // For folders, check if parent folder changed
      if (isFolder) {
        const actualIndex = index;
        const currentItemPath = [...currentPath().map(p => p.index), actualIndex];
        const newFolderPath = editedData.folderPath || [];
        
        const data = JSON.parse(JSON.stringify(bookmarks()));
        
        // Check if we're moving to a different parent folder
        const currentFolderPath = currentPath().map(p => p.index);
        const isMoving = JSON.stringify(currentFolderPath) !== JSON.stringify(newFolderPath);
        
        if (isMoving) {
          // Delete from current location
          let current = data.bookmarks;
          for (let i = 0; i < currentItemPath.length - 1; i++) {
            current = current[currentItemPath[i]].children;
          }
          const folderToMove = current[currentItemPath[currentItemPath.length - 1]];
          current.splice(currentItemPath[currentItemPath.length - 1], 1);
          
          // Update name
          folderToMove.name = editedData.name;
          
          // Add to new location
          let target = data.bookmarks;
          for (const idx of newFolderPath) {
            if (target[idx] && target[idx].type === 'folder') {
              target = target[idx].children;
            }
          }
          target.push(folderToMove);
        } else {
          // Update in place
          let current = data.bookmarks;
          for (let i = 0; i < currentItemPath.length - 1; i++) {
            current = current[currentItemPath[i]].children;
          }
          
          current[currentItemPath[currentItemPath.length - 1]] = {
            ...item,
            name: editedData.name
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

  const displayAllItems = () => {
    // When searching, show folders and bookmarks separately
    if (searchQuery().trim()) {
      return [...filteredFolders(), ...filteredBookmarks()];
    }
    // When browsing, show all items in original order
    return currentBookmarks();
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

  // Drag and drop handlers
  const handleDragStart = (item) => {
    setDraggedItem(item);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDropTargetItem(null);
    setDropOnFolder(false);
  };

  const handleDragOver = (e, targetItem, isFolder) => {
    e.preventDefault();
    setDropTargetItem(targetItem);
    setDropOnFolder(isFolder);
  };

  const handleDragLeave = () => {
    setDropTargetItem(null);
    setDropOnFolder(false);
  };

  const handleDrop = async (e, targetItem, targetIsFolder) => {
    e.preventDefault();
    
    const sourceItem = draggedItem();
    
    if (!sourceItem || !targetItem || sourceItem === targetItem) {
      handleDragEnd();
      return;
    }
    
    try {
      const data = JSON.parse(JSON.stringify(bookmarks()));
      let current = data.bookmarks;
      
      // Navigate to current folder
      for (const pathItem of currentPath()) {
        current = current[pathItem.index].children;
      }
      
      // Find source index
      const sourceIndex = current.findIndex(item => 
        item.name === sourceItem.name && 
        (item.url === sourceItem.url || item.type === 'folder')
      );
      
      if (sourceIndex === -1) {
        console.error('Source item not found');
        handleDragEnd();
        return;
      }
      
      const itemToMove = current[sourceIndex];
      
      // Case 1: Dropping onto a folder - move item into folder
      if (targetIsFolder) {
        const targetIndex = current.findIndex(item => 
          item.name === targetItem.name && item.type === 'folder'
        );
        
        if (targetIndex === -1) {
          console.error('Target folder not found');
          handleDragEnd();
          return;
        }
        
        const targetFolder = current[targetIndex];
        
        // Remove from current location
        current.splice(sourceIndex, 1);
        
        // Add to target folder
        if (!targetFolder.children) {
          targetFolder.children = [];
        }
        targetFolder.children.push(itemToMove);
      }
      // Case 2: Dropping next to another item - reorder
      else {
        const targetIndex = current.findIndex(item => 
          item.name === targetItem.name && 
          (item.url === targetItem.url || item.type === 'folder')
        );
        
        if (targetIndex === -1) {
          console.error('Target item not found');
          handleDragEnd();
          return;
        }
        
        // Remove from source position
        current.splice(sourceIndex, 1);
        
        // Adjust target index if we're moving down in the same list
        const adjustedIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
        
        // Insert at target position
        current.splice(adjustedIndex, 0, itemToMove);
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
    } catch (err) {
      alert('Error moving item: ' + err.message);
    }
    
    handleDragEnd();
  };

  const handleNavigateUp = async () => {
    // Navigate back to parent folder
    // Same as clicking the last breadcrumb minus one
    await navigateToBreadcrumb(currentPath().length - 2);
  };

  const handleDragOverParent = (e) => {
    e.preventDefault();
    setDropTargetItem({ name: '..' });
    setDropOnFolder(true);
  };

  const handleDropOnParent = async (e) => {
    e.preventDefault();
    
    const sourceItem = draggedItem();
    if (!sourceItem) {
      handleDragEnd();
      return;
    }
    
    try {
      const data = JSON.parse(JSON.stringify(bookmarks()));
      
      // Navigate to current folder
      let current = data.bookmarks;
      for (const pathItem of currentPath()) {
        current = current[pathItem.index].children;
      }
      
      // Find and remove source item from current folder
      const sourceIndex = current.findIndex(item => 
        item.name === sourceItem.name && 
        (item.url === sourceItem.url || item.type === 'folder')
      );
      
      if (sourceIndex === -1) {
        handleDragEnd();
        return;
      }
      
      const itemToMove = current[sourceIndex];
      current.splice(sourceIndex, 1);
      
      // Navigate to parent folder and add item there
      let parent = data.bookmarks;
      for (let i = 0; i < currentPath().length - 1; i++) {
        parent = parent[currentPath()[i].index].children;
      }
      
      parent.push(itemToMove);
      
      setBookmarks(data);
      updateCurrentView(current, currentPath());
      await saveBookmarks(data);
    } catch (err) {
      alert('Error moving item: ' + err.message);
    }
    
    handleDragEnd();
  };

  const handleDropZoneDragOver = (e, index) => {
    e.preventDefault();
    setDropZoneIndex(index);
    setDropTargetItem(null);
    setDropOnFolder(false);
  };

  const handleDropZoneDragLeave = () => {
    setDropZoneIndex(null);
  };

  const handleDropZoneDrop = async (e, targetIndex) => {
    e.preventDefault();
    
    const sourceItem = draggedItem();
    if (!sourceItem) {
      handleDragEnd();
      return;
    }
    
    try {
      const data = JSON.parse(JSON.stringify(bookmarks()));
      let current = data.bookmarks;
      
      // Navigate to current folder
      for (const pathItem of currentPath()) {
        current = current[pathItem.index].children;
      }
      
      // Find source index
      const sourceIndex = current.findIndex(item => 
        item.name === sourceItem.name && 
        (item.url === sourceItem.url || item.type === 'folder')
      );
      
      if (sourceIndex === -1) {
        console.error('Source item not found');
        handleDragEnd();
        return;
      }
      
      const itemToMove = current[sourceIndex];
      
      // Remove from source position
      current.splice(sourceIndex, 1);
      
      // Adjust target index if we're moving down in the same list
      const adjustedIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
      
      // Insert at target position
      current.splice(adjustedIndex, 0, itemToMove);
      
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
      alert('Error moving item: ' + err.message);
    }
    
    handleDragEnd();
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
            
            <Show when={displayBookmarks().length === 0 && displayFolders().length === 0 && currentPath().length === 0}>
              <div class="text-center py-12">
                <p class="text-[var(--color-text-secondary)]">
                  {searchQuery().trim() ? 'No results found' : 'No bookmarks in this folder'}
                </p>
              </div>
            </Show>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {/* Parent folder (..) - only show when not at root and not searching */}
              {/* No drop zone before parent folder */}
              <Show when={currentPath().length > 0 && !searchQuery().trim()}>
                <FolderTile
                  folder={{ name: '..', type: 'folder' }}
                  isParentFolder={true}
                  onClick={handleNavigateUp}
                  draggable={false}
                  onDragOver={(e) => handleDragOverParent(e)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDropOnParent(e)}
                  isDragging={false}
                  isDropTarget={dropTargetItem()?.name === '..' }
                />
              </Show>
              
              {/* All items (folders and bookmarks) with drop zone before each */}
              <For each={displayAllItems()}>
                {(item, index) => (
                  <div class="relative">
                    {/* Drop zone before this item */}
                    <Show when={!searchQuery().trim()}>
                      <div
                        class="absolute -left-2 top-0 bottom-0 w-4 z-10 flex items-center justify-start"
                        onDragOver={(e) => handleDropZoneDragOver(e, index())}
                        onDragLeave={handleDropZoneDragLeave}
                        onDrop={(e) => handleDropZoneDrop(e, index())}
                      >
                        <div 
                          class="h-full w-1 bg-[var(--color-accent)] rounded-full transition-opacity"
                          classList={{
                            'opacity-0': dropZoneIndex() !== index(),
                            'opacity-100': dropZoneIndex() === index(),
                          }}
                        ></div>
                      </div>
                    </Show>
                    
                    {/* The tile itself */}
                    <Show
                      when={item.type === 'folder'}
                      fallback={
                        <BookmarkTile
                          bookmark={item}
                          onEdit={() => handleEdit(item, index(), false)}
                          onDelete={() => handleDelete(index(), false)}
                          draggable={!searchQuery().trim()}
                          onDragStart={() => handleDragStart(item)}
                          onDragEnd={handleDragEnd}
                          isDragging={draggedItem() === item}
                        />
                      }
                    >
                      <FolderTile
                        folder={item}
                        onClick={() => handleFolderTileClick(item, index())}
                        onEdit={() => handleEdit(item, index(), true)}
                        onDelete={() => handleDelete(index(), true)}
                        draggable={!searchQuery().trim()}
                        onDragStart={() => handleDragStart(item)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, item, true)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, item, true)}
                        isDragging={draggedItem() === item}
                        isDropTarget={dropTargetItem() === item && dropOnFolder()}
                      />
                    </Show>
                  </div>
                )}
              </For>
              
              {/* Phantom tile at the end for final drop position */}
              <Show when={!searchQuery().trim() && displayAllItems().length > 0}>
                <div class="relative">
                  <div
                    class="absolute -left-2 top-0 bottom-0 w-4 z-10 flex items-center justify-start"
                    onDragOver={(e) => handleDropZoneDragOver(e, displayAllItems().length)}
                    onDragLeave={handleDropZoneDragLeave}
                    onDrop={(e) => handleDropZoneDrop(e, displayAllItems().length)}
                  >
                    <div 
                      class="h-full w-1 bg-[var(--color-accent)] rounded-full transition-opacity"
                      classList={{
                        'opacity-0': dropZoneIndex() !== displayAllItems().length,
                        'opacity-100': dropZoneIndex() === displayAllItems().length,
                      }}
                    ></div>
                  </div>
                  {/* Invisible phantom tile to hold space */}
                  <div class="opacity-0 pointer-events-none bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg p-4">
                    <div class="h-20"></div>
                  </div>
                </div>
              </Show>
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
