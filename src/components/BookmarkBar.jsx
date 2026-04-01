// BookmarkBar - Main bar with breadcrumbs and scrollable bookmarks (REFACTORED)
import { Show, For, createEffect } from 'solid-js';
import BookmarkItem from './BookmarkItem';
import HomeIcon from './HomeIcon.jsx';
import { useBookmarkBarData } from '../hooks/useBookmarkBarData.js';
import { useBookmarkBarNavigation } from '../hooks/useBookmarkBarNavigation.js';
import { useBookmarkBarSearch } from '../hooks/useBookmarkBarSearch.js';
import { useBookmarkBarEdit } from '../hooks/useBookmarkBarEdit.js';
import { useBookmarkBarDragScroll } from '../hooks/useBookmarkBarDragScroll.js';

export default function BookmarkBar(props) {
  // Data management
  const {
    bookmarks,
    setBookmarks,
    loading,
    error,
    configured,
    loadBookmarks,
    saveBookmarks,
  } = useBookmarkBarData();

  // Navigation
  const {
    currentPath,
    currentBookmarks,
    setCurrentBookmarks,
    navigateToFolder,
    navigateToBreadcrumb,
    updateUIAfterChange,
    addBookmarkToCurrentPath,
  } = useBookmarkBarNavigation(bookmarks, loadBookmarks);

  // Watch for bookmarks to load and initialize the view
  createEffect(() => {
    if (!loading() && configured() && bookmarks().bookmarks && currentBookmarks().length === 0) {
      setCurrentBookmarks(bookmarks().bookmarks);
    }
  });

  // Search
  const {
    showSearch,
    searchQuery,
    handleSearchInput,
    handleSearchToggle,
    handleSearchClear,
    displayBookmarks,
  } = useBookmarkBarSearch(bookmarks, currentBookmarks);

  // Edit operations
  const {
    editingIndex,
    setEditingIndex,
    showFolderInput,
    folderInputValue,
    setFolderInputValue,
    handleAddCurrentPage,
    handleAddFolder,
    handleFolderInputSave,
    handleFolderInputCancel,
    handleDelete,
    handleEdit,
    handleMove,
  } = useBookmarkBarEdit(bookmarks, setBookmarks, currentPath, updateUIAfterChange, saveBookmarks, addBookmarkToCurrentPath);

  // Drag-to-scroll
  const {
    setScrollContainerRef,
    handleMouseDown,
    handleMouseLeave,
    handleMouseUp,
    handleMouseMove,
  } = useBookmarkBarDragScroll();

  // Helper functions
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
            <HomeIcon size="w-4 h-4" />
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
          ref={setScrollContainerRef}
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
