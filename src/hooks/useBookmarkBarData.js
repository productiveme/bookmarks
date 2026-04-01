// useBookmarkBarData - Hook for loading and saving bookmarks data in the bar
import { createSignal, onMount } from 'solid-js';
import { getGithubToken, getGistId } from '../utils/storage.js';
import { parseYaml, stringifyYaml } from '../utils/yaml.js';

export function useBookmarkBarData() {
  const [bookmarks, setBookmarks] = createSignal({ bookmarks: [] });
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal(null);
  const [configured, setConfigured] = createSignal(false);

  const loadBookmarks = async () => {
    console.log('loadBookmarks called. Configured:', configured());
    if (!configured()) {
      console.log('Not configured, skipping bookmark load');
      setLoading(false);
      return null;
    }
    
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
      return parsed;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return null;
    }
  };

  const saveBookmarks = async (updatedBookmarks, skipReload = false) => {
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
      
      // Only reload if not skipped (for optimistic updates)
      if (!skipReload) {
        await loadBookmarks();
      }
    } catch (err) {
      setError(err.message);
      // Reload on error to revert optimistic update
      await loadBookmarks();
    }
  };

  onMount(() => {
    // Check configuration on mount (client-side only)
    // Add a small delay to ensure localStorage is fully accessible in iframe context
    const checkConfig = () => {
      const token = getGithubToken();
      const gistId = getGistId();
      const isConfigured = !!(token && gistId);
      
      console.log('BookmarkBar mounted. Configured:', isConfigured);
      console.log('Token:', token ? 'exists' : 'missing');
      console.log('GistId:', gistId ? 'exists' : 'missing');
      
      setConfigured(isConfigured);
      
      if (isConfigured) {
        loadBookmarks();
      } else {
        setLoading(false);
      }
    };
    
    // Check immediately
    checkConfig();
    
    // Also check after a short delay in case localStorage wasn't ready
    setTimeout(checkConfig, 200);
  });

  return {
    bookmarks,
    setBookmarks,
    loading,
    error,
    setError,
    configured,
    loadBookmarks,
    saveBookmarks,
  };
}
