# Bookmarks Bar

A minimal, lightweight bookmark manager that runs as a bookmarklet and stores bookmarks in GitHub Gist. Built with Astro, SolidJS, and Tailwind CSS.

## Features

- 📚 **Bookmarklet-based**: Add a bookmark bar to any webpage with one click
- 🗂️ **Folders & Subfolders**: Organize bookmarks hierarchically
- ➕ **Quick Add**: Easily add the current page to your bookmarks
- 🔄 **GitHub Gist Sync**: Your bookmarks are stored in a private GitHub Gist
- 🌓 **Light/Dark Theme**: Automatically follows system preferences
- 🔒 **Privacy-focused**: Data stored in your own GitHub Gist
- 🎨 **Minimal Design**: Clean, unobtrusive interface

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

1. **Build the image**
   ```bash
   docker build -t bookmarks-bar .
   ```

2. **Run the container**
   ```bash
   docker run -d \
     -p 4321:4321 \
     -e PUBLIC_APP_URL=https://bookmarks.productive.me \
     --name bookmarks-bar \
     bookmarks-bar
   ```

3. **Access the application**
   - Visit http://localhost:4321 (or your configured domain)

### Production Deployment

1. **Environment Variables**
   - Set `PUBLIC_APP_URL` to your production domain (e.g., `https://bookmarks.productive.me`)
   - This URL will be embedded in the bookmarklet

2. **Deploy Options**
   - **Docker**: Use the Dockerfile for containerized deployment
   - **Traditional Hosting**: Build with `npm run build` and deploy the `dist` folder
   - Make sure the hosting supports:
     - Server-side rendering (for API routes)
     - CORS headers for iframe embedding
     - Node.js runtime

## Project Structure

```
/
├── src/
│   ├── components/
│   │   ├── BookmarkBar.jsx     # Main bookmark bar with breadcrumbs
│   │   ├── BookmarkItem.jsx    # Individual bookmark/folder component
│   │   └── ConfigModal.jsx     # Setup modal for GitHub config
│   ├── layouts/
│   │   └── Layout.astro        # Base HTML layout
│   ├── pages/
│   │   ├── index.astro         # Landing page with instructions
│   │   ├── bar.astro           # Bookmark bar iframe view
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

**Note**: Variables prefixed with `PUBLIC_` are exposed to the client-side code.

### Setting Environment Variables

**Development (.envrc with direnv)**:
```bash
export PUBLIC_APP_URL=http://localhost:4321
```

**Development (.env file)**:
```bash
PUBLIC_APP_URL=http://localhost:4321
```

**Docker**:
```bash
docker run -e PUBLIC_APP_URL=https://bookmarks.productive.me ...
```

## Usage

### Setting Up

1. **Create a GitHub Personal Access Token**
   - Go to https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Give it a name like "Bookmarks Bar"
   - Select only the `gist` scope
   - Copy the token

2. **Configure the App**
   - Visit `/setup` on your deployed app
   - Paste your GitHub token
   - Either create a new Gist or enter an existing Gist ID
   - Click "Save Configuration"

3. **Install the Bookmarklet**
   - Drag the "📚 Bookmarks Bar" button from the homepage to your browser's bookmarks bar

### Using the Bookmarklet

- Click the bookmarklet on any webpage to toggle the bookmark bar
- The bar appears at the top of the page, pushing content down
- Click folders to navigate deeper
- Click bookmarks to open them in a new tab
- Use the breadcrumb trail to navigate back

### Adding Bookmarks

1. Navigate to the folder where you want to add a bookmark
2. Click the "+ Add" button
3. Select "Add Current Page" to bookmark the current page
4. Or select "Add Folder" to create a new folder

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

## Future Enhancements

Potential features to add:

- [ ] Edit/delete existing bookmarks
- [ ] Drag-and-drop reordering
- [ ] Search/filter bookmarks
- [ ] Import from browser bookmarks
- [ ] Export bookmarks
- [ ] Keyboard shortcuts
- [ ] Bookmark icons/favicons
- [ ] Multi-device sync status indicator

## License

MIT
