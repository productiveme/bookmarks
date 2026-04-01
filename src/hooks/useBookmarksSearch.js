// useBookmarksSearch - Hook for search functionality
import { createSignal } from 'solid-js';

export function useBookmarksSearch(currentBookmarks) {
  const [searchQuery, setSearchQuery] = createSignal('');
  const [filteredBookmarks, setFilteredBookmarks] = createSignal([]);
  const [filteredFolders, setFilteredFolders] = createSignal([]);

  const handleSearchInput = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredBookmarks([]);
      setFilteredFolders([]);
      return;
    }
    
    const lowerQuery = query.toLowerCase();
    const allItems = currentBookmarks();
    
    const matchedFolders = allItems.filter(item => 
      item.type === 'folder' && item.name.toLowerCase().includes(lowerQuery)
    );
    
    const matchedBookmarks = allItems.filter(item => 
      item.type !== 'folder' && 
      (item.name.toLowerCase().includes(lowerQuery) || 
       (item.url && item.url.toLowerCase().includes(lowerQuery)))
    );
    
    setFilteredFolders(matchedFolders);
    setFilteredBookmarks(matchedBookmarks);
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
