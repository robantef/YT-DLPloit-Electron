# YouTube Downloader GUI

A modern YouTube video downloader with a beautiful GUI built with React and Node.js.

## Features

- 🎥 Download YouTube videos with custom quality selection
- 🖼️ Download video thumbnails
- 🎵 Extract audio in various formats
- 📝 Download subtitles (auto-generated or manual)
- ⏱️ Trim videos with custom duration
- 🌙 Dark/Light theme support
- 📱 Responsive design
- 📊 Real-time download progress

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) installed and available in PATH

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd yt-dls
```

2. Install all dependencies:

```bash
npm run install-all
```

## Development

Start both server and client in development mode:

```bash
npm run dev
```

This will start:

- Backend server on `http://localhost:3001`
- Frontend client on `http://localhost:5173`

## Individual Services

Start only the server:

```bash
npm run server
```

Start only the client:

```bash
npm run client
```

## Build for Production

```bash
npm run build
```

## Usage

1. Enter a YouTube URL in the input field
2. Click "Analyze" to fetch video information
3. Configure download options:
   - Choose video/audio quality
   - Select subtitle language
   - Set custom duration (optional)
   - Enable thumbnail download
4. Click "Start Download" to begin

Downloads will be saved to the `server/downloads` directory.

## Project Structure

```
yt-dls/
├── client/          # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
├── server/          # Express backend
│   ├── server.js
│   ├── downloads/   # Downloaded files
│   └── package.json
└── package.json     # Root package.json
```

## Technologies Used

- **Frontend**: React, TypeScript, Vite, CSS3
- **Backend**: Node.js, Express, yt-dlp
- **Styling**: Custom CSS with CSS Variables
- **Icons**: Custom SVG icons

## License

ISC
