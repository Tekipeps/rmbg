# rmbg Download Page

A simple, single-page website for downloading rmbg builds across different platforms.

## Features

- Non-scrollable, single-page design
- Automatic detection of latest GitHub releases
- Download links for:
  - macOS (Intel x64 and Apple Silicon ARM64)
  - Linux (x64)
  - Windows (x64)
- Links to GitHub repository and developer profile

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Docker

Build and run using Docker:

```bash
# Build the image
docker build -t rmbg-web .

# Run the container
docker run -p 8080:80 rmbg-web
```

The site will be available at `http://localhost:8080`.

The Docker image uses a multi-stage build with:
- Build stage: `node:20-alpine` (~40MB base)
- Production stage: `nginx:alpine` (~40MB base)
- Final image size: ~10-15MB (excluding layers)

## Deployment

The site can be deployed to any static hosting service:

- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages
- Docker (see above)

Simply build the project and deploy the `dist` folder.

## How It Works

The page uses the GitHub API to fetch the latest release and automatically updates download links based on the available assets. If no release is found, all links fallback to the GitHub releases page.
