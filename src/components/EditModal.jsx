// EditModal - Modal for editing folders and bookmarks
import { createSignal, createEffect, Show, For } from 'solid-js';

export default function EditModal(props) {
  const [name, setName] = createSignal('');
  const [url, setUrl] = createSignal('');
  const [selectedFolder, setSelectedFolder] = createSignal([]);

  // Update signals when item or show changes
  createEffect(() => {
    if (props.show && props.item) {
      setName(props.item.name || '');
      setUrl(props.item.url || '');
      setSelectedFolder(props.currentFolderPath || []);
    }
  });

  const handleSave = () => {
    props.onSave({
      name: name(),
      url: url(),
      folderPath: selectedFolder()
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
            {props.isFolder ? 'Edit Folder' : 'Edit Bookmark'}
          </h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Name
              </label>
              <input
                type="text"
                value={name()}
                onInput={(e) => setName(e.target.value)}
                placeholder="Name"
                class="w-full px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                autofocus
              />
            </div>
            
            <Show when={!props.isFolder}>
              <div>
                <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  URL
                </label>
                <input
                  type="text"
                  value={url()}
                  onInput={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  class="w-full px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                />
              </div>
            </Show>

            <Show when={props.folderList && props.folderList.length > 0}>
              <div>
                <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  {props.isFolder ? 'Parent Folder' : 'Folder'}
                </label>
                <select
                  value={JSON.stringify(selectedFolder())}
                  onChange={(e) => setSelectedFolder(JSON.parse(e.target.value))}
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
              Save Changes
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
