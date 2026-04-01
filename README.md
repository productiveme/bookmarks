# Bookmarks Bar

A minimal, lightweight bookmark manager that runs as a bookmarklet and stores bookmarks in GitHub Gist. Built with Astro, SolidJS, and Tailwind CSS.

## Features

- 📚 **Bookmarklet-based**: Add a bookmark bar to any webpage with one click
- 🗂️ **Folders & Subfolders**: Organize bookmarks hierarchically with unlimited nesting
- 🔍 **Global Search**: Search across all bookmarks and folders recursively
- ➕ **Quick Add**: Easily add the current page to your bookmarks
- ✏️ **Inline Editing**: Edit bookmark names and URLs directly in the interface
- 🎯 **Drag & Drop**: Reorder bookmarks and move them between folders (full manager)
- 🖱️ **Drag to Scroll**: Horizontal mouse-drag scrolling in the compact bar
- 🔄 **GitHub Gist Sync**: Your bookmarks are stored in a private GitHub Gist
- 🌓 **Light/Dark Theme**: Automatically follows system preferences
- 🔒 **Privacy-focused**: Data stored in your own GitHub Gist, no backend database
- 🎨 **Minimal Design**: Clean, unobtrusive 40px height interface
- 📱 **Two Views**: Compact bar (40px) for browsing, full manager for organization

## Tech Stack

- **Astro** - Fast, server-rendered framework
- **SolidJS** - Reactive UI components
- **Tailwind CSS v4** - Utility-first styling with light-dark theme
- **Vite** - Fast build tooling
- **YAML** - Human-readable bookmark storage format

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A GitHub account
- GitHub Personal Access Token with `gist` scope

### Development

1. **Clone and install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   
   Option A: Using direnv (recommended)
   ```bash
   # Install direnv: https://direnv.net/
   # The .envrc file is already configured
   direnv allow .
   ```
   
   Option B: Using .env file
   ```bash
   cp .env.example .env
   # Edit .env and set PUBLIC_APP_URL (default: http://localhost:4321)
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Visit http://localhost:4321**
   - Follow the setup instructions to configure your GitHub token
   - Create a new Gist or use an existing one
   - Install the bookmarklet

### Docker Deployment

1. **Build the image with your production URL**
   ```bash
   docker build \
     --build-arg PUBLIC_APP_URL=https://bookmarks.productive.me \
     -t bookmarks-bar .
   ```

2. **Run the container**
   ```bash
   docker run -d \
     -p 4321:4321 \
     --name bookmarks-bar \
     bookmarks-bar
   ```

3. **Access the application**
   - Visit http://localhost:4321 (or your configured domain)

### Production Deployment

**Important**: The `PUBLIC_APP_URL` must be set at **build time** because it gets embedded in the bookmarklet code.

1. **Dokploy Deployment**
   
   In your Dokploy project settings:
   - Go to **Build** settings
   - Add a **Build Argument**:
     - Key: `PUBLIC_APP_URL`
     - Value: `https://bookmarks.productive.me` (your domain)
   - Redeploy the application
   
   The build argument will be passed to Docker during build: `--build-arg PUBLIC_APP_URL=https://bookmarks.productive.me`

2. **Docker Deployment (Manual)**
   ```bash
   # Build with your production URL
   docker build \
     --build-arg PUBLIC_APP_URL=https://bookmarks.productive.me \
     -t bookmarks-bar .
   
   # Run the container
   docker run -d -p 4321:4321 --name bookmarks-bar bookmarks-bar
   ```

3. **Traditional Hosting**
   ```bash
   # Set the environment variable
   export PUBLIC_APP_URL=https://bookmarks.productive.me
   
   # Build the application
   npm run build
   
   # Deploy the dist folder
   ```

4. **Hosting Requirements**
   - Server-side rendering (for API routes)
   - CORS headers for iframe embedding
   - Node.js runtime (v22.12.0 or higher)

5. **Verify the Configuration**
   - Visit `https://your-domain.com/debug` to see the configured `PUBLIC_APP_URL`
   - The value should match your production domain

