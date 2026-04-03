// storage-adapters.js - Storage adapter pattern for bookmarks
import { stringifyYaml, parseYaml } from './yaml.js';

/**
 * Base storage adapter interface
 */
class StorageAdapter {
  async load() {
    throw new Error('load() must be implemented');
  }
  
  async save(data) {
    throw new Error('save() must be implemented');
  }
  
  isConfigured() {
    throw new Error('isConfigured() must be implemented');
  }
}

/**
 * GitHub Gist storage adapter (default)
 */
class GistStorageAdapter extends StorageAdapter {
  constructor(token, gistId) {
    super();
    this.token = token;
    this.gistId = gistId;
  }
  
  isConfigured() {
    return !!(this.token && this.gistId);
  }
  
  async load() {
    if (!this.isConfigured()) {
      throw new Error('Gist storage not configured');
    }
    
    const response = await fetch(`/api/bookmarks?token=${encodeURIComponent(this.token)}&gistId=${encodeURIComponent(this.gistId)}`);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return parseYaml(data.content);
  }
  
  async save(data) {
    if (!this.isConfigured()) {
      throw new Error('Gist storage not configured');
    }
    
    const yaml = stringifyYaml(data);
    const response = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: this.token,
        gistId: this.gistId,
        content: yaml
      })
    });
    
    if (!response.ok) {
      const text = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = JSON.parse(text);
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch {
        // Response wasn't JSON, use the text if available
        if (text) {
          errorMessage += ` - ${text.substring(0, 200)}`;
        }
      }
      throw new Error(errorMessage);
    }
    
    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result;
  }
}

/**
 * Test storage adapter (uses localStorage)
 * Activated when credentials are "test"/"test"
 */
class TestStorageAdapter extends StorageAdapter {
  constructor() {
    super();
    this.storageKey = 'bookmarks_test_data';
  }
  
  isConfigured() {
    return true; // Always configured for test mode
  }
  
  async load() {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) {
      // Return empty bookmarks if nothing stored
      return { bookmarks: [] };
    }
    
    try {
      return parseYaml(stored);
    } catch (error) {
      console.error('Error parsing test storage:', error);
      return { bookmarks: [] };
    }
  }
  
  async save(data) {
    const yaml = stringifyYaml(data);
    localStorage.setItem(this.storageKey, yaml);
    console.log('[TestStorage] Saved to localStorage:', data);
    return { success: true };
  }
}

/**
 * Factory function to create the appropriate storage adapter
 */
export function createStorageAdapter(token, gistId) {
  // Check if using test credentials
  if (token === 'test' && gistId === 'test') {
    console.log('[Storage] Using TestStorageAdapter');
    return new TestStorageAdapter();
  }
  
  // Default to Gist storage
  console.log('[Storage] Using GistStorageAdapter');
  return new GistStorageAdapter(token, gistId);
}
