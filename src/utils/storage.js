// localStorage utilities for bookmark configuration

const STORAGE_KEYS = {
  GITHUB_TOKEN: 'bookmarks_githubToken',
  GIST_ID: 'bookmarks_gistId',
  LAST_SYNC: 'bookmarks_lastSync'
};

export function getGithubToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.GITHUB_TOKEN);
}

export function setGithubToken(token) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.GITHUB_TOKEN, token);
}

export function getGistId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.GIST_ID);
}

export function setGistId(gistId) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.GIST_ID, gistId);
}

export function getLastSync() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
}

export function setLastSync(timestamp) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp);
}

export function hasConfiguration() {
  return !!(getGithubToken() && getGistId());
}

export function clearConfiguration() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.GITHUB_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.GIST_ID);
  localStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
}
