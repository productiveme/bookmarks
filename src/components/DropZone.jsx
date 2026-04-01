// DropZone - Visual drop indicator overlaid on tile edges for reordering
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
      class="absolute left-0 top-0 bottom-0 w-8 z-10 flex items-center justify-start transition-opacity"
      classList={{
        'opacity-0 pointer-events-none': !props.isActive,
        'opacity-100': props.isActive,
      }}
      onDragOver={handleDragOver}
      onDragLeave={props.onDragLeave}
      onDrop={handleDrop}
    >
      {/* Visual line indicator */}
      <div 
        class="h-full w-1 bg-[var(--color-accent)] rounded-full"
      ></div>
    </div>
  );
}