## Project Structure

```
/
├── src/
│   ├── components/
│   │   ├── BookmarkBar.jsx          # Compact 40px bar for bookmarklet
│   │   ├── BookmarksFullPage.jsx    # Full-page bookmark manager
│   │   ├── BookmarksHeader.jsx      # Header with breadcrumbs
│   │   ├── BookmarksSidebar.jsx     # Folder navigation sidebar
│   │   ├── BookmarkItem.jsx         # Individual bookmark/folder component
│   │   ├── ConfigModal.jsx          # Setup modal for GitHub config
│   │   └── HomeIcon.jsx             # Reusable home icon component
│   ├── hooks/
│   │   ├── useBookmarkBarData.js         # Data loading for bar
│   │   ├── useBookmarkBarNavigation.js   # Navigation for bar
│   │   ├── useBookmarkBarSearch.js       # Search for bar
│   │   ├── useBookmarkBarEdit.js         # CRUD operations for bar
│   │   ├── useBookmarkBarDragScroll.js   # Horizontal scroll for bar
│   │   ├── useBookmarksData.js           # Data loading for full page
│   │   ├── useBookmarksNavigation.js     # Navigation for full page
│   │   ├── useBookmarksSearch.js         # Search for full page
│   │   ├── useBookmarksCRUD.js           # CRUD operations for full page
│   │   └── useBookmarksDragDrop.js       # Drag-drop reorder for full page
│   ├── layouts/
│   │   └── Layout.astro        # Base HTML layout
│   ├── pages/
│   │   ├── index.astro         # Landing page with instructions
│   │   ├── bar.astro           # Bookmark bar iframe view
│   │   ├── manager.astro       # Full-page manager view
│   │   ├── setup.astro         # Configuration page
│   │   └── api/
│   │       ├── bookmarks.js    # GET/POST bookmark data
│   │       └── gist/
│   │           └── create.js   # Create new Gist
│   ├── utils/
│   │   ├── bookmarklet.js      # Bookmarklet code generator
│   │   ├── gist.js             # GitHub Gist API functions
│   │   ├── storage.js          # localStorage helpers
│   │   └── yaml.js             # YAML parsing utilities
│   └── styles/
│       └── global.css          # Global styles with theme tokens
├── Dockerfile
├── .env.example
├── .envrc                      # direnv configuration
├── astro.config.mjs
└── package.json
```

## Environment Variables

The application uses the following environment variables:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PUBLIC_APP_URL` | The public URL where the app is hosted | `http://localhost:4321` | Yes (for production) |

**Important**: `PUBLIC_APP_URL` must be set at **build time** (not runtime) because Astro bakes public environment variables into the built JavaScript.

### Setting Environment Variables

**Development (.envrc with direnv)**:
```bash
export PUBLIC_APP_URL=http://localhost:4321
```

**Development (.env file)**:
```bash
PUBLIC_APP_URL=http://localhost:4321
```

**Docker (build argument)**:
```bash
docker build --build-arg PUBLIC_APP_URL=https://bookmarks.productive.me -t bookmarks-bar .
```

**Traditional build**:
```bash
export PUBLIC_APP_URL=https://bookmarks.productive.me
npm run build
```

## Usage

### Setting Up

1. **Create a GitHub Personal Access Token**
   - Go to https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Give it a name like "Bookmarks Bar"
   - Select only the `gist` scope
   - Copy the token

2. **Install the Bookmarklet**
   - Visit your deployed app's homepage
   - Drag the "Bookmarks Bar" button to your browser's bookmarks bar

3. **First-Time Configuration**
   - Click the bookmarklet on any webpage
   - Click **Setup** to open the configuration page in a new tab
   - Paste your GitHub token
   - Either create a new Gist or enter an existing Gist ID
   - Click "Save Configuration"
   - Close the setup tab and return to your webpage
   - Click the **Reload** button in the bookmarks bar
     - This grants storage access permission (browser security requirement)
   - Your bookmarks will now load!

