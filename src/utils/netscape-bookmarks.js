// netscape-bookmarks.js - Parser and generator for Netscape Bookmark format
// Used by Firefox, Chrome, and other browsers

/**
 * Parse Netscape/Firefox bookmark HTML format to our YAML structure
 * @param {string} html - The HTML bookmark file content
 * @returns {object} - Bookmark structure {bookmarks: [...]}
 */
export function parseNetscapeBookmarks(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const bookmarks = [];
  
  // Find the main DL element
  const mainDL = doc.querySelector('DL');
  if (!mainDL) {
    throw new Error('Invalid bookmark file format');
  }
  
  // Recursively parse DL elements
  function parseDL(dlElement, depth = 0) {
    const items = [];
    // Get all direct children
    const allChildren = Array.from(dlElement.children);
    // Filter out P tags which are just formatting
    const children = allChildren.filter(c => c.tagName !== 'P');
    
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      
      if (child.tagName === 'DT') {
        // Check if it's a folder (H3) or link (A)
        const h3 = child.querySelector('H3');
        const a = child.querySelector('A');
        
        if (h3) {
          // It's a folder
          const folderName = h3.textContent.trim();
          
          // Find the next DL element (folder contents)
          // First check if DL is a child of the current DT element
          let nextDL = child.querySelector('DL');
          if (!nextDL) {
            // Otherwise look for DL as next sibling
            for (let j = i + 1; j < children.length; j++) {
              if (children[j].tagName === 'DL') {
                nextDL = children[j];
                break;
              }
              if (children[j].tagName === 'DT') {
                break; // Hit next item
              }
            }
          }
          
          items.push({
            type: 'folder',
            name: folderName,
            children: nextDL ? parseDL(nextDL, depth + 1) : []
          });
        } else if (a) {
          // It's a bookmark or bookmarklet
          const url = a.getAttribute('HREF');
          const name = a.textContent.trim();
          
          if (url) {
            if (url.startsWith('javascript:')) {
              // It's a bookmarklet
              items.push({
                type: 'bookmarklet',
                name: name || 'Bookmarklet',
                url: url
              });
            } else {
              // It's a regular bookmark
              items.push({
                type: 'link',
                name: name || url,
                url: url
              });
            }
          }
        }
      }
    }
    
    return items;
  }
  
  const parsedBookmarks = parseDL(mainDL);
  
  return { bookmarks: parsedBookmarks };
}

/**
 * Generate Netscape bookmark HTML from our YAML structure
 * @param {object} data - Bookmark structure {bookmarks: [...]}
 * @param {array} path - Current folder path (for partial export)
 * @returns {string} - HTML bookmark file content
 */
export function generateNetscapeBookmarks(data, path = []) {
  const timestamp = Math.floor(Date.now() / 1000);
  
  // Navigate to the specified path
  let current = data.bookmarks;
  for (const pathItem of path) {
    current = current[pathItem.index].children;
  }
  
  // Generate HTML
  let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks Menu</H1>

<DL><p>
`;

  function generateDL(items, indent = '    ') {
    let result = '';
    
    for (const item of items) {
      if (item.type === 'folder') {
        result += `${indent}<DT><H3 ADD_DATE="${timestamp}" LAST_MODIFIED="${timestamp}">${escapeHtml(item.name)}</H3>\n`;
        result += `${indent}<DL><p>\n`;
        result += generateDL(item.children || [], indent + '    ');
        result += `${indent}</DL><p>\n`;
      } else if (item.type === 'link' || item.type === 'bookmarklet') {
        result += `${indent}<DT><A HREF="${escapeHtml(item.url)}" ADD_DATE="${timestamp}">${escapeHtml(item.name)}</A>\n`;
      }
    }
    
    return result;
  }
  
  html += generateDL(current);
  html += `</DL>\n`;
  
  return html;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
