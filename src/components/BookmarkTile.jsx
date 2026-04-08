// BookmarkTile - Individual bookmark tile in grid view
import { Show, createSignal } from 'solid-js';
import FaviconImage from './FaviconImage.jsx';

export default function BookmarkTile(props) {
  const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false);
  const [copied, setCopied] = createSignal(false);

  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    props.onEdit();
  };

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    props.onDelete?.();
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  const handleDragStart = (e) => {
    e.stopPropagation();
    props.onDragStart?.(e);
  };

  const handleTileClick = (e) => {
    // Don't navigate if dragging, editing buttons were clicked, or it's a bookmarklet
    if (props.isDragging) return;
    if (isBookmarklet()) return;
    const url = props.bookmark.url;
    if (!url) return;
    if (e.metaKey || e.ctrlKey) {
      window.open(url, '_blank');
      return;
    }
    try {
      if (window.parent && window.parent !== window) {
        window.parent.location.href = url;
      } else {
        window.location.href = url;
      }
    } catch (error) {
      window.open(url, '_blank');
    }
  };

  const handleCopyBookmarklet = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(props.bookmark.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy bookmarklet:', err);
      alert('Failed to copy to clipboard');
    }
  };

  const isBookmarklet = () => props.bookmark.type === 'bookmarklet';

  return (
    <Show
      when={!showDeleteConfirm()}
      fallback={
        <div class="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg p-4 hover:shadow-lg transition-all">
          <div class="flex flex-col items-center justify-center gap-3 py-2">
            <span class="text-sm text-[var(--color-text-primary)] text-center">
              Delete "{props.bookmark.name}"?
            </span>
            <div class="flex gap-2">
              <button
                onClick={handleConfirmDelete}
                class="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={handleCancelDelete}
                class="px-4 py-2 text-sm bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded hover:bg-[var(--color-border)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      }
    >
      <div 
        class="group bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer"
        classList={{
          'opacity-50': props.isDragging,
          'cursor-grab': props.draggable && !props.isDragging,
          'cursor-grabbing': props.isDragging,
        }}
        draggable={props.draggable}
        onClick={handleTileClick}
        onDragStart={handleDragStart}
        onDragEnd={props.onDragEnd}
      >
        <div class="flex items-start justify-between mb-2">
          <Show
            when={!isBookmarklet()}
            fallback={
              <div class="w-5 h-5 flex-shrink-0 flex items-center justify-center bg-yellow-400 text-black rounded text-xs font-bold">
                JS
              </div>
            }
          >
            <FaviconImage 
              url={props.bookmark.url}
              class="w-5 h-5 flex-shrink-0"
              fallbackIcon={
                <svg class="w-5 h-5 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              }
            />
          </Show>
          <div class="flex gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
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
        <Show
          when={!isBookmarklet()}
          fallback={
            <div class="block cursor-default">
              <h3 class="font-medium text-[var(--color-text-primary)] line-clamp-2 mb-1">{props.bookmark.name}</h3>
              <p class="text-xs text-[var(--color-text-secondary)] mb-3 line-clamp-2 font-mono">{props.bookmark.url.substring(0, 100)}{props.bookmark.url.length > 100 ? '...' : ''}</p>
              <div class="flex items-center gap-2">
                {/* Draggable anchor — name only inside so the drag ghost is clean */}
                <a
                  href={props.bookmark.url}
                  draggable="true"
                  title="Drag to your bookmarks bar to install"
                  onClick={(e) => e.preventDefault()}
                  class="flex-1 min-w-0 px-3 py-1.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white rounded text-sm font-medium truncate cursor-grab active:cursor-grabbing no-underline transition-colors text-center"
                  style="user-select: none; -webkit-user-drag: element;"
                >
                  {props.bookmark.name}
                </a>
                {/* Copy button */}
                <button
                  onClick={handleCopyBookmarklet}
                  title="Copy bookmarklet code"
                  class="flex-shrink-0 p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
                >
                  <Show
                    when={copied()}
                    fallback={
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    }
                  >
                    <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </Show>
                </button>
              </div>
            </div>
          }
        >
          <div class="block">
            <div class="flex items-start gap-2 mb-1">
              <h3 class="font-medium text-[var(--color-text-primary)] line-clamp-2 flex-1">{props.bookmark.name}</h3>
            </div>
            <p class="text-xs text-[var(--color-text-secondary)] truncate">{props.bookmark.url}</p>
          </div>
        </Show>
      </div>
    </Show>
  );
}
