// BookmarkTile - Individual bookmark tile in grid view
import FaviconImage from './FaviconImage.jsx';

export default function BookmarkTile(props) {
  const handleEdit = (e) => {
    e.preventDefault();
    props.onEdit();
  };

  const handleDelete = (e) => {
    e.preventDefault();
    props.onDelete();
  };

  return (
    <div class="group bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg p-4 hover:shadow-lg transition-shadow">
      <div class="flex items-start justify-between mb-2">
        <FaviconImage 
          url={props.bookmark.url}
          class="w-5 h-5 flex-shrink-0"
          fallbackIcon={
            <svg class="w-5 h-5 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          }
        />
        <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleEdit}
            class="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
            title="Edit"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            class="p-1 text-[var(--color-text-secondary)] hover:text-red-500 transition-colors"
            title="Delete"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      <a
        href={props.bookmark.url}
        class="block"
      >
        <div class="flex items-start gap-2 mb-1">
          <h3 class="font-medium text-[var(--color-text-primary)] line-clamp-2 flex-1">{props.bookmark.name}</h3>
        </div>
        <p class="text-xs text-[var(--color-text-secondary)] truncate">{props.bookmark.url}</p>
      </a>
    </div>
  );
}
