// BookmarkItem - Individual bookmark or folder
import { Show, createSignal } from 'solid-js';

export default function BookmarkItem(props) {
  const [isEditing, setIsEditing] = createSignal(false);
  const [editName, setEditName] = createSignal('');
  const [editUrl, setEditUrl] = createSignal('');
  
  const handleClick = (e) => {
    // Don't trigger if editing
    if (isEditing()) return;
    
    if (props.item.type === 'folder') {
      props.onFolderClick?.(props.item, props.index);
    } else {
      // Open link in new tab
      window.open(props.item.url, '_blank');
    }
  };
  
  const handleEditClick = (e) => {
    e.stopPropagation();
    setEditName(props.item.name);
    setEditUrl(props.item.url || '');
    setIsEditing(true);
  };
  
  const handleSave = (e) => {
    e.stopPropagation();
    const updatedItem = {
      ...props.item,
      name: editName(),
    };
    
    // Only update URL for links (not folders)
    if (props.item.type === 'link') {
      updatedItem.url = editUrl();
    }
    
    props.onEdit?.(props.index, updatedItem);
    setIsEditing(false);
  };
  
  const handleCancel = (e) => {
    e.stopPropagation();
    setIsEditing(false);
  };
  
  const handleDelete = (e) => {
    e.stopPropagation();
    props.onDelete?.(props.index);
    setIsEditing(false);
  };
  
  const handleMoveLeft = (e) => {
    e.stopPropagation();
    props.onMove?.(props.index, -1); // Move up (left) in the list
  };
  
  const handleMoveRight = (e) => {
    e.stopPropagation();
    props.onMove?.(props.index, 1); // Move down (right) in the list
  };
  
  return (
    <Show 
      when={!isEditing()}
      fallback={
        <div class="flex items-center gap-1 px-2 py-1 rounded bg-[var(--color-bg-hover)]">
          <button
            class="px-1 py-0.5 text-xs bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded hover:bg-[var(--color-border)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            onClick={handleMoveLeft}
            disabled={props.isFirst}
            title="Move left"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            class="px-1 py-0.5 text-xs bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded hover:bg-[var(--color-border)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            onClick={handleMoveRight}
            disabled={props.isLast}
            title="Move right"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <input
            type="text"
            value={editName()}
            onInput={(e) => setEditName(e.target.value)}
            placeholder="Name"
            class="px-2 py-0.5 text-xs bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] w-32"
            onClick={(e) => e.stopPropagation()}
          />
          <Show when={props.item.type === 'link'}>
            <input
              type="text"
              value={editUrl()}
              onInput={(e) => setEditUrl(e.target.value)}
              placeholder="URL"
              class="px-2 py-0.5 text-xs bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] w-48"
              onClick={(e) => e.stopPropagation()}
            />
          </Show>
          <button
            class="px-2 py-0.5 text-xs bg-[var(--color-accent)] text-white rounded hover:bg-[var(--color-accent-hover)] transition-colors whitespace-nowrap"
            onClick={handleSave}
          >
            Save
          </button>
          <button
            class="px-2 py-0.5 text-xs bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded hover:bg-[var(--color-border)] transition-colors whitespace-nowrap"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            class="px-2 py-0.5 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors whitespace-nowrap"
            onClick={handleDelete}
          >
            Delete
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
          class="px-0.5 py-0.5 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors leading-none"
          onClick={handleEditClick}
          title="Edit"
        >
          <sup class="inline-block relative -top-1">
            <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </sup>
        </button>
      </div>
    </Show>
  );
}
