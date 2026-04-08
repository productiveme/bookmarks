// BookmarkItem - Individual bookmark or folder
import { Show, createSignal, createEffect } from 'solid-js';
import FaviconImage from './FaviconImage.jsx';

// BookmarkletItem - Compact bookmarklet chip for the bar
function BookmarkletItem(props) {
  const [copied, setCopied] = createSignal(false);

  const handleCopy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(props.item.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy bookmarklet:', err);
    }
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    props.onEditStart?.();
  };

  return (
    <div class="flex items-center gap-0.5 rounded hover:bg-[var(--color-bg-hover)] transition-colors group">
      {/* JS badge — outside the <a> so it's excluded from the drag ghost */}
      <span class="ml-2 w-3.5 h-3.5 flex-shrink-0 flex items-center justify-center bg-yellow-400 text-black rounded-sm text-[8px] font-bold leading-none select-none pointer-events-none">
        JS
      </span>
      {/* Draggable anchor — only the name inside so the drag ghost shows just the name */}
      <a
        href={props.item.url}
        draggable="true"
        title="Drag to your bookmarks bar to install"
        onClick={(e) => e.preventDefault()}
        class="pl-1.5 pr-0 py-1.5 flex items-center gap-1 flex-shrink-0 no-underline cursor-grab active:cursor-grabbing"
        style="user-select: none; -webkit-user-drag: element;"
      >
        <span class="text-sm text-[var(--color-text-primary)] whitespace-nowrap select-none">{props.item.name}</span>
        {/* Drag hint arrow — subtle, visible on hover */}
        <svg class="w-3 h-3 text-[var(--color-text-secondary)] opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" title="Drag to bookmarks bar">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      </a>
      {/* Copy button */}
      <button
        onClick={handleCopy}
        title="Copy bookmarklet code"
        class="px-0.5 py-0.5 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors leading-none flex-shrink-0"
      >
        <Show
          when={copied()}
          fallback={
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          }
        >
          <svg class="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </Show>
      </button>
      {/* Edit gear */}
      <button
        class="px-0.5 py-0.5 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors leading-none flex-shrink-0"
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
  );
}

