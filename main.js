const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

// Функция для создания окна приложения
function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        // Убираем меню
        autoHideMenuBar: true,
    });

    // Загружаем index.html напрямую
    mainWindow.loadFile(path.join(__dirname, 'public', 'index.html'));

    // Убираем DevTools (инструменты разработчика)
    // mainWindow.webContents.openDevTools(); // Закомментируйте эту строку
}

// Убираем стандартное меню
Menu.setApplicationMenu(null);

// Когда приложение готово, создаем окно
app.whenReady().then(() => {
    createWindow();

    // Для macOS: если окно закрыто, но приложение ещё работает, создаем новое окно
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Закрываем приложение, если все окна закрыты (кроме macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});