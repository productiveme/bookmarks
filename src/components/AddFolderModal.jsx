// AddFolderModal - Modal for creating new folders
import { Show } from "solid-js";

export default function AddFolderModal(props) {
  const handleSave = () => {
    if (!props.name().trim()) {
      alert("Please enter a folder name");
      return;
    }
    props.onSave(props.name().trim());
  };

  const handleBackdropClick = () => {
    props.onCancel();
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <Show when={props.show}>
      <div
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        <div
          class="bg-[var(--color-bg-primary)] rounded-lg shadow-xl max-w-sm w-full p-6"
          onClick={handleModalClick}
        >
          <h2 class="text-xl font-bold text-[var(--color-text-primary)] mb-4">
            New Folder
          </h2>

          <div>
            <label class="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Folder Name
            </label>
            <input
              type="text"
              value={props.name()}
              onInput={(e) => props.setName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter folder name"
              class="w-full px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              autofocus
              autocapitalize="words"
            />
          </div>

          <div class="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              class="flex-1 px-4 py-2 bg-[var(--color-accent)] text-white rounded hover:bg-[var(--color-accent-hover)] transition-colors font-medium"
            >
              Create Folder
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