export default function BookmarkItem(props) {
  // Delegate bookmarklets to their own component (view mode only)
  // Edit/delete state is still managed here for uniformity
  const [editName, setEditName] = createSignal('');
  const [editUrl, setEditUrl] = createSignal('');
  const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false);
  let formRef;
  
  // Update edit values when item changes (e.g., after moving)
  createEffect(() => {
    if (props.isEditing) {
      setEditName(props.item.name);
      setEditUrl(props.item.url || '');
      // Scroll form into view after a brief delay to ensure it's rendered
      setTimeout(() => {
        if (formRef) {
          formRef.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
        }
      }, 100);
    }
  });
  
  const handleFolderClick = (e) => {
    // Don't trigger if editing
    if (props.isEditing) return;
    props.onFolderClick?.(props.item, props.index);
  };
  
  const handleBookmarkClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Don't interfere with editing
    if (props.isEditing) {
      return;
    }
    
    const url = props.item.url;
    if (!url) return;
    
    // Check for modifier keys - open in new tab
    if (e.metaKey || e.ctrlKey) {
      window.open(url, '_blank');
      return;
    }
    
    // Try to navigate parent window, with fallback to new tab
    try {
      if (window.parent && window.parent !== window) {
        window.parent.location.href = url;
      } else {
        window.location.href = url;
      }
    } catch (error) {
      // If blocked, open in new tab
      console.warn('Navigation blocked, opening in new tab:', error);
      window.open(url, '_blank');
    }
  };
  
  const handleEditClick = (e) => {
    e.stopPropagation();
    setEditName(props.item.name);
    setEditUrl(props.item.url || '');
    props.onEditStart?.();
  };
  
  const isBookmarkletUrl = (url) => url.trim().startsWith('javascript:');

  const handleSave = (e) => {
    e.stopPropagation();
    const updatedItem = {
      ...props.item,
      name: editName(),
    };
    
    // Update URL and auto-detect type for links and bookmarklets (not folders)
    if (props.item.type !== 'folder') {
      const url = editUrl();
      updatedItem.url = url;
      updatedItem.type = isBookmarkletUrl(url) ? 'bookmarklet' : 'link';
    }
    
    props.onEdit?.(props.index, updatedItem);
    props.onEditEnd?.();
  };
  
  const handleCancel = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
    props.onEditEnd?.();
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave(e);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel(e);
    }
  };
  
  const handleDelete = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };
  
  const handleConfirmDelete = (e) => {
    e.stopPropagation();
    props.onDelete?.(props.index);
    props.onEditEnd?.();
    setShowDeleteConfirm(false);
  };
  
  const handleCancelDelete = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };
  
  const handleMoveLeft = (e) => {
    e.stopPropagation();
    props.onMove?.(props.index, -1); // Move up (left) in the list
  };
  
  const handleMoveRight = (e) => {
    e.stopPropagation();
    props.onMove?.(props.index, 1); // Move down (right) in the list
  };
  
  const handleFormSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleSave(e);
  };
  
  // The editing/delete-confirm form is shared across all types (link, folder, bookmarklet)
  const editOrDeleteUI = (
    <Show
      when={showDeleteConfirm()}
      fallback={
        <form 
          ref={formRef}
          onSubmit={handleFormSubmit}
          class="flex items-center gap-1 px-2 py-1 rounded bg-[var(--color-bg-hover)]"
        >
          <button
            type="button"
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
            type="button"
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
              <Show when={props.item.type !== 'folder'}>
                <input
                  type="text"
                  value={editUrl()}
                  onInput={(e) => setEditUrl(e.target.value)}
                  placeholder="https://example.com or javascript:..."
                  class="px-2 py-0.5 text-xs bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] w-48"
                  onClick={(e) => e.stopPropagation()}
                />
                <Show when={isBookmarkletUrl(editUrl())}>
                  <span class="flex-shrink-0 flex items-center justify-center bg-yellow-400 text-black rounded-sm text-[8px] font-bold leading-none px-1 py-0.5 select-none">JS</span>
                </Show>
              </Show>
          <button
            type="submit"
            class="p-1 text-green-600 hover:text-green-700 transition-colors"
            title="Save"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </button>
          <button
            type="button"
            class="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            onClick={handleCancel}
            title="Cancel"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            type="button"
            class="p-1 text-red-600 hover:text-red-700 transition-colors"
            onClick={handleDelete}
            title="Delete"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </form>
      }
    >
      <div class="flex items-center gap-2 px-2 py-1 rounded bg-[var(--color-bg-hover)]">
        <span class="text-xs text-[var(--color-text-primary)] whitespace-nowrap">
          Delete {props.item.name}?
        </span>
        <button
          class="px-2 py-0.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors whitespace-nowrap"
          onClick={handleConfirmDelete}
        >
          Delete
        </button>
        <button
          class="px-2 py-0.5 text-xs bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded hover:bg-[var(--color-border)] transition-colors whitespace-nowrap"
          onClick={handleCancelDelete}
        >
          Cancel
        </button>
      </div>
    </Show>
  );

  // Bookmarklet view mode — draggable chip with JS badge, name, copy + edit buttons
  if (props.item.type === 'bookmarklet') {
    return (
      <Show when={!props.isEditing && !showDeleteConfirm()} fallback={editOrDeleteUI}>
        <BookmarkletItem
          item={props.item}
          index={props.index}
          onEditStart={props.onEditStart}
        />
      </Show>
    );
  }

  return (
    <Show 
      when={!props.isEditing && !showDeleteConfirm()}
      fallback={editOrDeleteUI}
    >
      <div class="flex items-center gap-0.5 rounded hover:bg-[var(--color-bg-hover)] transition-colors">
        <Show 
          when={props.item.type === 'folder'}
          fallback={
            <button
              onClick={handleBookmarkClick}
              class="pl-3 pr-0 py-1.5 text-[var(--color-text-primary)] text-sm whitespace-nowrap flex items-center gap-1.5 flex-shrink-0 no-underline bg-transparent border-0 cursor-pointer text-left"
              classList={{ 'pointer-events-none': props.isEditing }}
              title={props.item.url}
            >
              <FaviconImage 
                url={props.item.url}
                class="w-3.5 h-3.5 flex-shrink-0"
                fallbackIcon={
                  <svg class="w-3.5 h-3.5 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                }
              />
              <span class="truncate">{props.item.name}</span>
            </button>
          }
        >
          <button
            class="pl-3 pr-0 py-1.5 text-[var(--color-text-primary)] text-sm whitespace-nowrap flex items-center gap-1.5 flex-shrink-0"
            onClick={handleFolderClick}
            title={`Open ${props.item.name}`}
          >
            <svg class="w-3.5 h-3.5 text-[var(--color-text-secondary)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span class="truncate">{props.item.name}</span>
            <svg class="w-3 h-3 text-[var(--color-text-secondary)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </Show>
        
        <button
          class="px-0.5 py-0.5 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors leading-none flex-shrink-0"
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
