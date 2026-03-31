// BookmarkItem - Individual bookmark or folder
import { Show, createSignal } from 'solid-js';

export default function BookmarkItem(props) {
  const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false);
  
  const handleClick = (e) => {
    // Don't trigger if clicking delete buttons
    if (showDeleteConfirm()) return;
    
    if (props.item.type === 'folder') {
      props.onFolderClick?.(props.item, props.index);
    } else {
      // Open link in new tab
      window.open(props.item.url, '_blank');
    }
  };
  
  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };
  
  const handleDeleteConfirm = (e) => {
    e.stopPropagation();
    props.onDelete?.(props.index);
    setShowDeleteConfirm(false);
  };
  
  const handleDeleteCancel = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };
  
  return (
    <Show 
      when={!showDeleteConfirm()}
      fallback={
        <div class="flex items-center gap-2 px-3 py-1.5 rounded bg-[var(--color-bg-hover)]">
          <span class="text-sm text-[var(--color-text-secondary)]">Delete {props.item.name}?</span>
          <button
            class="px-2 py-0.5 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            onClick={handleDeleteConfirm}
          >
            Yes
          </button>
          <button
            class="px-2 py-0.5 text-xs bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded hover:bg-[var(--color-border)] transition-colors"
            onClick={handleDeleteCancel}
          >
            No
          </button>
        </div>
      }
    >
      <div class="flex items-center gap-0.5 rounded hover:bg-[var(--color-bg-hover)] transition-colors">
        <button
          class="pl-3 pr-0 py-1.5 text-[var(--color-text-primary)] text-sm whitespace-nowrap flex items-center gap-1.5"
          onClick={handleClick}
          title={props.item.type === 'link' ? props.item.url : `Open ${props.item.name}`}
        >
          <Show when={props.item.type === 'folder'} fallback={
            <svg class="w-3.5 h-3.5 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          }>
            <svg class="w-3.5 h-3.5 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </Show>
          <span>{props.item.name}</span>
          <Show when={props.item.type === 'folder'}>
            <svg class="w-3 h-3 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </Show>
        </button>
        
        <button
          class="px-0.5 py-0.5 text-[var(--color-text-secondary)] hover:text-red-500 transition-colors leading-none"
          onClick={handleDeleteClick}
          title="Delete"
        >
          <sup class="text-[9px] align-super relative -top-1">✕</sup>
        </button>
      </div>
    </Show>
  );
}
