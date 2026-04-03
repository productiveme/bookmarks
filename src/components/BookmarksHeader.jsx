// BookmarksHeader - Header with title, search, breadcrumbs, and refresh
import { Show, For, createSignal, onMount, onCleanup } from 'solid-js';
import HomeIcon from './HomeIcon.jsx';
import BookmarkIcon from './BookmarkIcon.jsx';

export default function BookmarksHeader(props) {
  const [showMenu, setShowMenu] = createSignal(false);
  let menuRef;
  let searchInputRef;
  
  // Close menu when clicking outside
  const handleClickOutside = (e) => {
    if (menuRef && !menuRef.contains(e.target)) {
      setShowMenu(false);
    }
  };
  
  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    // Focus search input when pressing "/"
    if (e.key === '/' && searchInputRef && document.activeElement !== searchInputRef) {
      e.preventDefault();
      searchInputRef.focus();
    }
  };
  
  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
  });
  
  onCleanup(() => {
    document.removeEventListener('click', handleClickOutside);
    document.removeEventListener('keydown', handleKeyDown);
  });
  
  const handleImport = () => {
    setShowMenu(false);
    props.onImport();
  };
  
  const handleExport = () => {
    setShowMenu(false);
    props.onExport();
  };
  
  return (
    <div class="bg-[var(--color-bg-primary)] border-b border-[var(--color-border)] p-4">
      <div class="max-w-[1920px] mx-auto flex items-center justify-between gap-4">
        <div class="flex items-center gap-3 flex-1">
          <Show 
            when={props.configured}
            fallback={
              <h1 class="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <BookmarkIcon class="w-6 h-6 text-[var(--color-accent)]" />
                Bookmarks
              </h1>
            }
          >
            <button
              onClick={props.onRefresh}
              class="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors flex items-center gap-2"
              title="Reload bookmarks from Gist"
            >
              <BookmarkIcon class="w-6 h-6 text-[var(--color-accent)]" />
              Bookmarks
            </button>
          </Show>
          <Show when={!props.loading && !props.configured}>
            <a href="/setup" target="_blank" class="text-sm text-[var(--color-accent)] hover:underline">
              Setup Required
            </a>
          </Show>
        </div>
        
        <Show when={!props.loading && props.configured}>
          <div class="flex items-center gap-2">
            {/* Import/Export buttons - desktop only */}
            <button
              onClick={props.onImport}
              class="hidden sm:inline-flex px-3 py-2 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded hover:bg-[var(--color-bg-hover)] transition-colors text-sm whitespace-nowrap items-center"
              title="Import bookmarks from HTML file"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Import
            </button>
            <button
              onClick={props.onExport}
              class="hidden sm:inline-flex px-3 py-2 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded hover:bg-[var(--color-bg-hover)] transition-colors text-sm whitespace-nowrap items-center"
              title="Export bookmarks to HTML file"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Export
            </button>
            
            {/* Hamburger menu - mobile only */}
            <div class="relative sm:hidden" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu())}
                class="p-2 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded hover:bg-[var(--color-bg-hover)] transition-colors"
                title="Menu"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              {/* Dropdown menu */}
              <Show when={showMenu()}>
                <div class="absolute top-full right-0 mt-1 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded shadow-lg z-50 min-w-[160px]">
                  <button
                    onClick={handleImport}
                    class="w-full px-4 py-3 text-left text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors flex items-center gap-2"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Import
                  </button>
                  <button
                    onClick={handleExport}
                    class="w-full px-4 py-3 text-left text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors flex items-center gap-2 border-t border-[var(--color-border)]"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    Export
                  </button>
                </div>
              </Show>
            </div>
          </div>
        </Show>
      </div>
      
      {/* Breadcrumbs and Search */}
      <Show when={!props.loading && props.configured}>
        <div class="max-w-[1920px] mx-auto mt-3 flex items-center gap-2 text-sm flex-wrap">
          <button
            class="p-1.5 text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded transition-colors"
            onClick={props.onRefresh}
            title="Reload bookmarks from Gist"
          >
            <HomeIcon size="w-5 h-5" />
          </button>
          <For each={props.currentPath}>
            {(pathItem, i) => (
              <>
                <span class="text-[var(--color-text-secondary)]">/</span>
                <button
                  class="px-3 py-1.5 text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded transition-colors truncate max-w-[150px] sm:max-w-none"
                  onClick={() => props.onNavigateToBreadcrumb(i())}
                  title={pathItem.name}
                >
                  {pathItem.name}
                </button>
              </>
            )}
          </For>
          
          {/* Search input */}
          <div class="relative flex-1 ml-auto min-w-[200px] max-w-md">
            <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              ref={searchInputRef}
              value={props.searchQuery}
              onInput={props.onSearchInput}
              placeholder="Search..."
              class="pl-10 pr-10 py-1.5 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded focus:outline-none focus:border-[var(--color-accent)] w-full text-sm"
              autocapitalize="none"
              autocorrect="off"
            />
            <Show when={props.searchQuery.trim()}>
              <button
                onClick={props.onClearSearch}
                class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                title="Clear search"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  );
}
