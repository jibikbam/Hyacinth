const {contextBridge} = require('electron');
const dbapi = require('./dbapi');

contextBridge.exposeInMainWorld('dbapi', {
    connect: dbapi.connect,
    createTables: dbapi.createTables
});
