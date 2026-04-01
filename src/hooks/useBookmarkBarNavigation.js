// useBookmarkBarNavigation - Hook for folder navigation and breadcrumb management in the bar
import { createSignal } from 'solid-js';

export function useBookmarkBarNavigation(bookmarks, loadBookmarks) {
  const [currentPath, setCurrentPath] = createSignal([]);
  const [currentBookmarks, setCurrentBookmarks] = createSignal([]);

  const navigateToFolder = (folder, index) => {
    setCurrentPath([...currentPath(), { name: folder.name, index }]);
    setCurrentBookmarks(folder.children || []);
  };

  // Find the full path to a folder in the bookmark tree
  const findFolderPath = (items, targetFolder, currentPathArray = []) => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Check if this is the folder we're looking for (by reference)
      if (item === targetFolder) {
        return [...currentPathArray, { name: item.name, index: i }];
      }
      
      // If it's a folder, search its children
      if (item.type === 'folder' && item.children) {
        const found = findFolderPath(
          item.children, 
          targetFolder, 
          [...currentPathArray, { name: item.name, index: i }]
        );
        if (found) return found;
      }
    }
    return null;
  };

  const navigateToFolderFromSearch = (folder) => {
    // Find the full path to this folder in the bookmark tree
    const path = findFolderPath(bookmarks().bookmarks || [], folder);
    
    if (path) {
      // Navigate to the folder using the full path
      setCurrentPath(path);
      setCurrentBookmarks(folder.children || []);
    }
  };

  const navigateToBreadcrumb = async (targetIndex) => {
    if (targetIndex === -1) {
      // Navigate to root - reload from Gist to get latest data
      const parsed = await loadBookmarks();
      if (parsed) {
        setCurrentPath([]);
        setCurrentBookmarks(parsed.bookmarks || []);
      }
    } else {
      // Navigate to specific breadcrumb
      const newPath = currentPath().slice(0, targetIndex + 1);
      setCurrentPath(newPath);
      
      // Navigate through the path
      let current = bookmarks().bookmarks;
      for (const pathItem of newPath) {
        const folder = current[pathItem.index];
        if (folder && folder.type === 'folder') {
          current = folder.children || [];
        }
      }
      setCurrentBookmarks(current);
    }
  };

  const updateUIAfterChange = (updatedBookmarks) => {
    // Update current view after data changes
    let current = updatedBookmarks.bookmarks;
    for (const pathItem of currentPath()) {
      const folder = current[pathItem.index];
      if (folder && folder.type === 'folder') {
        current = folder.children || [];
      }
    }
    setCurrentBookmarks(current);
  };

  const addBookmarkToCurrentPath = (newItem, updatedBookmarks) => {
    const data = JSON.parse(JSON.stringify(updatedBookmarks));
    let current = data.bookmarks;
    
    for (const pathItem of currentPath()) {
      current = current[pathItem.index].children;
    }
    
    current.push(newItem);
    return data;
  };

  return {
    currentPath,
    setCurrentPath,
    currentBookmarks,
    setCurrentBookmarks,
    navigateToFolder,
    navigateToFolderFromSearch,
    navigateToBreadcrumb,
    updateUIAfterChange,
    addBookmarkToCurrentPath,
  };
}
