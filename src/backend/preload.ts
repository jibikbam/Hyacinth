import {contextBridge} from 'electron';
const dbapi = require('./dbapi');
const fileapi = require('./fileapi');
const volumeapi = require('./volumeapi');

contextBridge.exposeInMainWorld('dbapi', {
    connect: dbapi.connect,
    createTables: dbapi.createTables,
    insertDataset: dbapi.insertDataset,
});

contextBridge.exposeInMainWorld('fileapi', {
    getDatasetImages: fileapi.getDatasetImages,
});

contextBridge.exposeInMainWorld('volumeapi', {
    readNifti: volumeapi.readNifti,
});
