// ConfigModal - Setup page for GitHub token and Gist ID
import { createSignal, onMount } from 'solid-js';
import { getGithubToken, getGistId, setGithubToken, setGistId } from '../utils/storage';

export default function ConfigModal() {
  const [token, setToken] = createSignal('');
  const [gistId, setGistIdLocal] = createSignal('');
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal('');
  const [success, setSuccess] = createSignal(false);
  
  onMount(() => {
    // Load existing values
    const existingToken = getGithubToken();
    const existingGistId = getGistId();
    
    if (existingToken) setToken(existingToken);
    if (existingGistId) setGistIdLocal(existingGistId);
  });
  
  const handleSave = async () => {
    setError('');
    setSuccess(false);
    
    if (!gistId()) {
      setError('Gist ID is required');
      return;
    }
    
    if (!token()) {
      setError('GitHub token is required');
      return;
    }
    
    setLoading(true);
    
    try {
      // Check if using test credentials
      if (token() === 'test' && gistId() === 'test') {
        // Test mode - skip API verification
        setGithubToken(token());
        setGistId(gistId());
        
        // Broadcast to iframes
        window.opener?.postMessage({
          type: 'save-config',
          token: token(),
          gistId: gistId()
        }, '*');
        
        setSuccess(true);
        setError('Test mode enabled! All data will be stored in localStorage.');
      } else {
        // Normal mode - verify access to the gist
        const response = await fetch(`/api/bookmarks?token=${encodeURIComponent(token())}&gistId=${encodeURIComponent(gistId())}`);
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        // Save to localStorage in this context (for when setup is opened directly)
        setGithubToken(token());
        setGistId(gistId());
        
        // IMPORTANT: Also broadcast to all iframes that might be listening
        // This allows iframe's partitioned storage to receive the config
        window.opener?.postMessage({
          type: 'save-config',
          token: token(),
          gistId: gistId()
        }, '*');
        
        setSuccess(true);
        setError('Configuration saved! You can close this tab and click "Reload" in the bookmarks bar.');
      }
      
    } catch (err) {
      setError(err.message || 'Failed to verify access to Gist');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateGist = async () => {
    setError('');
    setSuccess(false);
    
    if (!token()) {
      setError('GitHub token is required to create a Gist');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/gist/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token() })
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setGistIdLocal(data.gistId);
      setError('');
      alert('Gist created successfully! Click Save to continue.');
    } catch (err) {
      setError(err.message || 'Failed to create Gist');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div class="min-h-screen bg-[var(--color-bg-secondary)] flex items-center justify-center p-4">
      <div class="bg-[var(--color-bg-primary)] rounded-lg shadow-xl p-8 max-w-md w-full border border-[var(--color-border)]">
        <h1 class="text-2xl font-bold mb-6 text-[var(--color-text-primary)]">
          Bookmarks Setup
        </h1>
        
        <div class="space-y-4 mb-6">
          <div>
            <label class="block text-sm font-medium mb-2 text-[var(--color-text-primary)]">
              Gist ID
            </label>
            <input
              type="text"
              value={gistId()}
              onInput={(e) => setGistIdLocal(e.target.value)}
              class="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              placeholder="abc123def456..."
              autocapitalize="none"
              autocorrect="off"
              spellcheck="false"
              autocomplete="username"
            />
            <p class="text-xs text-[var(--color-text-secondary)] mt-1">
              Or <button onClick={handleCreateGist} disabled={loading()} class="text-[var(--color-accent)] hover:underline disabled:opacity-50">
                create a new Gist
              </button>
            </p>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2 text-[var(--color-text-primary)]">
              GitHub Personal Access Token
            </label>
            <input
              type="password"
              value={token()}
              onInput={(e) => setToken(e.target.value)}
              class="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              placeholder="ghp_..."
              autocapitalize="none"
              autocorrect="off"
              spellcheck="false"
              autocomplete="current-password"
            />
            <p class="text-xs text-[var(--color-text-secondary)] mt-1">
              Create a token at <a href="https://github.com/settings/tokens" target="_blank" class="text-[var(--color-accent)] hover:underline">github.com/settings/tokens</a> with "gist" scope
            </p>
          </div>
        </div>
        
        {error() && (
          <div class="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded text-red-800 dark:text-red-300 text-sm">
            {error()}
          </div>
        )}
        
        {success() && (
          <div class="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded text-green-800 dark:text-green-300 text-sm">
            Configuration saved successfully!
          </div>
        )}
        
        <div class="space-y-3">
          <button
            onClick={handleSave}
            disabled={loading()}
            class="w-full px-4 py-2 bg-[var(--color-accent)] text-white rounded hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-colors"
          >
            {loading() ? 'Saving...' : 'Save Configuration'}
          </button>
          
          {success() && (
            <a
              href="/bookmarks"
              class="block w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-center font-medium"
            >
              Open Bookmarks Manager
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
