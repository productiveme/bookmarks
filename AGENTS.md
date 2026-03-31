# Agent Guidelines for Bookmarks Bar

This document provides coding standards and operational guidelines for AI coding agents working on the Bookmarks Bar project.

## ⚠️ CRITICAL: Git Workflow

**NEVER commit or push code without explicit user approval.**

When you've made changes:
1. Show the user what you changed (via git diff or summary)
2. Wait for the user to review and approve
3. Only commit/push when explicitly asked to do so

This allows the user to:
- Review code quality and correctness
- Make additional changes if needed
- Ensure commits have proper messages
- Maintain control over the git history

## Project Overview

A minimal bookmark manager built as a bookmarklet that stores data in GitHub Gist. Built with Astro (SSR), SolidJS, Tailwind CSS v4, and JavaScript (NOT TypeScript).

**Key Constraint**: The bookmark bar must fit in a **40px height** single-line interface. All UI elements must be compact and inline.

## Build & Development Commands

### Running the Project
```bash
npm run dev          # Start dev server (runs on port 4321)
npm run build        # Build for production
npm run preview      # Preview production build
```

### Important Notes
- **Dev server runs on port 4321** - Ensure no duplicate servers on other ports (4322, etc.)
- Check for port conflicts: `lsof -i -P | grep -i listen | grep 4321`
- Kill duplicate processes if needed: `kill <pid>`
- The `PUBLIC_APP_URL` env var MUST match the actual server port/domain

### No Test Suite
This project does not have unit tests. Manual testing via the bookmarklet is required.

### Docker
```bash
# Build with production URL (IMPORTANT: set at build time!)
docker build --build-arg PUBLIC_APP_URL=https://bookmarks.productive.me -t bookmarks-bar .

# Run the container
docker run -d -p 4321:4321 --name bookmarks-bar bookmarks-bar
```

## Code Style Guidelines

### Language & Type System
- **JavaScript ONLY** - Do NOT use TypeScript
- Use `.js` extension for utilities/API routes
- Use `.jsx` extension for SolidJS components (REQUIRED for client components)
- Use `.astro` extension for Astro pages/layouts
- No type annotations, interfaces, or TypeScript syntax

### File Organization
```
src/
├── components/     # SolidJS components (.jsx)
├── layouts/        # Astro layouts (.astro)
├── pages/          # Astro pages and API routes
│   └── api/        # API endpoints (.js)
├── utils/          # Pure JS utilities (.js)
└── styles/         # Global CSS
```

### Import Conventions
1. **SolidJS components MUST use explicit `.jsx` extension in imports**
   ```javascript
   // ✅ Correct
   import BookmarkItem from './BookmarkItem.jsx';
   
   // ❌ Wrong - causes SSR errors
   import BookmarkItem from './BookmarkItem';
   ```

2. **Import order** (not strict, but preferred):
   - External packages (solid-js, etc.)
   - Local components
   - Utils/helpers
   - Styles

3. **Always use relative paths** for local imports:
   ```javascript
   import { parseYaml } from '../utils/yaml.js';
   import BookmarkBar from '../components/BookmarkBar.jsx';
   ```

### Component Style (SolidJS)
- Use **function declarations** for components:
  ```javascript
  export default function ComponentName(props) { ... }
  ```
- Use **createSignal** for reactive state
- Always add a **comment at top** describing the component:
  ```javascript
  // BookmarkBar - Main bar with breadcrumbs and scrollable bookmarks
  ```
- Use **client:only="solid-js"** directive when importing into Astro:
  ```astro
  <BookmarkBar client:only="solid-js" />
  ```

### Naming Conventions
- **Components**: PascalCase (e.g., `BookmarkBar`, `ConfigModal`)
- **Files**: PascalCase for components, camelCase for utils
- **Functions**: camelCase (e.g., `loadBookmarks`, `handleDelete`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `STORAGE_KEYS`, `GIST_API_URL`)
- **Event handlers**: Prefix with `handle` (e.g., `handleClick`, `handleSearchInput`)
- **Signals**: Descriptive names (e.g., `bookmarks`, `loading`, `showSearch`)

### Styling with Tailwind CSS v4
- Use **utility classes** directly in JSX/Astro
- Use **CSS custom properties** for theming:
  ```javascript
  // Use theme tokens defined in global.css
  class="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
  ```
- **Common theme tokens**:
  - `--color-bg-primary`, `--color-bg-secondary`, `--color-bg-hover`
  - `--color-text-primary`, `--color-text-secondary`
  - `--color-accent`, `--color-accent-hover`
  - `--color-border`
