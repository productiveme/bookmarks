// DropZone - Small drop target between items for reordering
export default function DropZone(props) {
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

  return (
    <div
      class="relative flex items-center justify-center transition-all"
      classList={{
        'w-2': !props.isActive,
        'w-8': props.isActive,
      }}
      onDragOver={handleDragOver}
      onDragLeave={props.onDragLeave}
      onDrop={handleDrop}
    >
      {/* Visual indicator when hovering */}
      <div 
        class="h-full w-1 bg-[var(--color-accent)] rounded-full transition-all"
        classList={{
          'opacity-0 scale-y-50': !props.isActive,
          'opacity-100 scale-y-100': props.isActive,
        }}
      ></div>
    </div>
  );
}
