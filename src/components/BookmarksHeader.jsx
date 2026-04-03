// BookmarksHeader - Header with title, search, breadcrumbs, and refresh
import { Show, For } from 'solid-js';
import HomeIcon from './HomeIcon.jsx';
import BookmarkIcon from './BookmarkIcon.jsx';

export default function BookmarksHeader(props) {
  return (
    <div class="bg-[var(--color-bg-primary)] border-b border-[var(--color-border)] p-4">
      <div class="max-w-[1920px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
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
          <div class="flex items-center gap-2 w-full sm:w-auto">
            {/* Import/Export buttons */}
            <button
              onClick={props.onImport}
              class="px-3 py-2 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded hover:bg-[var(--color-bg-hover)] transition-colors text-sm whitespace-nowrap"
              title="Import bookmarks from HTML file"
            >
              <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Import
            </button>
            <button
              onClick={props.onExport}
              class="px-3 py-2 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded hover:bg-[var(--color-bg-hover)] transition-colors text-sm whitespace-nowrap"
              title="Export bookmarks to HTML file"
            >
              <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Export
            </button>
            
            <div class="relative flex-1 sm:flex-none">
              <input
                type="text"
                value={props.searchQuery}
                onInput={props.onSearchInput}
                placeholder="Search bookmarks and folders..."
                class="px-4 py-2 pr-10 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded focus:outline-none focus:border-[var(--color-accent)] w-full sm:w-64"
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
      
      {/* Breadcrumbs */}
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
        </div>
      </Show>
    </div>
  );
}
