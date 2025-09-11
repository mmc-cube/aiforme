# Knowledge Blog - CodeBuddy Development Guide

This is a Next.js + Netlify personal knowledge blog with invite-code authentication system.

## Development Commands

```bash
# Install dependencies
npm install

# Local development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Export static build (alternative)
npm run export
```

## Environment Setup

Create `.env.local` file (see `.env.example` for reference):

```env
JWT_SECRET=your-super-secret-jwt-key-here-at-least-32-chars
INVITE_CODES=welcome123,demo456,test789
NEXT_TELEMETRY_DISABLED=1
```

## Architecture Overview

### Authentication System
- **Invite Code Verification**: Netlify Function at `netlify/functions/verify-invite.ts` validates codes against `INVITE_CODES` env var
- **JWT Token Management**: Uses `jose` library for token generation/verification with 30-day expiry
- **Client-side Auth**: React Context (`AuthProvider.tsx`) manages auth state with localStorage persistence
- **Auth Service**: `src/lib/auth.ts` handles all authentication operations

### Content Management
- **Markdown Processing**: Posts stored in `/posts` directory, processed with `gray-matter` + `remark`
- **Post Structure**: Front matter with title, date, excerpt, tags, author
- **Static Generation**: Next.js SSG for performance, posts processed at build time
- **Content API**: `src/lib/posts.ts` provides utilities for post fetching, filtering, searching

### Key Components
- **AuthProvider**: Global auth context wrapping the app
- **LoginForm**: Invite code input with validation
- **Layout System**: App Router structure with global metadata

### Deployment Configuration
- **Netlify Config**: `netlify.toml` configures build, functions, headers, redirects
- **Next.js Config**: Optimized for static deployment with image optimization disabled
- **Security Headers**: X-Frame-Options, CSP, XSS protection configured in netlify.toml

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/posts/         # API routes for posts
│   ├── layout.tsx         # Root layout with AuthProvider
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── AuthProvider.tsx   # Authentication context
│   └── LoginForm.tsx      # Login form component
└── lib/                   # Utility libraries
    ├── auth.ts            # Authentication service
    └── posts.ts           # Post management utilities

netlify/
└── functions/
    └── verify-invite.ts   # Serverless function for invite validation

posts/                     # Markdown content directory
├── welcome.md            # Sample posts
└── *.md                  # Article files with front matter
```

## Content Management

### Adding New Posts
1. Create `.md` file in `/posts` directory
2. Include required front matter:
   ```yaml
   ---
   title: "Post Title"
   date: "YYYY-MM-DD"
   excerpt: "Brief description"
   tags: ["tag1", "tag2"]
   author: "Author Name"
   ---
   ```
3. Write content in Markdown below front matter
4. Commit and push to trigger rebuild

### Post Processing Pipeline
- `getAllPostsMetadata()`: Reads all posts, extracts metadata, sorts by date
- `getPostData()`: Converts individual post Markdown to HTML
- `searchPosts()`: Full-text search across titles and excerpts
- `getPostsByTag()`: Filter posts by tags

## Authentication Flow

1. User enters invite code in LoginForm
2. Code sent to `/netlify/functions/verify-invite` 
3. Function validates against `INVITE_CODES` environment variable
4. On success, JWT token generated and returned
5. Client stores token in localStorage
6. AuthProvider validates token on app load and protects routes

## Deployment Setup

### Netlify Configuration
- Build command: `npm run build`
- Publish directory: `.next` 
- Functions directory: `netlify/functions`
- Node version: 18

### Required Environment Variables
- `JWT_SECRET`: Strong secret for JWT signing (32+ characters)
- `INVITE_CODES`: Comma-separated list of valid codes
- `NODE_VERSION`: Set to 18 in Netlify

## Development Notes

- Uses TypeScript with path aliases (`@/*` maps to `./src/*`)
- TailwindCSS for styling with typography plugin
- Static export optimized for Netlify deployment
- Image optimization disabled for static hosting
- Security headers configured for production deployment