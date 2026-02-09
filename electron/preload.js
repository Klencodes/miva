const { contextBridge, ipcRenderer } = require('electron');

// Define what APIs are exposed to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Safe methods to expose
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  
  // Window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  
  // File system (with validation)
  selectFile: (options) => ipcRenderer.invoke('dialog:openFile', options),
  
  // Safe event listeners
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update:available', callback);
    return () => ipcRenderer.removeListener('update:available', callback);
  },
  
  // Platform info
  platform: process.platform,
  
  // Remove unsafe methods
  // DO NOT expose require(), process, or fs directly
});