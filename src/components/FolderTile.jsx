// FolderTile - Individual folder tile in grid view
export default function FolderTile(props) {
  return (
    <button
      onClick={props.onClick}
      class="group bg-[var(--color-bg-primary)] border-2 border-[var(--color-accent)] border-dashed rounded-lg p-4 hover:shadow-lg transition-shadow text-left w-full"
    >
      <div class="flex items-start justify-between mb-2">
        <svg class="w-5 h-5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <svg class="w-4 h-4 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>
      <h3 class="font-medium text-[var(--color-text-primary)] mb-1 line-clamp-2">{props.folder.name}</h3>
      <p class="text-xs text-[var(--color-text-secondary)]">Folder • Click to open</p>
    </button>
  );
}
