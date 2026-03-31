// BookmarksSidebar - Left sidebar with folder list (hidden on mobile)
import { Show, For } from 'solid-js';

export default function BookmarksSidebar(props) {
  return (
    <div class="hidden md:block w-64 bg-[var(--color-bg-primary)] border-r border-[var(--color-border)] p-4 overflow-y-auto">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-semibold text-[var(--color-text-secondary)] uppercase">Folders</h2>
        <button
          onClick={props.onAddFolder}
          class="p-1.5 text-[var(--color-accent)] hover:bg-[var(--color-bg-hover)] rounded transition-colors"
          title="Add Folder"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>
      
      <Show when={props.folders.length === 0}>
        <p class="text-sm text-[var(--color-text-secondary)] italic">No folders</p>
      </Show>
      
      <div class="space-y-1">
        <For each={props.folders}>
          {(folder, index) => (
            <div class="group flex items-center gap-2 p-2 rounded hover:bg-[var(--color-bg-hover)] transition-colors">
              <button
                class="flex-1 flex items-center gap-2 text-left"
                onClick={() => props.onNavigateToFolder(folder, index())}
              >
                <svg class="w-5 h-5 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span class="text-[var(--color-text-primary)]">{folder.name}</span>
              </button>
              <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => props.onEdit(folder, index())}
                  class="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
                  title="Edit"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => props.onDelete(index())}
                  class="p-1 text-[var(--color-text-secondary)] hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