- All colors automatically support light/dark mode
- Keep height constraint: `h-full` on containers, compact padding (e.g., `py-1`, `px-2`)

### Error Handling
- **Try-catch** for all async operations
- Log errors with `console.error()`:
  ```javascript
  } catch (error) {
    console.error('Error fetching gist:', error);
    throw error;
  }
  ```
- Use **user-friendly alerts** for critical errors:
  ```javascript
  alert('Error adding bookmark: ' + err.message);
  ```
- **API routes** return JSON with error messages:
  ```javascript
  return new Response(JSON.stringify({ error: 'Missing token or gistId' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' }
  });
  ```

### State Management
- Use **SolidJS signals** for reactive state (no external state library)
- Use **localStorage** for persistence (via `src/utils/storage.js`)
- **Optimistic updates**: Update UI immediately, then save to Gist in background
  ```javascript
  // 1. Update local state
  updateUIAfterChange(updatedBookmarks);
  // 2. Save to Gist (async)
  await saveBookmarks(updatedBookmarks, true);
  ```

### API Routes (Astro)
- Export named functions: `GET`, `POST`, `PUT`, `DELETE`
- Use destructured params: `{ url, request }`
- Always return `Response` objects with proper headers
- Validate inputs before processing
- Example structure:
  ```javascript
  export async function GET({ url }) {
    const param = url.searchParams.get('param');
    if (!param) {
      return new Response(JSON.stringify({ error: 'Missing param' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // ... handle request
  }
  ```

### localStorage & Cross-Origin Considerations
- **Critical**: The iframe is always loaded from `PUBLIC_APP_URL`
- localStorage is scoped to the **iframe's origin**, not the parent page
- This means configuration persists across ALL pages where the bookmarklet is used
- Always access localStorage via utils in `src/utils/storage.js`
- Storage keys are namespaced: `bookmarks_githubToken`, `bookmarks_gistId`

### Message Passing (Parent ↔ Iframe)
- Use `window.postMessage()` for communication
- Always validate `event.origin` in production
- Current use cases:
  - Get current page info (title/URL) for "Add Page" feature
  - Notify iframe of config changes

## Common Patterns

### Adding a New Feature
1. Update state in component (add signals)
2. Create handler functions (prefix with `handle`)
3. Update UI in JSX (use `Show`, `For` from solid-js)
4. Implement optimistic updates if modifying data
5. Save to Gist via API route

### Working with Bookmarks
- Bookmarks are stored in **YAML format** in GitHub Gist
- Use utilities from `src/utils/yaml.js`:
  - `parseYaml()` - Parse YAML string to object
  - `stringifyYaml()` - Convert object to YAML
  - `deleteBookmarkAtPath()` - Remove bookmark by path
  - `addBookmarkToPath()` - Add bookmark at specific location

### Environment Variables
- Only one env var: `PUBLIC_APP_URL`
- **CRITICAL**: Must be set at **build time** (not runtime) - gets baked into the bookmarklet code
- Set via `.envrc` (direnv) or `.env` file for development
- For Docker: Use `--build-arg PUBLIC_APP_URL=https://your-domain.com` when building
- Access in code: `import.meta.env.PUBLIC_APP_URL`
- Default: `http://localhost:4321`

## Gotchas & Important Notes

1. **Always use explicit `.jsx` extension** when importing SolidJS components
2. **Port consistency is critical** - localStorage breaks if port changes
3. **PUBLIC_APP_URL must be set at BUILD TIME** - Docker builds need `--build-arg`
4. **40px height constraint** - Keep UI compact, use small text/icons
5. **Server-side rendering** - SolidJS components need `client:only` in Astro
6. **No TypeScript** - Despite tsconfig.json, use JavaScript only
7. **Optimistic updates** - Always update UI first for better UX
8. **GitHub token security** - Stored in localStorage (user accepts risk)
8. **Gists are secret** by default (not public)

## File References

- Main component: `src/components/BookmarkBar.jsx`
- Bookmark item: `src/components/BookmarkItem.jsx`
- Storage utils: `src/utils/storage.js`
- Gist API: `src/utils/gist.js`
- YAML utils: `src/utils/yaml.js`
- API endpoints: `src/pages/api/bookmarks.js`, `src/pages/api/gist/create.js`
- Bookmarklet generator: `src/utils/bookmarklet.js`
