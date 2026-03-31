// BookmarksFullPage - Full page view with sidebar and tile grid
import { createSignal, Show, For, onMount } from 'solid-js';
import { getGithubToken, getGistId } from '../utils/storage';
import { parseYaml, stringifyYaml, deleteBookmarkAtPath } from '../utils/yaml';

export default function BookmarksFullPage() {
  const [bookmarks, setBookmarks] = createSignal({ bookmarks: [] });
  const [currentPath, setCurrentPath] = createSignal([]);
  const [currentBookmarks, setCurrentBookmarks] = createSignal([]);
  const [folders, setFolders] = createSignal([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal(null);
  const [configured, setConfigured] = createSignal(false);
  const [searchQuery, setSearchQuery] = createSignal('');
  const [filteredBookmarks, setFilteredBookmarks] = createSignal([]);
  const [editingItem, setEditingItem] = createSignal(null);
  const [editName, setEditName] = createSignal('');
  const [editUrl, setEditUrl] = createSignal('');

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
      updateCurrentView(parsed.bookmarks || [], []);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const updateCurrentView = (items, path) => {
    // Separate folders and links
    const folderItems = items.filter(item => item.type === 'folder');
    const linkItems = items.filter(item => item.type === 'link');
    
    setFolders(folderItems);
    setCurrentBookmarks(linkItems);
    setCurrentPath(path);
  };

  const navigateToFolder = (folder, index) => {
    const newPath = [...currentPath(), { name: folder.name, index }];
    updateCurrentView(folder.children || [], newPath);
  };

  const navigateToBreadcrumb = async (targetIndex) => {
    if (targetIndex === -1) {
      // Navigate to root - reload from Gist
      await loadBookmarks();
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

  const handleDelete = async (index, isFolder) => {
    if (!confirm('Are you sure you want to delete this ' + (isFolder ? 'folder' : 'bookmark') + '?')) {
      return;
    }

    try {
      const allItems = [...folders(), ...currentBookmarks()];
      const actualIndex = isFolder ? index : folders().length + index;
      const path = [...currentPath().map(p => p.index), actualIndex];
      
      const updatedBookmarks = deleteBookmarkAtPath(bookmarks(), path);
      
      setBookmarks(updatedBookmarks);
      
      // Update current view
      let current = updatedBookmarks.bookmarks;
      for (const pathItem of currentPath()) {
        const folder = current[pathItem.index];
        if (folder && folder.type === 'folder') {
          current = folder.children || [];
        }
      }
      updateCurrentView(current, currentPath());
      
      await saveBookmarks(updatedBookmarks);
    } catch (err) {
      alert('Error deleting: ' + err.message);
    }
  };

  const handleEdit = (item, index, isFolder) => {
    setEditingItem({ item, index, isFolder });
    setEditName(item.name);
    setEditUrl(item.url || '');
  };

  const handleSaveEdit = async () => {
    try {
      const { item, index, isFolder } = editingItem();
      const allItems = [...folders(), ...currentBookmarks()];
      const actualIndex = isFolder ? index : folders().length + index;
      const path = [...currentPath().map(p => p.index), actualIndex];
      
      const data = JSON.parse(JSON.stringify(bookmarks()));
      
      let current = data.bookmarks;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]].children;
      }
      
      current[path[path.length - 1]] = {
        ...item,
        name: editName(),
        ...(item.type === 'link' ? { url: editUrl() } : {})
      };
      
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
      setEditingItem(null);
    } catch (err) {
      alert('Error saving: ' + err.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

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
      setFilteredBookmarks(results.filter(item => item.type === 'link'));
    } else {
      setFilteredBookmarks([]);
    }
  };

  const displayBookmarks = () => {
    if (searchQuery().trim()) {
      return filteredBookmarks();
    }
    return currentBookmarks();
  };

  return (
    <div class="min-h-screen bg-[var(--color-bg-secondary)] flex flex-col">
      {/* Header */}
      <div class="bg-[var(--color-bg-primary)] border-b border-[var(--color-border)] p-4">
        <div class="max-w-[1920px] mx-auto flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-[var(--color-text-primary)]">📚 Bookmarks</h1>
            <Show when={!loading() && !configured()}>
              <a href="/setup" target="_blank" class="text-sm text-[var(--color-accent)] hover:underline">
                Setup Required
              </a>
            </Show>
          </div>
          
          <Show when={!loading() && configured()}>
            <div class="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery()}
                onInput={handleSearchInput}
                placeholder="Search bookmarks..."
                class="px-4 py-2 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded focus:outline-none focus:border-[var(--color-accent)] w-64"
              />
              <button
                onClick={() => loadBookmarks()}
                class="px-4 py-2 bg-[var(--color-accent)] text-white rounded hover:bg-[var(--color-accent-hover)] transition-colors"
                title="Refresh from Gist"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </Show>
        </div>
        
        {/* Breadcrumbs */}
        <Show when={!loading() && configured()}>
          <div class="max-w-[1920px] mx-auto mt-3 flex items-center gap-2 text-sm">
            <button
              class="px-3 py-1.5 text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded transition-colors"
              onClick={() => navigateToBreadcrumb(-1)}
            >
              Home
            </button>
            <For each={currentPath()}>
              {(pathItem, i) => (
                <>
                  <span class="text-[var(--color-text-secondary)]">/</span>
                  <button
                    class="px-3 py-1.5 text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded transition-colors"
                    onClick={() => navigateToBreadcrumb(i())}
                  >
                    {pathItem.name}
                  </button>
                </>
              )}
            </For>
          </div>
        </Show>
      </div>

      {/* Main Content */}
      <div class="flex-1 flex max-w-[1920px] mx-auto w-full">
        <Show when={loading()}>
          <div class="flex-1 flex items-center justify-center p-8">
            <div class="text-[var(--color-text-secondary)] text-lg">Loading bookmarks...</div>
          </div>
        </Show>

        <Show when={error()}>
          <div class="flex-1 flex items-center justify-center p-8">
            <div class="text-red-500 text-lg">{error()}</div>
          </div>
        </Show>

        <Show when={!loading() && !error() && !configured()}>
          <div class="flex-1 flex items-center justify-center p-8">
            <div class="text-center">
              <p class="text-[var(--color-text-secondary)] mb-4">Please configure your GitHub token and Gist ID</p>
              <a href="/setup" target="_blank" class="px-6 py-3 bg-[var(--color-accent)] text-white rounded hover:bg-[var(--color-accent-hover)] transition-colors inline-block">
                Go to Setup
              </a>
            </div>
          </div>
        </Show>

        <Show when={!loading() && !error() && configured()}>
          {/* Sidebar - Folders */}
          <div class="w-64 bg-[var(--color-bg-primary)] border-r border-[var(--color-border)] p-4 overflow-y-auto">
            <h2 class="text-sm font-semibold text-[var(--color-text-secondary)] uppercase mb-3">Folders</h2>
            
            <Show when={folders().length === 0}>
              <p class="text-sm text-[var(--color-text-secondary)] italic">No folders</p>
            </Show>
            
            <div class="space-y-1">
              <For each={folders()}>
                {(folder, index) => (
                  <Show
                    when={editingItem() && editingItem().isFolder && editingItem().index === index()}
                    fallback={
                      <div class="group flex items-center gap-2 p-2 rounded hover:bg-[var(--color-bg-hover)] transition-colors">
                        <button
                          class="flex-1 flex items-center gap-2 text-left"
                          onClick={() => navigateToFolder(folder, index())}
                        >
                          <svg class="w-5 h-5 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                          <span class="text-[var(--color-text-primary)]">{folder.name}</span>
                        </button>
                        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(folder, index(), true)}
                            class="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
                            title="Edit"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(index(), true)}
                            class="p-1 text-[var(--color-text-secondary)] hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    }
                  >
                    <div class="p-2 bg-[var(--color-bg-hover)] rounded">
                      <input
                        type="text"
                        value={editName()}
                        onInput={(e) => setEditName(e.target.value)}
                        class="w-full px-2 py-1 text-sm bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] mb-2"
                      />
                      <div class="flex gap-1">
                        <button
                          onClick={handleSaveEdit}
                          class="px-2 py-1 text-xs bg-[var(--color-accent)] text-white rounded hover:bg-[var(--color-accent-hover)] transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          class="px-2 py-1 text-xs bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded hover:bg-[var(--color-border)] transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </Show>
                )}
              </For>
            </div>
          </div>

          {/* Main Area - Bookmarks Grid */}
          <div class="flex-1 p-6 overflow-y-auto">
            <Show when={displayBookmarks().length === 0}>
              <div class="text-center py-12">
                <p class="text-[var(--color-text-secondary)]">
                  {searchQuery().trim() ? 'No bookmarks found' : 'No bookmarks in this folder'}
                </p>
              </div>
            </Show>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              <For each={displayBookmarks()}>
                {(bookmark, index) => (
                  <Show
                    when={editingItem() && !editingItem().isFolder && editingItem().index === index()}
                    fallback={
                      <div class="group bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg p-4 hover:shadow-lg transition-shadow">
                        <div class="flex items-start justify-between mb-2">
                          <svg class="w-5 h-5 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEdit(bookmark, index(), false)}
                              class="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
                              title="Edit"
                            >
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(index(), false)}
                              class="p-1 text-[var(--color-text-secondary)] hover:text-red-500 transition-colors"
                              title="Delete"
                            >
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <a
                          href={bookmark.url}
                          target="_blank"
                          class="block"
                        >
                          <h3 class="font-medium text-[var(--color-text-primary)] mb-1 line-clamp-2">{bookmark.name}</h3>
                          <p class="text-xs text-[var(--color-text-secondary)] truncate">{bookmark.url}</p>
                        </a>
                      </div>
                    }
                  >
                    <div class="bg-[var(--color-bg-hover)] border border-[var(--color-border)] rounded-lg p-4">
                      <input
                        type="text"
                        value={editName()}
                        onInput={(e) => setEditName(e.target.value)}
                        placeholder="Name"
                        class="w-full px-2 py-1 text-sm bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] mb-2"
                      />
                      <input
                        type="text"
                        value={editUrl()}
                        onInput={(e) => setEditUrl(e.target.value)}
                        placeholder="URL"
                        class="w-full px-2 py-1 text-sm bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] mb-2"
                      />
                      <div class="flex gap-1">
                        <button
                          onClick={handleSaveEdit}
                          class="px-2 py-1 text-xs bg-[var(--color-accent)] text-white rounded hover:bg-[var(--color-accent-hover)] transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          class="px-2 py-1 text-xs bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded hover:bg-[var(--color-border)] transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </Show>
                )}
              </For>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}
