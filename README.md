# Slate - A Minimal Writing App with AI

Slate is a minimal, local-first writing app with AI capabilities. Write, edit, and improve your content with AI assistance.

## Features

- 📝 Clean, distraction-free writing interface
- 🤖 AI-powered writing assistance (⌘/Ctrl + K)
- 💾 Local-first storage with IndexedDB
- 🌐 Publish and share pages
- 🎨 Rich text formatting
- 📋 Task lists and code blocks
- 🔄 Auto-save
- 📤 Export to Markdown and PDF

## Tech Stack

- Vue 3 + Nuxt 3
- TipTap for rich text editing
- Tailwind CSS for styling
- Supabase for authentication and storage
- OpenAI for AI capabilities

## Setup

1. Clone the repository
2. Install dependencies:
```bash
bun install
```

3. Create a `.env` file with the following variables:
```env
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
APP_URL=your_app_url
```

4. Start the development server:
```bash
bun run dev
```

## Development

The app will be available at `http://localhost:3000`

## Production

Build the application for production:

```bash
bun run build
```

## License

MIT

## Author

Kiran Johns ([@thetronjohnson](https://x.com/thetronjohnson))
