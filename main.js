const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 380,
    minHeight: 510,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    autoHideMenuBar: true,
  });

  mainWindow.loadFile(path.join(__dirname, 'public', 'index.html'));

  // Проверка обновлений при запуске
  mainWindow.webContents.on('did-finish-load', () => {
    autoUpdater.checkForUpdatesAndNotify().catch(err => {
      log.error('Update error:', err);
    });
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Обработчики обновлений
autoUpdater.on('update-available', () => {
  log.info('Update available');
});

autoUpdater.on('download-progress', (progress) => {
  log.info(`Download progress: ${Math.floor(progress.percent)}%`);
});

autoUpdater.on('update-downloaded', () => {
  mainWindow.webContents.send('update-status', {
    message: 'Готово к обновлению!',
    readyToInstall: true
  });
});

autoUpdater.on('error', (err) => {
  log.error('Update error:', err);
});

ipcMain.on('install-update', () => {
  autoUpdater.quitAndInstall();
});