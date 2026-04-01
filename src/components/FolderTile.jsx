// FolderTile - Individual folder tile in grid view
export default function FolderTile(props) {
  const handleClick = (e) => {
    // Only trigger onClick if not currently dragging
    if (!props.isDragging) {
      props.onClick?.(e);
    }
  };

  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    props.onEdit?.();
  };

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    props.onDelete?.();
  };

  const handleDragStart = (e) => {
    e.stopPropagation();
    props.onDragStart?.(e);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    props.onDragOver?.(e);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    props.onDrop?.(e);
  };

  // Parent folder (..) has different icon and no edit/delete
  const isParentFolder = props.isParentFolder;

  return (
    <button
      onClick={handleClick}
      class="group bg-[var(--color-bg-primary)] border-2 border-dashed rounded-lg p-4 hover:shadow-lg transition-all text-left w-full"
      classList={{
        "opacity-50": props.isDragging,
        "border-[var(--color-accent)]": !props.isDropTarget,
        "border-[var(--color-accent)] bg-[var(--color-accent)]/10 border-solid":
          props.isDropTarget,
        "cursor-grab": props.draggable,
        "cursor-grabbing": props.isDragging,
      }}
      draggable={props.draggable}
      onDragStart={handleDragStart}
      onDragEnd={props.onDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={props.onDragLeave}
      onDrop={handleDrop}
    >
      <div class="flex items-start justify-between mb-2">
        {isParentFolder ? (
          <svg
            class="w-5 h-5 text-[var(--color-text-secondary)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        ) : (
          <svg
            class="w-5 h-5 text-[var(--color-accent)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
        )}
        <div class="flex items-center gap-1">
          {!isParentFolder && (
            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleEdit}
                class="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
                title="Edit"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                onClick={handleDelete}
                class="p-1 text-[var(--color-text-secondary)] hover:text-red-500 transition-colors"
                title="Delete"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          )}
          {!isParentFolder && (
            <svg
              class="w-4 h-4 text-[var(--color-text-secondary)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          )}
        </div>
      </div>
      <h3 class="font-medium text-[var(--color-text-primary)] mb-1 line-clamp-2">
        {props.folder.name}
      </h3>
      <p class="text-xs text-[var(--color-text-secondary)]">
        {isParentFolder ? "Click to go back" : "Click to open"}
      </p>
    </button>
  );
}
