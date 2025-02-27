const { app, BrowserWindow, Menu } = require('electron');
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