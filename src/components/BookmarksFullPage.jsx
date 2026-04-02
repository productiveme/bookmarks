// BookmarksFullPage - Bookmarks Manager with sidebar and tile grid (REFACTORED)
import { createSignal, Show, For, onMount, createEffect } from 'solid-js';
import { getFolderList } from '../utils/yaml.js';
import { useBookmarksData } from '../hooks/useBookmarksData.js';
import { useBookmarksNavigation } from '../hooks/useBookmarksNavigation.js';
import { useBookmarksSearch } from '../hooks/useBookmarksSearch.js';
import { useBookmarksCRUD } from '../hooks/useBookmarksCRUD.js';
import { useBookmarksDragDrop } from '../hooks/useBookmarksDragDrop.js';
import BookmarksHeader from './BookmarksHeader.jsx';
import BookmarksSidebar from './BookmarksSidebar.jsx';
import BookmarkTile from './BookmarkTile.jsx';
import FolderTile from './FolderTile.jsx';
import EditModal from './EditModal.jsx';
import AddBookmarkModal from './AddBookmarkModal.jsx';

export default function BookmarksFullPage() {
  // Bookmarks data management
  const {
    bookmarks,
    setBookmarks,
    loading,
    error,
    configured,
    loadBookmarks,
    saveBookmarks,
  } = useBookmarksData();

  // Navigation
  const {
    currentPath,
    currentBookmarks,
    folders,
    updateCurrentView,
    navigateToFolder,
    navigateToFolderFromSearch,
    navigateToBreadcrumb,
    handleFolderTileClick,
    handleNavigateUp,
  } = useBookmarksNavigation(bookmarks, loadBookmarks);

  // Search
  const {
    searchQuery,
    handleSearchInput,
    handleClearSearch,
    displayBookmarks,
    displayFolders,
    displayAllItems,
  } = useBookmarksSearch(currentBookmarks, bookmarks);

  // CRUD operations
  const {
    showEditModal,
    showAddModal,
    setShowAddModal,
    editingItem,
    handleDelete,
    handleEdit,
    handleSaveEdit,
    handleCancelEdit,
    handleAddFolder,
    handleMoveUp,
    handleMoveDown,
  } = useBookmarksCRUD(bookmarks, setBookmarks, currentPath, folders, updateCurrentView, saveBookmarks);

  // Drag and drop
  const {
    draggedItem,
    dropTargetItem,
    dropOnFolder,
    dropZoneIndex,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragOverParent,
    handleDropOnParent,
    handleDropZoneDragOver,
    handleDropZoneDragLeave,
    handleDropZoneDrop,
  } = useBookmarksDragDrop(bookmarks, setBookmarks, currentPath, updateCurrentView, saveBookmarks);

  // Add bookmark modal state
  const [addName, setAddName] = createSignal('');
  const [addUrl, setAddUrl] = createSignal('');
  const [prefilledName, setPrefilledName] = createSignal('');
  const [prefilledUrl, setPrefilledUrl] = createSignal('');
  const [selectedFolder, setSelectedFolder] = createSignal([]);

  // Handle folder click with search context awareness
  const handleFolderClickWrapper = (folder, index) => {
    if (searchQuery().trim()) {
      // When searching, find the full path to the folder
      navigateToFolderFromSearch(folder);
      // Clear search after navigation
      handleClearSearch();
    } else {
      // When browsing normally, navigate using the index
      handleFolderTileClick(folder, index);
    }
  };

  // Watch for bookmarks to load and initialize the view (only at root)
  createEffect(() => {
    if (!loading() && configured() && bookmarks().bookmarks && currentBookmarks().length === 0 && currentPath().length === 0) {
      updateCurrentView(bookmarks().bookmarks, []);
    }
  });
  
  // Initialize bookmarks view after load
  onMount(() => {
    // Check if we came from a CSP-blocked page with page info
    const params = new URLSearchParams(window.location.search);
    const fromPage = params.get('fromPage');
    const pageTitle = params.get('title');
    const pageUrl = params.get('url');

    // Store pre-filled data if coming from a page, but don't auto-open modal
    if (fromPage === '1' && pageTitle && pageUrl) {
      setPrefilledName(decodeURIComponent(pageTitle));
      setPrefilledUrl(decodeURIComponent(pageUrl));
    }
  });

  const handleAddBookmark = () => {
    // Pre-fill from stored values if available
    if (prefilledName() && prefilledUrl()) {
      setAddName(prefilledName());
      setAddUrl(prefilledUrl());
    }
    setSelectedFolder(currentPath().map(p => p.index));
    setShowAddModal(true);
  };

  const handleSaveAdd = async (bookmarkData) => {
    try {
      const data = JSON.parse(JSON.stringify(bookmarks()));
      
      // Navigate to target folder
      let target = data.bookmarks;
      for (const idx of bookmarkData.folderPath) {
        if (target[idx] && target[idx].type === 'folder') {
          target = target[idx].children;
        }
      }
      
      target.push({
        type: 'link',
        name: bookmarkData.name,
        url: bookmarkData.url
      });
      
      setBookmarks(data);
      
      // Update current view if adding to current folder
      const currentFolderPath = currentPath().map(p => p.index);
      if (JSON.stringify(currentFolderPath) === JSON.stringify(bookmarkData.folderPath)) {
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
        onRefresh={() => navigateToBreadcrumb(-1)}
        onNavigateToBreadcrumb={navigateToBreadcrumb}
      />

      {/* Main Content */}
      <div class="flex-1 flex max-w-[1920px] mx-auto w-full">
        <Show when={loading()}>
          <div class="flex-1 flex items-center justify-center">
            <p class="text-[var(--color-text-secondary)]">Loading bookmarks...</p>
          </div>
        </Show>

        <Show when={error()}>
          <div class="flex-1 flex items-center justify-center p-6">
            <div class="text-center">
              <p class="text-red-500 mb-4">Error loading bookmarks: {error()}</p>
              <button
                onClick={loadBookmarks}
                class="px-4 py-2 bg-[var(--color-accent)] text-white rounded hover:bg-[var(--color-accent-hover)] transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </Show>

        <Show when={!loading() && !error() && !configured()}>
          <div class="flex-1 flex items-center justify-center p-6">
            <div class="text-center max-w-md">
              <h2 class="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
                Welcome to Bookmarks Manager
              </h2>
              <p class="text-[var(--color-text-secondary)] mb-6">
                To get started, you need to configure your GitHub token and Gist ID.
              </p>
              <a
                href="/setup"
                target="_blank"
                class="inline-block px-6 py-3 bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors font-medium"
              >
                Go to Setup
              </a>
            </div>
          </div>
        </Show>

        <Show when={!loading() && !error() && configured()}>
          {/* Sidebar - Folders (hidden on mobile) */}
          <BookmarksSidebar
            folders={folders()}
            currentPath={currentPath()}
            onAddFolder={handleAddFolder}
            onNavigateToFolder={navigateToFolder}
            onNavigateUp={handleNavigateUp}
            onEdit={handleEdit}
            onDelete={(index) => handleDelete(index, true)}
          />

          {/* Main Area - Bookmarks Grid */}
          <div class="flex-1 p-4 sm:p-6 overflow-y-auto">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div class="flex items-center gap-3">
                <h2 class="text-lg font-semibold text-[var(--color-text-primary)]">
                  {searchQuery().trim() ? 'Search Results' : 'Bookmarks'}
                </h2>
                <Show when={searchQuery().trim()}>
                  <button
                    onClick={handleClearSearch}
                    class="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded transition-colors"
                    title="Clear search"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </Show>
              </div>
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
                        onClick={() => handleFolderClickWrapper(item, index())}
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
        itemIndex={editingItem()?.index}
        totalItems={currentBookmarks().length}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
        isSearching={searchQuery().trim() !== ''}
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
