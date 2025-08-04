# YT-DLPloit Distribution Guide

Your YT-DLPloit application has been converted to an Electron app with bundled yt-dlp. Here's how to build and distribute it:

## Development

```bash
# Install all dependencies
npm run install-all

# Start development mode (React dev server + Electron)
npm run dev
```

## Building for Distribution

### 1. Build the application

```bash
npm run build
```

### 2. Create distributable packages

#### For current platform only:

```bash
npm run dist
```

#### For all platforms (Windows, macOS, Linux):

```bash
npm run dist-all
```

#### Test build (unpacked):

```bash
npm run pack
```

## Distribution Files

After building, you'll find the distributable files in the `dist-electron/` directory:

- **Windows**: `YT-DLPloit Setup.exe` (NSIS installer)
- **macOS**: `YT-DLPloit.dmg` (DMG file)
- **Linux**: `YT-DLPloit.AppImage` (portable executable)

## What's Included

✅ **yt-dlp binary** - Automatically downloaded and bundled  
✅ **React frontend** - Built and included  
✅ **Express server** - Bundled with the app  
✅ **Cross-platform** - Works on Windows, macOS, and Linux

## Requirements

- Node.js 16+ for building
- No external dependencies needed for end users
- The final app is completely self-contained

## Customization

### Icons

- Place your custom icons in the `assets/` folder:
  - `icon.png` (512x512) for Linux
  - `icon.ico` for Windows
  - `icon.icns` for macOS

### App Details

Edit the `build` section in `package.json` to customize:

- App name and ID
- Installer options
- File associations

## Troubleshooting

### If build fails:

1. Make sure all dependencies are installed: `npm run install-all`
2. Check that the client builds successfully: `npm run build-client`
3. Ensure yt-dlp was downloaded: `npm run download-yt-dlp`

### If the app doesn't start:

1. Check that the server starts correctly in the console
2. Verify that port 3001 is available
3. Check the Electron dev tools for errors

## File Structure

```
yt-dlploit-electron/
├── main.js                 # Electron main process
├── server/                 # Express server
├── client/                 # React frontend
├── bin/                    # yt-dlp binaries
├── assets/                 # App icons
└── dist-electron/          # Built distributables
```
