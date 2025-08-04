// main.js - Electron main process
const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const fs = require('fs');
const { startIntegratedServer, stopIntegratedServer } = require('./server/server-integration');

let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    },
    icon: path.join(__dirname, 'assets/icon.png'), // Add your app icon here
    titleBarStyle: 'default',
    show: false // Don't show until ready
  });

  // Load the app
  const isBuiltApp = __dirname.includes('app.asar') || __dirname.includes('dist-electron') || process.env.NODE_ENV === 'production';
  
  let startUrl;
  if (isDev && !isBuiltApp) {
    // Development mode - use Vite dev server
    startUrl = 'http://localhost:5173';
  } else {
    // Production mode - use integrated server
    startUrl = 'http://localhost:3001';
  }
    
  console.log('Loading URL:', startUrl);
  
  // Add a small delay to ensure server is ready
  if (!isDev || isBuiltApp) {
    setTimeout(() => {
      mainWindow.loadURL(startUrl);
    }, 1000);
  } else {
    mainWindow.loadURL(startUrl);
  }

  // Add error handling for loading
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
    // Show an error page or retry
    setTimeout(() => {
      console.log('Retrying to load...');
      mainWindow.loadURL(startUrl);
    }, 2000);
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // DevTools can be opened manually with Ctrl+Shift+I if needed
}

function startServer() {
  return new Promise((resolve, reject) => {
    const isBuiltApp = __dirname.includes('app.asar') || __dirname.includes('dist-electron') || process.env.NODE_ENV === 'production';
    
    console.log('Starting integrated server... isDev:', isDev, 'isBuiltApp:', isBuiltApp, '__dirname:', __dirname);
    
    // Always start the integrated server when running packaged app
    if (!isDev || isBuiltApp) {
      console.log('Starting integrated server...');
      startIntegratedServer()
        .then(() => {
          console.log('Integrated server started successfully!');
          resolve();
        })
        .catch((error) => {
          console.error('Failed to start integrated server:', error);
          reject(error);
        });
    } else {
      console.log('Development mode, not starting integrated server');
      resolve();
    }
  });
}

function stopServer() {
  stopIntegratedServer();
}

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  await startServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  stopServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopServer();
});

// Security: Prevent navigation to external websites
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== 'http://localhost:5173' && parsedUrl.origin !== 'file://') {
      event.preventDefault();
    }
  });
});
