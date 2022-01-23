import {app, BrowserWindow, ipcMain, dialog} from 'electron';
import * as fs from 'fs';
import * as path from 'path';

function setUpAppData() {
    // Configure local appData/userData directories for ease of access
    // and to prevent development from affecting actual app files
    if (process.env.HYACINTH_DEV === 'true') {
        const devAppPath = path.join(app.getAppPath(), 'dev_app_data');
        if (!fs.existsSync(devAppPath)) fs.mkdirSync(devAppPath);

        const devUserPath = path.join(devAppPath, app.getName());
        if (!fs.existsSync(devUserPath)) fs.mkdirSync(devUserPath);

        app.setPath('appData', devAppPath);
        app.setPath('userData', devUserPath);

        console.log('DEV appData path: ', app.getPath('appData'));
        console.log('DEV userData path: ', app.getPath('userData'));
    }
}
// This must happen BEFORE app ready event
setUpAppData();

function createWindow() {
    const win = new BrowserWindow({
        width: 1600,
        height: 1000,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    win.loadFile('index.html');
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

ipcMain.on('get-user-data-dir', (event, arg) => {
    event.returnValue = app.getPath('userData');
});

ipcMain.on('show-open-directory-dialog', (event, arg) => {
    event.returnValue = dialog.showOpenDialogSync(BrowserWindow.getFocusedWindow(), {
        properties: ['openDirectory'],
    });
});

ipcMain.on('show-open-json-dialog', (event, arg) => {
    event.returnValue = dialog.showOpenDialogSync(BrowserWindow.getFocusedWindow(), {
        filters: [{name: 'JSON', extensions: ['json']}],
        properties: ['openFile'],
    });
});

ipcMain.on('show-save-file-dialog', (event, defaultName) => {
    event.returnValue = dialog.showSaveDialogSync(BrowserWindow.getFocusedWindow(), {
        defaultPath: defaultName,
        properties: ['createDirectory', 'showOverwriteConfirmation'],
    });
});
