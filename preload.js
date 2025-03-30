const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', callback),
  installUpdate: () => ipcRenderer.send('install-update'),
  checkUpdates: () => ipcRenderer.send('check-updates'),
});