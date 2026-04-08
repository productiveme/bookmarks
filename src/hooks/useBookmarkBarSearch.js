// useBookmarkBarSearch - Hook for search functionality in the bar
import { createSignal } from 'solid-js';

export function useBookmarkBarSearch(bookmarks, currentBookmarks) {
  const [showSearch, setShowSearch] = createSignal(false);
  const [searchQuery, setSearchQuery] = createSignal('');
  const [filteredBookmarks, setFilteredBookmarks] = createSignal([]);

  const searchAllBookmarks = (items, query, results = []) => {
    for (const item of items) {
      if (item.name.toLowerCase().includes(query.toLowerCase())) {
        results.push(item);
      }
      if (item.type === 'folder' && item.children) {
        searchAllBookmarks(item.children, query, results);
      }
    }
    return results;
  };

  const handleSearchInput = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim()) {
      const results = searchAllBookmarks(bookmarks().bookmarks || [], query);
      setFilteredBookmarks(results);
    } else {
      setFilteredBookmarks([]);
    }
  };

  const handleSearchToggle = () => {
    setShowSearch(!showSearch());
    if (showSearch()) {
      // Focus the search input after it appears
      setTimeout(() => {
        document.getElementById('bookmark-search-input')?.focus();
      }, 0);
    } else {
      // Reset search
      setSearchQuery('');
      setFilteredBookmarks([]);
    }
  };

  const handleSearchClear = () => {
    setSearchQuery('');
    setFilteredBookmarks([]);
    setShowSearch(false);
  };

  const displayBookmarks = () => {
    return searchQuery().trim() ? filteredBookmarks() : currentBookmarks();
  };

  return {
    showSearch,
    searchQuery,
    filteredBookmarks,
    handleSearchInput,
    handleSearchToggle,
    handleSearchClear,
    displayBookmarks,
  };
}
