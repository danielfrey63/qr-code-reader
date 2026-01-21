# QR Code Reader PWA

A lightweight, high-performance Progressive Web Application (PWA) for scanning QR codes. The application focuses on essential functionality: fast scanning and displaying raw content. It is fully offline-capable and stores scan history locally on the device.

## Features

- **Real-time QR Code Scanning**: Automatic detection and scanning via device camera
- **Offline-First Architecture**: Fully functional without internet connection
- **Local Scan History**: FIFO queue with up to 20 entries stored locally
- **Clipboard Support**: Copy scanned content to clipboard with one tap
- **Theme Switching**: Light, dark, and system auto-detection modes
- **Camera Selection**: Switch between front and back cameras (back camera default)
- **Cross-Platform**: Works on iOS Safari and Android Chrome/Firefox
- **Installable**: Add to home screen as a native-like app
- **Privacy-Focused**: No external trackers, no server-side data processing

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 18 with TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS v4 |
| UI Components | Shadcn/UI |
| Icons | Lucide React |
| QR Scanner | html5-qrcode |
| Storage | localStorage |
| Offline | Service Worker |
| Hosting | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/danielfrey63/qr-code-reader.git
   cd qr-code-reader
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The production build will be output to the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run generate-icons` | Generate PWA icons |

## Project Structure

```
qr-code-reader/
├── public/
│   ├── icons/              # PWA icons (various sizes)
│   ├── manifest.json       # PWA manifest
│   └── sw.js               # Service worker
├── src/
│   ├── components/         # React components
│   │   ├── layout/         # Layout components (Header, MainLayout)
│   │   ├── ui/             # UI primitives (Button, etc.)
│   │   ├── CameraPermission.tsx
│   │   ├── CameraPreview.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── ErrorFallback.tsx
│   │   ├── HistoryButton.tsx
│   │   ├── HistoryModal.tsx
│   │   ├── QRScanner.tsx
│   │   ├── ScanResultOverlay.tsx
│   │   ├── SettingsModal.tsx
│   │   ├── ThemeToggle.tsx
│   │   └── ToastContainer.tsx
│   ├── contexts/           # React Context providers
│   │   ├── ThemeContext.tsx
│   │   └── ToastContext.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useCameraDevices.ts
│   │   ├── useCameraPermission.ts
│   │   ├── useQRScanner.ts
│   │   └── useScanHistory.ts
│   ├── services/           # Service layer
│   │   ├── cameraService.ts
│   │   └── serviceWorkerRegistration.ts
│   ├── types/              # TypeScript type definitions
│   │   ├── camera.ts
│   │   ├── errors.ts
│   │   ├── history.ts
│   │   └── scanner.ts
│   ├── utils/              # Utility functions
│   │   ├── clipboard.ts
│   │   ├── errorFactory.ts
│   │   └── localStorage.ts
│   ├── lib/                # Library utilities
│   │   └── utils.ts        # Tailwind merge utility
│   ├── App.tsx             # Main application component
│   ├── App.css             # Application styles
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles
├── index.html              # HTML entry point
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.js      # Tailwind CSS configuration (v4)
├── vercel.json             # Vercel deployment configuration
└── package.json            # Project dependencies
```

## How It Works

### Camera Access

The app requests camera permission on first use. Once granted, it starts the QR scanner with the back camera (preferred for scanning) and continuously analyzes the video feed for QR codes.

### Scanning Process

1. Camera stream is displayed in a full-screen viewfinder
2. A scanning region overlay guides the user
3. When a QR code is detected, scanning stops automatically
4. The result is displayed in an overlay with options to copy or scan again

### Scan History

- Scanned QR codes are automatically saved to local storage
- History is limited to 20 entries (FIFO - oldest removed when full)
- Each entry includes: content, format, timestamp, and camera metadata
- History can be viewed and cleared from the settings

### Offline Support

The service worker caches all static assets and enables offline functionality:
- **Static assets**: Cache First strategy
- **HTML pages**: Network First with cache fallback
- **Runtime requests**: Stale While Revalidate

## Browser Requirements

- **iOS**: Safari 11+
- **Android**: Chrome 57+, Firefox 52+
- **Desktop**: Chrome 57+, Firefox 52+, Safari 11+, Edge 79+

### Required APIs

- MediaDevices API (camera access)
- Service Worker API (offline support)
- Web App Manifest (PWA installation)
- Clipboard API (copy functionality)

## Privacy

This application is designed with privacy in mind:

- All camera processing happens locally in the browser
- No camera data is sent to any server
- Scan history is stored only in your browser's localStorage
- No analytics or tracking scripts
- No cookies (except for service worker cache)

## Deployment

### Vercel (Recommended)

The project includes a `vercel.json` configuration for optimal deployment:

1. Connect your GitHub repository to Vercel
2. Vercel will automatically detect the Vite framework
3. Deploy with default settings

### Manual Deployment

1. Build the project: `npm run build`
2. Deploy the `dist` directory to any static hosting service
3. Ensure HTTPS is enabled (required for camera access and PWA)

### Security Headers

The Vercel configuration includes security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(self)`

## Development Guidelines

- Use React Context for state management (not Redux)
- Follow Shadcn/UI component patterns
- Store settings and history in localStorage
- Use Lucide React icons as React components
- Implement proper error handling for camera operations
- Stop camera operations after successful scan
- Do not auto-interpret scanned content (no auto-open URLs, etc.)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

## License

This project is open source. See the license file for details.

## Acknowledgments

- [html5-qrcode](https://github.com/mebjas/html5-qrcode) - QR code scanning library
- [Shadcn/UI](https://ui.shadcn.com/) - UI component library
- [Lucide](https://lucide.dev/) - Icon library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
