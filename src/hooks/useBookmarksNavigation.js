// useBookmarksNavigation - Hook for folder navigation and breadcrumb management
import { createSignal } from 'solid-js';

export function useBookmarksNavigation(bookmarks, loadBookmarks) {
  const [currentPath, setCurrentPath] = createSignal([]);
  const [currentBookmarks, setCurrentBookmarks] = createSignal([]);
  const [folders, setFolders] = createSignal([]);

  const updateCurrentView = (items, path) => {
    // Keep all items together in original order
    setCurrentBookmarks(items);
    setCurrentPath(path);
    
    // Still extract folders for sidebar
    const folderItems = items.filter(item => item.type === 'folder');
    setFolders(folderItems);
  };

  const navigateToFolder = (folder, index) => {
    const newPath = [...currentPath(), { name: folder.name, index }];
    setCurrentPath(newPath);
    
    const children = folder.children || [];
    updateCurrentView(children, newPath);
  };

  const navigateToBreadcrumb = async (targetIndex) => {
    if (targetIndex === -1) {
      // Navigate to root - reload from Gist
      const rootBookmarks = await loadBookmarks();
      updateCurrentView(rootBookmarks, []);
    } else {
      // Navigate to specific breadcrumb
      const newPath = currentPath().slice(0, targetIndex + 1);
      
      let current = bookmarks().bookmarks;
      for (const pathItem of newPath) {
        const folder = current[pathItem.index];
        if (folder && folder.type === 'folder') {
          current = folder.children || [];
        }
      }
      updateCurrentView(current, newPath);
    }
  };

  const handleFolderTileClick = (folder, index) => {
    navigateToFolder(folder, index);
  };

  const handleNavigateUp = async () => {
    // Navigate back to parent folder
    await navigateToBreadcrumb(currentPath().length - 2);
  };

  return {
    currentPath,
    currentBookmarks,
    folders,
    updateCurrentView,
    navigateToFolder,
    navigateToBreadcrumb,
    handleFolderTileClick,
    handleNavigateUp,
  };
}
