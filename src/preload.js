const {contextBridge} = require('electron');
const dbapi = require('./dbapi');
const fileapi = require('./fileapi');

contextBridge.exposeInMainWorld('dbapi', {
    connect: dbapi.connect,
    createTables: dbapi.createTables
});

contextBridge.exposeInMainWorld('fileapi', {
    getDatasetImages: fileapi.getDatasetImages,
});
