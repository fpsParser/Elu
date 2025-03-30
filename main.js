const { app, BrowserWindow, Menu, dialog, Notification, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

// Конфигурация логов
log.transports.file.file = path.join(app.getPath('userData'), 'logs/main.log');
log.transports.file.level = 'info';

// Конфигурация автообновления
autoUpdater.logger = log;
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.allowDowngrade = false;

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
      enableRemoteModule: true
    },
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'build/icon.ico')
  });

  mainWindow.loadFile(path.join(__dirname, 'public', 'index.html'));

  // Проверка обновлений после загрузки
  mainWindow.webContents.on('did-finish-load', () => {
    autoUpdater.checkForUpdates().catch(err => {
      log.error('Update check error:', err);
    });
  });

  // Отладка
  // mainWindow.webContents.openDevTools();
}

// Функция для уведомлений
function showUpdateStatus(text, percent = null) {
  mainWindow.webContents.send('update-status', {
    message: text,
    progress: percent
  });
}

// Обработчики обновлений
autoUpdater.on('update-available', (info) => {
  log.info('Update available:', info.version);
  showUpdateStatus(`Доступна новая версия: v${info.version}`);
  
  new Notification('Доступно обновление', {
    body: `Версия ${info.version} готова к загрузке`
  });
});

autoUpdater.on('download-progress', (progress) => {
  log.info(`Download progress: ${Math.floor(progress.percent)}%`);
  showUpdateStatus(`Загрузка обновления...`, Math.floor(progress.percent));
});

autoUpdater.on('update-downloaded', (info) => {
  log.info('Update downloaded:', info.version);
  showUpdateStatus(`Готово к установке!`);

  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Обновление готово',
    message: `Версия ${info.version} загружена. Установить сейчас?`,
    detail: 'Приложение будет перезапущено для завершения обновления',
    buttons: ['Перезапустить', 'Позже'],
    defaultId: 0,
    cancelId: 1
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

autoUpdater.on('error', (err) => {
  log.error('Update error:', err);
  showUpdateStatus(`Ошибка обновления: ${err.message}`);
});

// Инициализация приложения
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