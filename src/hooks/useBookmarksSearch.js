// useBookmarksSearch - Hook for search functionality
import { createSignal } from 'solid-js';

export function useBookmarksSearch(currentBookmarks, bookmarks) {
  const [searchQuery, setSearchQuery] = createSignal('');
  const [filteredBookmarks, setFilteredBookmarks] = createSignal([]);
  const [filteredFolders, setFilteredFolders] = createSignal([]);

  // Recursively search through all bookmarks and folders
  const searchAllItems = (items, query) => {
    const lowerQuery = query.toLowerCase();
    const folders = [];
    const bookmarksList = [];
    
    const searchRecursive = (itemsList) => {
      for (const item of itemsList) {
        if (item.type === 'folder') {
          // Check if folder name matches
          if (item.name.toLowerCase().includes(lowerQuery)) {
            folders.push(item);
          }
          // Recursively search children
          if (item.children && item.children.length > 0) {
            searchRecursive(item.children);
          }
        } else {
          // Check if bookmark name or URL matches
          if (item.name.toLowerCase().includes(lowerQuery) || 
              (item.url && item.url.toLowerCase().includes(lowerQuery))) {
            bookmarksList.push(item);
          }
        }
      }
    };
    
    searchRecursive(items);
    return { folders, bookmarksList };
  };

  const handleSearchInput = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredBookmarks([]);
      setFilteredFolders([]);
      return;
    }
    
    // Search through ALL bookmarks, not just current view
    const allBookmarks = bookmarks().bookmarks || [];
    const { folders, bookmarksList } = searchAllItems(allBookmarks, query);
    
    setFilteredFolders(folders);
    setFilteredBookmarks(bookmarksList);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setFilteredBookmarks([]);
    setFilteredFolders([]);
  };

  const displayBookmarks = () => {
    if (searchQuery().trim()) {
      return filteredBookmarks();
    }
    return currentBookmarks().filter(item => item.type !== 'folder');
  };

  const displayFolders = () => {
    if (searchQuery().trim()) {
      return filteredFolders();
    }
    return currentBookmarks().filter(item => item.type === 'folder');
  };

  const displayAllItems = () => {
    // When searching, show folders and bookmarks separately
    if (searchQuery().trim()) {
      return [...filteredFolders(), ...filteredBookmarks()];
    }
    // When browsing, show all items in original order
    return currentBookmarks();
  };

  return {
    searchQuery,
    handleSearchInput,
    handleClearSearch,
    displayBookmarks,
    displayFolders,
    displayAllItems,
  };
}
