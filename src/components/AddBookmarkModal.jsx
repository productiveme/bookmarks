// AddBookmarkModal - Modal for adding new bookmarks
import { Show, For } from 'solid-js';

export default function AddBookmarkModal(props) {
  const handleSave = () => {
    if (!props.url().trim()) {
      alert('Please enter a URL');
      return;
    }
    props.onSave({
      name: props.name().trim() || props.url().trim(),
      url: props.url().trim(),
      folderPath: props.selectedFolder ? props.selectedFolder() : null
    });
  };

  const handleBackdropClick = () => {
    props.onCancel();
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <Show when={props.show}>
      <div 
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" 
        onClick={handleBackdropClick}
      >
        <div 
          class="bg-[var(--color-bg-primary)] rounded-lg shadow-xl max-w-md w-full p-6" 
          onClick={handleModalClick}
        >
          <h2 class="text-xl font-bold text-[var(--color-text-primary)] mb-4">
            Add Bookmark
          </h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-1 lowercase">
                url <span class="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={props.url()}
                onInput={(e) => props.setUrl(e.target.value)}
                placeholder="https://example.com"
                class="w-full px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                autofocus
                required
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Name <span class="text-[var(--color-text-secondary)] text-xs">(optional)</span>
              </label>
              <input
                type="text"
                value={props.name()}
                onInput={(e) => props.setName(e.target.value)}
                placeholder="Bookmark name (defaults to URL if empty)"
                class="w-full px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              />
            </div>

            <Show when={props.folderList && props.folderList.length > 0}>
              <div>
                <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Folder
                </label>
                <select
                  value={props.selectedFolder ? JSON.stringify(props.selectedFolder()) : '[]'}
                  onChange={(e) => props.setSelectedFolder(JSON.parse(e.target.value))}
                  class="w-full px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                >
                  <For each={props.folderList}>
                    {(folder) => (
                      <option value={JSON.stringify(folder.indices)}>
                        {folder.label}
                      </option>
                    )}
                  </For>
                </select>
              </div>
            </Show>
          </div>
          
          <div class="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              class="flex-1 px-4 py-2 bg-[var(--color-accent)] text-white rounded hover:bg-[var(--color-accent-hover)] transition-colors font-medium"
            >
              Add Bookmark
            </button>
            <button
              onClick={props.onCancel}
              class="flex-1 px-4 py-2 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded hover:bg-[var(--color-bg-hover)] transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}
