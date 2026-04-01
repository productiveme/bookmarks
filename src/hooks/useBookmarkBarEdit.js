// useBookmarkBarEdit - Hook for editing, adding, deleting, and moving bookmarks/folders in the bar
import { createSignal } from 'solid-js';
import { deleteBookmarkAtPath } from '../utils/yaml.js';

export function useBookmarkBarEdit(bookmarks, setBookmarks, currentPath, updateUIAfterChange, saveBookmarks, addBookmarkToCurrentPath, scrollToEnd) {
  const [editingIndex, setEditingIndex] = createSignal(null);
  const [showFolderInput, setShowFolderInput] = createSignal(false);
  const [folderInputValue, setFolderInputValue] = createSignal('');

  const handleAddCurrentPage = async () => {
    // Get current page info from parent window
    try {
      console.log('handleAddCurrentPage called');
      
      // Access the global function
      const getCurrentPageInfo = window.getCurrentPageInfo;
      if (!getCurrentPageInfo) {
        console.error('getCurrentPageInfo not available');
        alert('Unable to get current page info. Make sure you\'re using the bookmarklet.');
        return;
      }
      
      const pageInfo = await getCurrentPageInfo();
      console.log('Page info received:', pageInfo);
      
      if (!pageInfo) {
        console.error('No page info returned');
        alert('Could not get page information from the parent window.');
        return;
      }
      
      const newBookmark = {
        name: pageInfo.title || pageInfo.url,
        type: 'link',
        url: pageInfo.url
      };
      
      console.log('Adding bookmark:', newBookmark);
      
      // Add to current location
      const updatedBookmarks = addBookmarkToCurrentPath(newBookmark, bookmarks());
      
      // Optimistic update - update UI immediately
      setBookmarks(updatedBookmarks);
      updateUIAfterChange(updatedBookmarks);
      
      // Scroll to show the new bookmark
      scrollToEnd();
      
      // Save to Gist in background
      await saveBookmarks(updatedBookmarks, true);
    } catch (err) {
      console.error('Error adding bookmark:', err);
      alert('Error adding bookmark: ' + err.message);
    }
  };

  const handleAddFolder = () => {
    console.log('handleAddFolder called - showing inline input');
    setShowFolderInput(true);
    setFolderInputValue('');
    // Focus the input after it's rendered
    setTimeout(() => {
      const input = document.getElementById('inline-folder-input');
      if (input) input.focus();
    }, 10);
  };

  const handleFolderInputSave = async () => {
    const folderName = folderInputValue().trim();
    if (!folderName) {
      setShowFolderInput(false);
      return;
    }
    
    console.log('Creating folder:', folderName);
    
    const newFolder = {
      name: folderName,
      type: 'folder',
      children: []
    };
    
    const updatedBookmarks = addBookmarkToCurrentPath(newFolder, bookmarks());
    
    // Optimistic update - update UI immediately
    setBookmarks(updatedBookmarks);
    updateUIAfterChange(updatedBookmarks);
    setShowFolderInput(false);
    setFolderInputValue('');
    
    // Scroll to show the new folder
    scrollToEnd();
    
    // Save to Gist in background
    await saveBookmarks(updatedBookmarks, true);
  };

  const handleFolderInputCancel = () => {
    setShowFolderInput(false);
    setFolderInputValue('');
  };

  const handleDelete = async (index) => {
    try {
      // Build the full path to this bookmark
      const path = [...currentPath().map(p => p.index), index];
      
      // Delete from bookmarks data
      const updatedBookmarks = deleteBookmarkAtPath(bookmarks(), path);
      
      // Optimistic update - update UI immediately
      setBookmarks(updatedBookmarks);
      updateUIAfterChange(updatedBookmarks);
      
      // Save to Gist in background
      await saveBookmarks(updatedBookmarks, true);
    } catch (err) {
      console.error('Error deleting bookmark:', err);
      alert('Error deleting bookmark: ' + err.message);
    }
  };

  const handleEdit = async (index, updatedItem) => {
    try {
      // Build the full path to this bookmark
      const path = [...currentPath().map(p => p.index), index];
      
      // Deep clone the bookmarks data
      const data = JSON.parse(JSON.stringify(bookmarks()));
      
      // Navigate to the item and update it
      let current = data.bookmarks;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]].children;
      }
      
      // Update the item at the final index
      current[path[path.length - 1]] = updatedItem;
      
      // Optimistic update - update UI immediately
      setBookmarks(data);
      updateUIAfterChange(data);
      
      // Save to Gist in background
      await saveBookmarks(data, true);
    } catch (err) {
      console.error('Error editing bookmark:', err);
      alert('Error editing bookmark: ' + err.message);
    }
  };

  const handleMove = async (index, direction) => {
    try {
      // Build the full path to this bookmark
      const path = [...currentPath().map(p => p.index), index];
      
      // Deep clone the bookmarks data
      const data = JSON.parse(JSON.stringify(bookmarks()));
      
      // Navigate to the parent array
      let current = data.bookmarks;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]].children;
      }
      
      // Calculate new position
      const currentIndex = path[path.length - 1];
      const newIndex = currentIndex + direction;
      
      // Check bounds
      if (newIndex < 0 || newIndex >= current.length) {
        return;
      }
      
      // Swap items
      const temp = current[currentIndex];
      current[currentIndex] = current[newIndex];
      current[newIndex] = temp;
      
      // Update editing index if this item is being edited
      if (editingIndex() === index) {
        setEditingIndex(newIndex);
      } else if (editingIndex() === newIndex) {
        // If the item at newIndex was being edited, it moves to currentIndex
        setEditingIndex(currentIndex);
      }
      
      // Optimistic update - update UI immediately
      setBookmarks(data);
      updateUIAfterChange(data);
      
      // Save to Gist in background
      await saveBookmarks(data, true);
    } catch (err) {
      console.error('Error moving bookmark:', err);
      alert('Error moving bookmark: ' + err.message);
    }
  };

  return {
    editingIndex,
    setEditingIndex,
    showFolderInput,
    setShowFolderInput,
    folderInputValue,
    setFolderInputValue,
    handleAddCurrentPage,
    handleAddFolder,
    handleFolderInputSave,
    handleFolderInputCancel,
    handleDelete,
    handleEdit,
    handleMove,
  };
}
