// server-integration.js - Integrated server for Elefunction startIntegratedServer() {
  return new Promise((resolve, reject) => {
    const app = express();
    app.use(cors());
    app.use(bodyParser.json());

    // Add error handling middleware
    app.use((err, req, res, next) => {
      console.error('Express error:', err);
      res.status(500).json({ error: 'Internal server error', details: err.message });
    });

    // Serve static files from the built React app
    const isBuiltApp = __dirname.includes('app.asar') || process.env.NODE_ENV === 'production';
    if (!isDev || isBuiltApp) {
      app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
    }

    // Import server routes
    require('./server-routes')(app, getYtDlpPath);cess
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const isDev = require('electron-is-dev');

let serverInstance = null;

// Get the path to the bundled yt-dlp binary
function getYtDlpPath() {
  const isBuiltApp = __dirname.includes('app.asar') || process.env.NODE_ENV === 'production';
  
  if (isDev && !isBuiltApp) {
    // In development, use bundled binary from project root
    const devBinaryPath = path.join(__dirname, '..', 'bin', 'yt-dlp.exe');
    if (fs.existsSync(devBinaryPath)) {
      return `"${devBinaryPath}"`;
    }
    // Fallback to system yt-dlp in development
    return 'yt-dlp';
  }
  
  // In production (packaged app), the binary is in app.asar.unpacked
  const platform = process.platform;
  const binaryName = platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
  
  // Try different possible locations for the binary
  let binaryPath;
  
  if (__dirname.includes('app.asar')) {
    // When running from ASAR, binary is in app.asar.unpacked
    binaryPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'bin', binaryName);
  } else {
    // When running unpackaged
    binaryPath = path.join(__dirname, '..', 'bin', binaryName);
  }
  
  console.log('Trying binary path:', binaryPath);
  console.log('Binary exists:', fs.existsSync(binaryPath));
  
  if (fs.existsSync(binaryPath)) {
    return `"${binaryPath}"`;
  }
  
  // Fallback to system yt-dlp
  console.warn('Bundled yt-dlp not found, falling back to system yt-dlp');
  return 'yt-dlp';
}

function startIntegratedServer() {
  return new Promise((resolve, reject) => {
    const app = express();
    app.use(cors());
    app.use(bodyParser.json());

    // Serve static files from the built React app
    const isBuiltApp = __dirname.includes('dist-electron') || process.env.NODE_ENV === 'production';
    if (!isDev || isBuiltApp) {
      app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
    }

    // Import server routes
    require('./server-routes')(app, getYtDlpPath);

    // Serve React app for all other routes (in production)
    if (!isDev || isBuiltApp) {
      app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
      });
    }

    serverInstance = app.listen(3001, () => {
      console.log('🚀 Integrated server listening on http://localhost:3001');
      resolve();
    });

    serverInstance.on('error', (error) => {
      console.error('Server error:', error);
      reject(error);
    });
  });
}

function stopIntegratedServer() {
  if (serverInstance) {
    serverInstance.close();
    serverInstance = null;
  }
}

module.exports = { startIntegratedServer, stopIntegratedServer };
