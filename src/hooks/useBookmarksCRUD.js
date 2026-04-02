// useBookmarksCRUD - Hook for create, update, delete operations
import { createSignal } from 'solid-js';
import { deleteBookmarkAtPath } from '../utils/yaml.js';
import { clearFaviconCache } from '../components/FaviconImage.jsx';

export function useBookmarksCRUD(bookmarks, setBookmarks, currentPath, folders, updateCurrentView, saveBookmarks) {
  const [showEditModal, setShowEditModal] = createSignal(false);
  const [showAddModal, setShowAddModal] = createSignal(false);
  const [editingItem, setEditingItem] = createSignal(null);

  const handleDelete = async (index, isFolder) => {
    console.log('[CRUD] handleDelete called with index:', index, 'isFolder:', isFolder);

    try {
      console.log('[DELETE] Starting delete - index:', index, 'isFolder:', isFolder);
      console.log('[DELETE] Current path:', currentPath().map(p => `${p.name}[${p.index}]`).join(' / '));
      console.log('[DELETE] Bookmarks data:', bookmarks());
      
      // Get the item before deleting to clear favicon cache
      let current = bookmarks().bookmarks;
      const pathItems = currentPath();
      
      console.log('[DELETE] Path items:', pathItems);
      console.log('[DELETE] Current bookmarks array length:', current?.length);
      
      // Navigate to current folder
      if (pathItems.length > 0) {
        for (const pathItem of pathItems) {
          current = current[pathItem.index].children;
        }
      }
      
      console.log('[DELETE] After navigation, current array length:', current?.length);
      const itemToDelete = current[index];
      console.log('[DELETE] Item to delete:', itemToDelete);
      
      // Clear favicon cache if it's a bookmark
      if (!isFolder && itemToDelete?.url) {
        console.log('[DELETE] Clearing favicon cache for:', itemToDelete.url);
        clearFaviconCache(itemToDelete.url);
      }
      
      // index is already correct from displayAllItems()
      const actualIndex = index;
      const path = [...pathItems.map(p => p.index), actualIndex];
      
      console.log('[DELETE] Computed delete path:', path);
      
      const updatedBookmarks = deleteBookmarkAtPath(bookmarks(), path);
      console.log('[DELETE] Updated bookmarks:', updatedBookmarks);
      
      setBookmarks(updatedBookmarks);
      
      // Update current view
      current = updatedBookmarks.bookmarks;
      for (const pathItem of pathItems) {
        const folder = current[pathItem.index];
        if (folder && folder.type === 'folder') {
          current = folder.children || [];
        }
      }
      
      console.log('[DELETE] Updated current view, items count:', current.length);
      
      updateCurrentView(current, pathItems);
      
      console.log('[DELETE] Saving to Gist...');
      await saveBookmarks(updatedBookmarks);
      
      console.log('[DELETE] Successfully completed');
    } catch (err) {
      console.error('[DELETE] Error:', err);
      alert('Error deleting: ' + err.message);
    }
  };

  const handleEdit = (item, index, isFolder) => {
    setEditingItem({ item, index, isFolder });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (editedData) => {
    try {
      const { item, index, isFolder } = editingItem();
      
      // For folders, check if parent folder changed
      if (isFolder) {
        const actualIndex = index;
        const currentItemPath = [...currentPath().map(p => p.index), actualIndex];
        const newFolderPath = editedData.folderPath || [];
        
        const data = JSON.parse(JSON.stringify(bookmarks()));
        
        // Check if we're moving to a different parent folder
        const currentFolderPath = currentPath().map(p => p.index);
        const isMoving = JSON.stringify(currentFolderPath) !== JSON.stringify(newFolderPath);
        
        if (isMoving) {
          // Delete from current location
          let current = data.bookmarks;
          for (let i = 0; i < currentItemPath.length - 1; i++) {
            current = current[currentItemPath[i]].children;
          }
          const folderToMove = current[currentItemPath[currentItemPath.length - 1]];
          current.splice(currentItemPath[currentItemPath.length - 1], 1);
          
          // Update name
          folderToMove.name = editedData.name;
          
          // Add to new location
          let target = data.bookmarks;
          for (const idx of newFolderPath) {
            if (target[idx] && target[idx].type === 'folder') {
              target = target[idx].children;
            }
          }
          target.push(folderToMove);
        } else {
          // Update in place
          let current = data.bookmarks;
          for (let i = 0; i < currentItemPath.length - 1; i++) {
            current = current[currentItemPath[i]].children;
          }
          
          current[currentItemPath[currentItemPath.length - 1]] = {
            ...item,
            name: editedData.name
          };
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
      } else {
        // For bookmarks, check if folder changed
        const actualIndex = index;  // index is already correct from displayAllItems()
        const currentItemPath = [...currentPath().map(p => p.index), actualIndex];
        const newFolderPath = editedData.folderPath || [];
        
        const data = JSON.parse(JSON.stringify(bookmarks()));
        
        // Check if we're moving to a different folder
        const currentFolderPath = currentPath().map(p => p.index);
        const isMoving = JSON.stringify(currentFolderPath) !== JSON.stringify(newFolderPath);
        
        if (isMoving) {
          // Delete from current location
          let current = data.bookmarks;
          for (let i = 0; i < currentItemPath.length - 1; i++) {
            current = current[currentItemPath[i]].children;
          }
          current.splice(currentItemPath[currentItemPath.length - 1], 1);
          
          // Add to new location
          let target = data.bookmarks;
          for (const idx of newFolderPath) {
            if (target[idx] && target[idx].type === 'folder') {
              target = target[idx].children;
            }
          }
          target.push({
            type: 'link',
            name: editedData.name,
            url: editedData.url
          });
        } else {
          // Update in place
          let current = data.bookmarks;
          for (let i = 0; i < currentItemPath.length - 1; i++) {
            current = current[currentItemPath[i]].children;
          }
          
          current[currentItemPath[currentItemPath.length - 1]] = {
            ...item,
            name: editedData.name,
            url: editedData.url
          };
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
      }
      
      setShowEditModal(false);
      setEditingItem(null);
    } catch (err) {
      alert('Error saving: ' + err.message);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingItem(null);
  };

  const handleAddFolder = async () => {
    const name = prompt('Enter folder name:');
    if (!name || !name.trim()) return;

    try {
      const data = JSON.parse(JSON.stringify(bookmarks()));
      
      let current = data.bookmarks;
      for (const pathItem of currentPath()) {
        current = current[pathItem.index].children;
      }
      
      if (!Array.isArray(current)) {
        current = [];
      }
      
      current.push({
        type: 'folder',
        name: name.trim(),
        children: []
      });
      
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
      alert('Error adding folder: ' + err.message);
    }
  };

  const handleMoveUp = async (index) => {
    if (index <= 0) return; // Already at the top

    try {
      const data = JSON.parse(JSON.stringify(bookmarks()));
      
      // Navigate to current folder
      let current = data.bookmarks;
      for (const pathItem of currentPath()) {
        current = current[pathItem.index].children;
      }
      
      // Swap with previous item
      [current[index - 1], current[index]] = [current[index], current[index - 1]];
      
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
  };

  const handleMoveDown = async (index, totalItems) => {
    if (index >= totalItems - 1) return; // Already at the bottom

    try {
      const data = JSON.parse(JSON.stringify(bookmarks()));
      
      // Navigate to current folder
      let current = data.bookmarks;
      for (const pathItem of currentPath()) {
        current = current[pathItem.index].children;
      }
      
      // Swap with next item
      [current[index], current[index + 1]] = [current[index + 1], current[index]];
      
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
  };

  return {
    showEditModal,
    showAddModal,
    setShowAddModal,
    editingItem,
    handleDelete,
    handleEdit,
    handleSaveEdit,
    handleCancelEdit,
    handleAddFolder,
    handleMoveUp,
    handleMoveDown,
  };
}
