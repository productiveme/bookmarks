// useBookmarksData - Hook for loading and managing bookmarks data
import { createSignal, onMount } from 'solid-js';
import { getGithubToken, getGistId } from '../utils/storage.js';
import { parseYaml, stringifyYaml } from '../utils/yaml.js';

export function useBookmarksData() {
  const [bookmarks, setBookmarks] = createSignal({ bookmarks: [] });
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal(null);
  const [configured, setConfigured] = createSignal(false);

  const loadBookmarks = async () => {
    try {
      const token = getGithubToken();
      const gistId = getGistId();
      
      const response = await fetch(`/api/bookmarks?token=${encodeURIComponent(token)}&gistId=${encodeURIComponent(gistId)}`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      const parsed = parseYaml(data.content);
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
      const yamlContent = stringifyYaml(updatedBookmarks);
      
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, gistId, content: yamlContent })
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
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
