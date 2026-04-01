// useBookmarkBarDragScroll - Hook for drag-to-scroll functionality in the bar
import { createSignal } from 'solid-js';

export function useBookmarkBarDragScroll() {
  const [isDragging, setIsDragging] = createSignal(false);
  const [startX, setStartX] = createSignal(0);
  const [scrollLeft, setScrollLeft] = createSignal(0);
  let scrollContainer;

  const setScrollContainerRef = (ref) => {
    scrollContainer = ref;
  };

  const handleMouseDown = (e) => {
    if (!scrollContainer) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainer.offsetLeft);
    setScrollLeft(scrollContainer.scrollLeft);
    scrollContainer.style.cursor = 'grabbing';
    scrollContainer.style.userSelect = 'none';
  };

  const handleMouseLeave = () => {
    if (!scrollContainer) return;
    setIsDragging(false);
    scrollContainer.style.cursor = 'grab';
    scrollContainer.style.userSelect = 'auto';
  };

  const handleMouseUp = () => {
    if (!scrollContainer) return;
    setIsDragging(false);
    scrollContainer.style.cursor = 'grab';
    scrollContainer.style.userSelect = 'auto';
  };

  const handleMouseMove = (e) => {
    if (!isDragging() || !scrollContainer) return;
    e.preventDefault();
    const x = e.pageX - scrollContainer.offsetLeft;
    const walk = (x - startX()) * 2; // Multiply by 2 for faster scrolling
    scrollContainer.scrollLeft = scrollLeft() - walk;
  };

  return {
    isDragging,
    setScrollContainerRef,
    handleMouseDown,
    handleMouseLeave,
    handleMouseUp,
    handleMouseMove,
  };
}
