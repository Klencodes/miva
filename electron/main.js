const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;

// Check if development mode
const isDev = process.env.NODE_ENV === 'development' || 
              !app.isPackaged || 
              process.defaultApp ||
              /[\\/]electron-prebuilt[\\/]/.test(process.execPath) ||
              /[\\/]electron[\\/]/.test(process.execPath);

console.log('Is development:', isDev);
console.log('App path:', app.getAppPath());
console.log('Exec path:', process.execPath);

let mainWindow;

// Function to get correct asset path for both dev and production
function getAssetPath(relativePath) {
  if (isDev) {
    return path.join(__dirname, '..', relativePath);
  } else {
    // For packaged app
    return path.join(process.resourcesPath, 'app', relativePath);
  }
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: !isDev,
      allowRunningInsecureContent: isDev,
      devTools: isDev
    },
    icon: path.join(__dirname, 'logo192.png'),
    show: false,
    backgroundColor: '#ffffff',
    titleBarStyle: 'hiddenInset',
    frame: true,
    autoHideMenuBar: false
  });

  // Enhanced CSP for production
  if (!isDev) {
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: https:; " +
            "font-src 'self' data:; " +
            "connect-src 'self' https:; " +
            "frame-src 'none'; " +
            "object-src 'none'"
          ]
        }
      });
    });
  }

  // Load app
  if (isDev) {
    console.log('Development mode: Loading from http://localhost:3000');
    try {
      await mainWindow.loadURL('http://localhost:3000');
      console.log('Successfully loaded development server');
      mainWindow.webContents.openDevTools();
    } catch (error) {
      console.error('Failed to load development server:', error);
      showErrorPage('Development server not running. Please run "npm start" first.');
    }
  } else {
    console.log('Production mode: Loading build files');
    try {
      // Get the correct path using our helper function
      const indexPath = getAssetPath('build/index.html');
      console.log('Looking for index.html at:', indexPath);
      
      // Check if file exists
      await fs.access(indexPath);
      console.log('Found index.html');
      
      // Try different loading methods
      try {
        // Method 1: loadFile (recommended)
        await mainWindow.loadFile(indexPath);
        console.log('Successfully loaded with loadFile()');
      } catch (error1) {
        console.log('loadFile failed, trying loadURL:', error1.message);
        
        // Method 2: loadURL with file:// protocol
        await mainWindow.loadURL(`file://${indexPath}`);
        console.log('Successfully loaded with loadURL()');
      }
    } catch (error) {
      console.error('Failed to load production build:', error);
      
      // List available paths for debugging
      console.log('Trying alternative paths...');
      const alternativePaths = [
        path.join(__dirname, '../build/index.html'),
        path.join(process.cwd(), 'build/index.html'),
        path.join(app.getAppPath(), 'build/index.html'),
        path.join(app.getAppPath(), 'index.html')
      ];
      
      for (const altPath of alternativePaths) {
        try {
          await fs.access(altPath);
          console.log('Found at alternative path:', altPath);
          await mainWindow.loadFile(altPath);
          console.log('Loaded from alternative path');
          return;
        } catch (e) {
          console.log('Not found:', altPath);
        }
      }
      
      showErrorPage(`Build files not found. Error: ${error.message}`);
    }
  }

  // Remove menu in production (optional)
  if (!isDev) {
    Menu.setApplicationMenu(null);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
    console.log('Window is ready and shown');
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    console.log('External link clicked:', url);
    if (!url.startsWith('file://') && !url.startsWith('http://localhost')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function showErrorPage(message) {
  mainWindow.loadURL(`data:text/html;charset=utf-8,
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Error - Application Failed to Load</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .error-container {
          max-width: 600px;
          background: rgba(255, 255, 255, 0.1);
          padding: 40px;
          border-radius: 10px;
          backdrop-filter: blur(10px);
        }
        h1 {
          font-size: 2.5rem;
          margin-bottom: 20px;
        }
        code {
          background: rgba(0, 0, 0, 0.2);
          padding: 10px;
          border-radius: 5px;
          display: block;
          margin: 20px 0;
          font-family: 'Courier New', monospace;
        }
        button {
          background: white;
          color: #667eea;
          border: none;
          padding: 12px 24px;
          border-radius: 5px;
          font-size: 16px;
          cursor: pointer;
          margin: 10px 5px;
          transition: transform 0.2s;
        }
        button:hover {
          transform: translateY(-2px);
        }
      </style>
    </head>
    <body>
      <div class="error-container">
        <h1>⚠️ Application Error</h1>
        <p>${message}</p>
        <p>Possible solutions:</p>
        <ol>
          <li>Run <code>npm run build</code> to create build files</li>
          <li>Ensure you're in the correct directory</li>
          <li>Check if build/ folder exists</li>
        </ol>
        <div>
          <button onclick="window.location.reload()">Retry Loading</button>
          <button onclick="window.close()">Close Application</button>
        </div>
      </div>
    </body>
    </html>
  `);
}

// Secure IPC handlers
ipcMain.handle('get-app-info', () => {
  return {
    version: app.getVersion(),
    platform: process.platform,
    isDev: isDev,
    appPath: app.getAppPath(),
    resourcesPath: process.resourcesPath
  };
});

ipcMain.on('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window:close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('dialog:openFile', async (event, options = {}) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: options.filters || [
      { name: 'All Files', extensions: ['*'] }
    ],
    ...options
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// App lifecycle
app.whenReady().then(() => {
  console.log('App is ready, creating window...');
  createWindow().catch(console.error);
  
  app.on('activate', () => {
    console.log('App activated');
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow().catch(console.error);
    }
  });
});

app.on('window-all-closed', () => {
  console.log('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Optional: Handle unhandled errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});