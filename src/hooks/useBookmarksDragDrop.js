// useBookmarksDragDrop - Hook for drag-and-drop functionality
import { createSignal } from 'solid-js';

export function useBookmarksDragDrop(bookmarks, setBookmarks, currentPath, updateCurrentView, saveBookmarks) {
  const [draggedItem, setDraggedItem] = createSignal(null);
  const [dropTargetItem, setDropTargetItem] = createSignal(null);
  const [dropOnFolder, setDropOnFolder] = createSignal(false);
  const [dropZoneIndex, setDropZoneIndex] = createSignal(null);

  const handleDragStart = (item) => {
    setDraggedItem(item);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDropTargetItem(null);
    setDropOnFolder(false);
    setDropZoneIndex(null);
  };

  const handleDragOver = (e, targetItem, isFolder) => {
    e.preventDefault();
    setDropTargetItem(targetItem);
    setDropOnFolder(isFolder);
  };

  const handleDragLeave = () => {
    setDropTargetItem(null);
    setDropOnFolder(false);
  };

  const handleDrop = async (e, targetItem, targetIsFolder) => {
    e.preventDefault();
    
    const sourceItem = draggedItem();
    
    if (!sourceItem || !targetItem || sourceItem === targetItem) {
      handleDragEnd();
      return;
    }
    
    try {
      const data = JSON.parse(JSON.stringify(bookmarks()));
      let current = data.bookmarks;
      
      // Navigate to current folder
      for (const pathItem of currentPath()) {
        current = current[pathItem.index].children;
      }
      
      // Find source index
      const sourceIndex = current.findIndex(item => 
        item.name === sourceItem.name && 
        (item.url === sourceItem.url || item.type === 'folder')
      );
      
      if (sourceIndex === -1) {
        console.error('Source item not found');
        handleDragEnd();
        return;
      }
      
      const itemToMove = current[sourceIndex];
      
      // Case 1: Dropping onto a folder - move item into folder
      if (targetIsFolder) {
        const targetIndex = current.findIndex(item => 
          item.name === targetItem.name && item.type === 'folder'
        );
        
        if (targetIndex === -1) {
          console.error('Target folder not found');
          handleDragEnd();
          return;
        }
        
        const targetFolder = current[targetIndex];
        
        // Remove from current location
        current.splice(sourceIndex, 1);
        
        // Add to target folder
        if (!targetFolder.children) {
          targetFolder.children = [];
        }
        targetFolder.children.push(itemToMove);
      }
      // Case 2: Dropping next to another item - reorder
      else {
        const targetIndex = current.findIndex(item => 
          item.name === targetItem.name && 
          (item.url === targetItem.url || item.type === 'folder')
        );
        
        if (targetIndex === -1) {
          console.error('Target item not found');
          handleDragEnd();
          return;
        }
        
        // Remove from source position
        current.splice(sourceIndex, 1);
        
        // Adjust target index if we're moving down in the same list
        const adjustedIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
        
        // Insert at target position
        current.splice(adjustedIndex, 0, itemToMove);
      }
      
      setBookmarks(data);
      
      // Update current view
      let viewCurrent = data.bookmarks;
      for (const pathItem of currentPath()) {
        const folder = viewCurrent[pathItem.index];
        if (folder && folder.type === 'folder') {
          viewCurrent = folder.children || [];
        }
      }
      updateCurrentView(viewCurrent, currentPath());
      
      await saveBookmarks(data);
    } catch (err) {
      alert('Error moving item: ' + err.message);
    }
    
    handleDragEnd();
  };

  const handleDragOverParent = (e) => {
    e.preventDefault();
    setDropTargetItem({ name: '..' });
    setDropOnFolder(true);
  };

  const handleDropOnParent = async (e) => {
    e.preventDefault();
    
    const sourceItem = draggedItem();
    if (!sourceItem) {
      handleDragEnd();
      return;
    }
    
    try {
      const data = JSON.parse(JSON.stringify(bookmarks()));
      
      // Navigate to current folder
      let current = data.bookmarks;
      for (const pathItem of currentPath()) {
        current = current[pathItem.index].children;
      }
      
      // Find and remove source item from current folder
      const sourceIndex = current.findIndex(item => 
        item.name === sourceItem.name && 
        (item.url === sourceItem.url || item.type === 'folder')
      );
      
      if (sourceIndex === -1) {
        handleDragEnd();
        return;
      }
      
      const itemToMove = current[sourceIndex];
      current.splice(sourceIndex, 1);
      
      // Navigate to parent folder and add item there
      let parent = data.bookmarks;
      for (let i = 0; i < currentPath().length - 1; i++) {
        parent = parent[currentPath()[i].index].children;
      }
      
      parent.push(itemToMove);
      
      setBookmarks(data);
      updateCurrentView(current, currentPath());
      await saveBookmarks(data);
    } catch (err) {
      alert('Error moving item: ' + err.message);
    }
    
    handleDragEnd();
  };

  const handleDropZoneDragOver = (e, index) => {
    e.preventDefault();
    setDropZoneIndex(index);
    setDropTargetItem(null);
    setDropOnFolder(false);
  };

  const handleDropZoneDragLeave = () => {
    setDropZoneIndex(null);
  };

  const handleDropZoneDrop = async (e, targetIndex) => {
    e.preventDefault();
    
    const sourceItem = draggedItem();
    if (!sourceItem) {
      handleDragEnd();
      return;
    }
    
    try {
      const data = JSON.parse(JSON.stringify(bookmarks()));
      let current = data.bookmarks;
      
      // Navigate to current folder
      for (const pathItem of currentPath()) {
        current = current[pathItem.index].children;
      }
      
      // Find source index
      const sourceIndex = current.findIndex(item => 
        item.name === sourceItem.name && 
        (item.url === sourceItem.url || item.type === 'folder')
      );
      
      if (sourceIndex === -1) {
        console.error('Source item not found');
        handleDragEnd();
        return;
      }
      
      const itemToMove = current[sourceIndex];
      
      // Remove from source position
      current.splice(sourceIndex, 1);
      
      // Adjust target index if we're moving down in the same list
      const adjustedIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
      
      // Insert at target position
      current.splice(adjustedIndex, 0, itemToMove);
      
      setBookmarks(data);
      
      // Update current view
      let viewCurrent = data.bookmarks;
      for (const pathItem of currentPath()) {
        const folder = viewCurrent[pathItem.index];
        if (folder && folder.type === 'folder') {
          viewCurrent = folder.children || [];
        }
      }
      updateCurrentView(viewCurrent, currentPath());
      
      await saveBookmarks(data);
    } catch (err) {
      alert('Error moving item: ' + err.message);
    }
    
    handleDragEnd();
  };

  return {
    draggedItem,
    dropTargetItem,
    dropOnFolder,
    dropZoneIndex,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragOverParent,
    handleDropOnParent,
    handleDropZoneDragOver,
    handleDropZoneDragLeave,
    handleDropZoneDrop,
  };
}
