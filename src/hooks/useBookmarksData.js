// useBookmarksData - Hook for loading and managing bookmarks data
import { createSignal, onMount } from 'solid-js';
import { getGithubToken, getGistId } from '../utils/storage.js';
import { createStorageAdapter } from '../utils/storage-adapters.js';

export function useBookmarksData() {
  const [bookmarks, setBookmarks] = createSignal({ bookmarks: [] });
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal(null);
  const [configured, setConfigured] = createSignal(false);

  const loadBookmarks = async () => {
    try {
      const token = getGithubToken();
      const gistId = getGistId();
      
      const storage = createStorageAdapter(token, gistId);
      const parsed = await storage.load();
      
      setBookmarks(parsed);
      setLoading(false);
      return parsed.bookmarks || [];
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  const saveBookmarks = async (updatedBookmarks) => {
    try {
      const token = getGithubToken();
      const gistId = getGistId();
      
      const storage = createStorageAdapter(token, gistId);
      await storage.save(updatedBookmarks);
    } catch (err) {
      throw new Error('Failed to save: ' + err.message);
    }
  };

  onMount(() => {
    const token = getGithubToken();
    const gistId = getGistId();
    const isConfigured = !!(token && gistId);
    
    setConfigured(isConfigured);
    
    if (isConfigured) {
      loadBookmarks();
    } else {
      setLoading(false);
    }
  });

  return {
    bookmarks,
    setBookmarks,
    loading,
    error,
    configured,
    loadBookmarks,
    saveBookmarks,
  };
}
