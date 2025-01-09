# Slate Editor

A modern, minimal Markdown editor built with Electron and Vue.js. Features workspace-based file management, image support, and real-time preview.

<img width="1312" alt="Screenshot 2025-01-09 at 7 28 53 PM" src="https://github.com/user-attachments/assets/32ce8f44-04e1-49a0-a0cb-5e56855311be" />

## Features

- 📝 Full Markdown support
- 🖼️ Image handling with workspace protocol
- 📁 Workspace-based file management
- 🎨 Clean, minimal interface
- 🔄 Real-time preview
- 📱 Responsive design
- 📤 PDF export

## Development

### Prerequisites

- Node.js (v16 or higher)
- pnpm

### Setup

1. Install dependencies:
```bash
pnpm install
```

2. Run in development mode:
```bash
# Start Nuxt dev server
pnpm dev

# In another terminal, start Electron
pnpm electron:dev
```

### Building

Build for production:
```bash
# Build for macOS
pnpm electron:build
```

## Project Structure

```
.
├── components/          # Vue components
├── electron/           # Electron main process
├── pages/             # Vue pages
├── composables/       # Vue composables
├── assets/           # Static assets
├── build/            # Build configurations
└── public/           # Public static files
```

## Key Technologies

- Electron
- Vue 3
- Nuxt 3
- TipTap
- Tailwind CSS
- electron-builder

## Configuration

### Workspace Protocol

The app uses a custom `workspace://` protocol for handling local files. Configure in `electron/main.js`.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[MIT License](LICENSE)

## Acknowledgments

- [TipTap](https://tiptap.dev/) for the rich text editor
- [Electron](https://www.electronjs.org/) for the desktop framework
- [Vue.js](https://vuejs.org/) for the UI framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
