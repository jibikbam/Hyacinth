const Database = require('better-sqlite3');

const DATABASE_PATH = 'data/db/hyacinth.db';
let dbConn;

function connect() {
    dbConn = new Database(DATABASE_PATH);
    console.log('Connected to ' + DATABASE_PATH);
}

function createTables() {
    const createTablesTransaction = dbConn.transaction(() => {
        dbConn.prepare(`
            CREATE TABLE IF NOT EXISTS datasets (id INT, name TEXT, path TEXT);
        `).run();
    });

    createTablesTransaction();
    console.log('Created tables');
}

exports.connect = connect;
exports.createTables = createTables;
