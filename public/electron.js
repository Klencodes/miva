const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;

// Check if development mode - SIMPLIFIED AND RELIABLE
const isDev = !app.isPackaged || process.env.NODE_ENV === 'development';

console.log(`
╔════════════════════════════════════════╗
║                                           ║
║ 🚀 HMS Electron App                ║
║ ${isDev ? '🔧 DEV MODE' : '📦 PRODUCTION'} ║
║                                            ║
╠════════════════════════════════════════╣
║ App path: ${app.getAppPath().substring(0, 30)}...║
║ Is packaged: ${app.isPackaged}                        ║
╚════════════════════════════════════════╝
`);

let mainWindow;

// Function to get correct asset path for both dev and production
function getAssetPath(relativePath) {
  if (isDev) {
    // In dev: from project root
    return path.join(process.cwd(), relativePath);
  } else {
    // In production: from app.asar
    return path.join(process.resourcesPath, 'app.asar', relativePath);
  }
}

function showErrorPage(message) {
  const errorHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Error - MIVA - HMS</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }
        .error-container {
          max-width: 600px;
          background: rgba(255, 255, 255, 0.1);
          padding: 40px;
          border-radius: 16px;
          backdrop-filter: blur(10px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 { font-size: 2rem; margin-bottom: 20px; }
        p { margin-bottom: 20px; line-height: 1.6; }
        code {
          background: rgba(0, 0, 0, 0.3);
          padding: 12px;
          border-radius: 8px;
          display: block;
          margin: 20px 0;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          word-break: break-all;
        }
        .button-group { display: flex; gap: 12px; margin-top: 30px; }
        button {
          flex: 1;
          background: white;
          color: #667eea;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        button.secondary {
          background: transparent;
          color: white;
          border: 2px solid white;
        }
      </style>
    </head>
    <body>
      <div class="error-container">
        <h1>⚠️ Application Error</h1>
        <p>${message}</p>
        <code>${__dirname}</code>
        <p>Possible solutions:</p>
        <ol style="margin-left: 20px; margin-bottom: 20px;">
          <li>Reinstall the application</li>
          <li>Check if all files are present</li>
          <li>Contact support</li>
        </ol>
        <div class="button-group">
          <button onclick="window.location.reload()">Retry</button>
          <button class="secondary" onclick="window.close()">Close</button>
        </div>
      </div>
    </body>
    </html>
  `;
  
  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHTML)}`);
}
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: !isDev,
      allowRunningInsecureContent: isDev,
      devTools: isDev
    },
    icon: path.join(__dirname, '../../public/logo512.png'),
    show: false,
    backgroundColor: '#ffffff',
    titleBarStyle: 'hiddenInset',
    frame: true,
    autoHideMenuBar: false
  });

  // Load the app
  if (isDev) {
    // DEVELOPMENT - load from React dev server
    console.log('🔧 DEV MODE: Loading from http://localhost:3000');
    try {
      await mainWindow.loadURL('http://localhost:3000');
      console.log('✅ Successfully loaded development server');
      mainWindow.webContents.openDevTools();
    } catch (error) {
      console.error('❌ Failed to load development server:', error.message);
      console.log('💡 Make sure "npm run dev" is running on port 3000');
      showErrorPage('Development server not running. Please run "npm run dev" first.');
    }
  } else {
    // PRODUCTION - load from build folder in ASAR
    console.log('📦 PRODUCTION MODE: Loading from build folder');
    
    try {
      // In production with ASAR, __dirname is: /resources/app.asar/build/electron
      // So index.html is at: /resources/app.asar/build/index.html
      const indexPath = path.join(__dirname, '../index.html');
      
      console.log('📁 Attempting to load:', indexPath);
      
      // Check if file exists
      await fs.access(indexPath);
      console.log('✅ Found index.html at:', indexPath);
      
      // Load the file
      await mainWindow.loadFile(indexPath);
      console.log('✅ Successfully loaded application');
      
    } catch (error) {
      console.error('❌ Failed to load production build:', error);
      
      // Try alternative paths as fallback
      console.log('🔍 Trying alternative paths...');
      
      const alternativePaths = [
        path.join(process.resourcesPath, 'app.asar/build/index.html'),
        path.join(app.getAppPath(), 'build/index.html'),
        path.join(__dirname, '../../build/index.html'),
        path.join(process.cwd(), 'build/index.html')
      ];
      
      let loaded = false;
      
      for (const altPath of alternativePaths) {
        try {
          console.log('   Trying:', altPath);
          await fs.access(altPath);
          console.log('   ✅ Found at:', altPath);
          await mainWindow.loadFile(altPath);
          console.log('   ✅ Loaded successfully');
          loaded = true;
          break;
        } catch (e) {
          console.log('   ❌ Not found');
        }
      }
      
      if (!loaded) {
        showErrorPage(`Build files not found. Please reinstall the application. Error: ${error.message}`);
      }
    }
  }

  // Remove menu in production
  if (!isDev) {
    Menu.setApplicationMenu(null);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
    console.log('🪟 Window is ready and shown');
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}



// IPC Handlers
ipcMain.handle('get-app-info', () => {
  return {
    version: app.getVersion(),
    platform: process.platform,
    isDev: isDev,
    appPath: app.getAppPath(),
    resourcesPath: process.resourcesPath,
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
    chromeVersion: process.versions.chrome
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
  console.log('⚡ App is ready, creating window...');
  createWindow().catch(error => {
    console.error('❌ Failed to create window:', error);
  });
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow().catch(console.error);
    }
  });
});

app.on('window-all-closed', () => {
  console.log('🚪 All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Error handlers
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});