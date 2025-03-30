const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = false; // Важно!

let mainWindow;
let updateDownloaded = false; // Флаг, что обновление загружено

function createWindow() {
mainWindow = new BrowserWindow({
  width: 800,
  height: 600,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'), // Путь исправлен
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: false,
  },
});

  mainWindow.loadFile(path.join(__dirname, 'public', 'index.html'));

  // Тихая проверка при запуске
  autoUpdater.checkForUpdates().catch(err => {
    log.error('Фоновая проверка:', err);
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Обработчики обновлений
autoUpdater.on('update-available', () => {
  mainWindow.webContents.send('update-status', {
    message: 'Загрузка обновления...',
    progress: 0,
    readyToInstall: false,
  });
});

autoUpdater.on('update-not-available', () => {
  mainWindow.webContents.send('update-status', {
    message: 'У вас последняя версия!',
    progress: null,
    readyToInstall: updateDownloaded, // Если уже было загружено ранее
    isComplete: true,
  });
});

autoUpdater.on('download-progress', (progress) => {
  mainWindow.webContents.send('update-status', {
    message: `Загрузка: ${Math.floor(progress.percent)}%`,
    progress: progress.percent,
    readyToInstall: false,
  });
});

autoUpdater.on('update-downloaded', () => {
  updateDownloaded = true; // Запомним, что обновление готово
  mainWindow.webContents.send('update-status', {
    message: 'Готово к установке!',
    progress: 100,
    readyToInstall: true,
    isComplete: true,
  });
});

autoUpdater.on('error', (err) => {
  log.error('Ошибка:', err);
  mainWindow.webContents.send('update-status', {
    message: 'Ошибка: ' + err.message,
    progress: null,
    readyToInstall: updateDownloaded, // Покажем кнопку, если обновление уже есть
    isComplete: true,
  });
});

// IPC-обработчики
ipcMain.on('check-updates', () => {
  if (updateDownloaded) {
    mainWindow.webContents.send('update-status', {
      message: 'Готово к установке!',
      progress: 100,
      readyToInstall: true,
      isComplete: true,
    });
    return;
  }

  autoUpdater.checkForUpdates().catch(err => {
    log.error('Ошибка проверки:', err);
    mainWindow.webContents.send('update-status', {
      message: 'Ошибка подключения',
      progress: null,
      readyToInstall: updateDownloaded,
      isComplete: true,
    });
  });
});

ipcMain.on('install-update', () => {
  autoUpdater.quitAndInstall();
});