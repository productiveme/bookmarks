// GitHub Gist API utilities

const GIST_FILENAME = 'bookmarks.yaml';
const GIST_API_URL = 'https://api.github.com';

// Fetch gist content
export async function fetchGist(token, gistId) {
  try {
    const response = await fetch(`${GIST_API_URL}/gists/${gistId}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch gist: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const file = data.files[GIST_FILENAME];
    
    if (!file) {
      throw new Error(`File ${GIST_FILENAME} not found in gist`);
    }
    
    return file.content;
  } catch (error) {
    console.error('Error fetching gist:', error);
    throw error;
  }
}

// Update gist content
export async function updateGist(token, gistId, content) {
  try {
    const response = await fetch(`${GIST_API_URL}/gists/${gistId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files: {
          [GIST_FILENAME]: {
            content: content
          }
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update gist: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating gist:', error);
    throw error;
  }
}

// Create new gist
export async function createGist(token, content) {
  try {
    const response = await fetch(`${GIST_API_URL}/gists`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        description: 'Bookmarks Bar - Bookmark Storage',
        public: false,
        files: {
          [GIST_FILENAME]: {
            content: content
          }
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create gist: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error('Error creating gist:', error);
    throw error;
  }
}

// Verify token and gist access
export async function verifyAccess(token, gistId) {
  try {
    const response = await fetch(`${GIST_API_URL}/gists/${gistId}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error verifying access:', error);
    return false;
  }
}
