const { app, BrowserWindow, Menu } = require('electron');
const { autoUpdater } = require("electron-updater");

// Включить логгирование (для отладки)
autoUpdater.logger = require("electron-log");
autoUpdater.logger.transports.file.level = "info";

// Проверять обновления при старте
app.whenReady().then(() => {
  autoUpdater.checkForUpdatesAndNotify();
});

// Обработчики событий
autoUpdater.on('update-available', () => {
  console.log('Обновление доступно!');
});

autoUpdater.on('download-progress', (progress) => {
  console.log(`Скачано: ${Math.floor(progress.percent)}%`);
});

autoUpdater.on('update-downloaded', () => {
  // Показываем диалоговое окно
  dialog.showMessageBox({
    type: 'info',
    title: 'Обновление готово',
    message: 'Перезапустите приложение для применения обновления.',
    buttons: ['Перезапустить', 'Позже']
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

const path = require('path');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 380,  // Минимальная ширина окна
        minHeight: 510, // Минимальная высота окна
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        autoHideMenuBar: true,
    });

    mainWindow.loadFile(path.join(__dirname, 'public', 'index.html'));

    // Раскомментируй, если нужно открыть DevTools
    // mainWindow.webContents.openDevTools();
}

Menu.setApplicationMenu(null);

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