**Note**: The first time you use the bookmarklet, you need to click "Reload" to grant the iframe permission to access localStorage. This is a browser security feature for third-party iframes. After the first time, it should work automatically.

### Content Security Policy (CSP) Restrictions

Some websites have strict Content Security Policy (CSP) settings that block third-party iframes. 

**Automatic Fallback:**
- The bookmarklet detects when CSP blocks the iframe
- It automatically opens your bookmarks in a new tab instead
- You'll see a console message: "Bookmarks Bar: CSP blocked iframe, opening in new tab"
- This provides full functionality even on CSP-restricted sites

**Sites commonly affected:**
- GitHub pages
- Banking websites
- Enterprise web applications
- Sites with strict security policies

**Note**: The fallback opens bookmarks in a separate tab, which means you won't see the inline bar on the original page. This is a browser security limitation that cannot be bypassed.

### Using the Bookmarklet

- Click the bookmarklet on any webpage to toggle the bookmark bar
- The bar appears at the top of the page, pushing content down
- Click folders to navigate deeper
- Click bookmarks to navigate to them in the current tab
- Use the breadcrumb trail to navigate back
- Click the home icon or title to reload from Gist and return to root

### Adding Bookmarks

**In the Bookmark Bar (40px compact view)**:
1. Navigate to the folder where you want to add a bookmark
2. Click the "+" button
3. A menu appears with two options:
   - **"Add Page"** - Adds the current webpage to your bookmarks
   - **"New Folder"** - Creates a new folder (inline input appears)

**In the Full Manager (manager.astro)**:
1. Navigate to the desired folder
2. Click the "+ Add Bookmark" or "+ Add Folder" button
3. Fill in the details in the modal
4. Click "Save"

## YAML Format

Bookmarks are stored in a simple YAML format:

```yaml
bookmarks:
  - name: "Development"
    type: folder
    children:
      - name: "GitHub"
        type: link
        url: "https://github.com"
      - name: "Tools"
        type: folder
        children:
          - name: "VS Code"
            type: link
            url: "https://code.visualstudio.com"
  - name: "News"
    type: folder
    children:
      - name: "Hacker News"
        type: link
        url: "https://news.ycombinator.com"
```

## API Routes

- **GET /api/bookmarks** - Fetch bookmarks from Gist
  - Query params: `token`, `gistId`
  - Returns: `{ content: string }` (YAML content)

- **POST /api/bookmarks** - Update bookmarks in Gist
  - Body: `{ token, gistId, content }`
  - Returns: `{ success: boolean }`

- **POST /api/gist/create** - Create new Gist
  - Body: `{ token }`
  - Returns: `{ gistId: string }`

## Security Considerations

- GitHub tokens are stored in localStorage (on the iframe's domain)
- Gists are created as **secret** (not public) by default
- Tokens should have minimal permissions (only `gist` scope)
- Communication between bookmarklet and iframe uses `postMessage`
- Always use HTTPS in production

## Implemented Features

All core features are now implemented:

- ✅ **Edit/delete existing bookmarks** - Inline editing and delete buttons
- ✅ **Drag-and-drop reordering** - Full drag-drop support in manager view
- ✅ **Search/filter bookmarks** - Global recursive search across entire tree
- ✅ **Keyboard shortcuts** - Enter to save, Escape to cancel editing
- ✅ **Drag-to-scroll** - Mouse drag horizontal scrolling in compact bar
- ✅ **Breadcrumb navigation** - Click any breadcrumb to jump to that folder
- ✅ **Parent folder navigation** - ".." folder in sidebar to go up one level
- ✅ **Optimistic updates** - UI updates immediately, syncs to Gist in background

## Future Enhancements

Potential features to add:

- [ ] Import from browser bookmarks
- [ ] Export bookmarks to HTML/JSON
- [ ] Bookmark icons/favicons
- [ ] Multi-device sync status indicator
- [ ] Offline support with service workers
- [ ] Bookmark tags/labels
- [ ] Recently visited bookmarks

## License

MIT
