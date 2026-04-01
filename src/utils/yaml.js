import YAML from 'yaml';

// Default empty bookmarks structure
export const DEFAULT_BOOKMARKS = {
  bookmarks: []
};

// Parse YAML string to object
export function parseYaml(yamlString) {
  try {
    return YAML.parse(yamlString) || DEFAULT_BOOKMARKS;
  } catch (error) {
    console.error('Error parsing YAML:', error);
    return DEFAULT_BOOKMARKS;
  }
}

// Stringify object to YAML
export function stringifyYaml(data) {
  try {
    return YAML.stringify(data);
  } catch (error) {
    console.error('Error stringifying YAML:', error);
    return YAML.stringify(DEFAULT_BOOKMARKS);
  }
}

// Validate bookmark structure
export function validateBookmark(bookmark) {
  if (!bookmark || typeof bookmark !== 'object') return false;
  if (!bookmark.name || typeof bookmark.name !== 'string') return false;
  if (!bookmark.type || !['link', 'folder'].includes(bookmark.type)) return false;
  if (bookmark.type === 'link' && (!bookmark.url || typeof bookmark.url !== 'string')) return false;
  if (bookmark.type === 'folder' && !Array.isArray(bookmark.children)) return false;
  return true;
}

// Find bookmark by path (array of indices)
export function findBookmarkByPath(bookmarks, path) {
  let current = bookmarks;
  for (const index of path) {
    if (!current[index]) return null;
    if (current[index].type === 'folder') {
      current = current[index].children;
    } else {
      return current[index];
    }
  }
  return current;
}

// Add bookmark to path
export function addBookmarkToPath(bookmarksData, path, newBookmark) {
  const data = JSON.parse(JSON.stringify(bookmarksData)); // Deep clone
  let current = data.bookmarks;
  
  for (let i = 0; i < path.length; i++) {
    const index = path[i];
    if (i === path.length - 1) {
      // Insert at this level
      if (current[index] && current[index].type === 'folder') {
        current = current[index].children;
      }
    } else {
      if (current[index] && current[index].type === 'folder') {
        current = current[index].children;
      }
    }
  }
  
  current.push(newBookmark);
  return data;
}

// Delete bookmark at path
export function deleteBookmarkAtPath(bookmarksData, path) {
  const data = JSON.parse(JSON.stringify(bookmarksData)); // Deep clone
  let current = data.bookmarks;
  
  for (let i = 0; i < path.length - 1; i++) {
    const index = path[i];
    if (current[index] && current[index].type === 'folder') {
      current = current[index].children;
    }
  }
  
  const lastIndex = path[path.length - 1];
  current.splice(lastIndex, 1);
  return data;
}

// Update bookmark at path
export function updateBookmarkAtPath(bookmarksData, path, updatedBookmark) {
  const data = JSON.parse(JSON.stringify(bookmarksData)); // Deep clone
  let current = data.bookmarks;
  
  for (let i = 0; i < path.length - 1; i++) {
    const index = path[i];
    if (current[index] && current[index].type === 'folder') {
      current = current[index].children;
    }
  }
  
  const lastIndex = path[path.length - 1];
  current[lastIndex] = updatedBookmark;
  return data;
}

// Flatten folder structure into list with paths
// Returns array of { label: 'Root / Folder1 / Folder2', path: [0, 1], indices: [0, 1] }
export function getFolderList(bookmarksData) {
  const folders = [{ label: 'Root', path: [], indices: [] }];
  
  function traverse(items, pathParts = [], indexPath = []) {
    items.forEach((item, index) => {
      if (item.type === 'folder') {
        const newPathParts = [...pathParts, item.name];
        const newIndexPath = [...indexPath, index];
        folders.push({
          label: 'Root / ' + newPathParts.join(' / '),
          path: newPathParts,
          indices: newIndexPath
        });
        if (item.children && item.children.length > 0) {
          traverse(item.children, newPathParts, newIndexPath);
        }
      }
    });
  }
  
  if (bookmarksData.bookmarks) {
    traverse(bookmarksData.bookmarks);
  }
  
  return folders;
}
