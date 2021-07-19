import * as Database from 'better-sqlite3';

const DATABASE_PATH = 'data/db/hyacinth.db';
let dbConn;

function connect() {
    dbConn = new Database(DATABASE_PATH);
    dbConn.pragma('foreign_keys = ON;');
    console.log('Connected to ' + DATABASE_PATH);
}

function createTables() {
    const createTablesTransaction = dbConn.transaction(() => {
        // For development
        dbConn.prepare(`DROP TABLE IF EXISTS labeling_sessions;`)
        dbConn.prepare(`DROP TABLE IF EXISTS dataset_images;`).run();
        dbConn.prepare(`DROP TABLE IF EXISTS datasets;`).run();

        dbConn.prepare(`
            CREATE TABLE IF NOT EXISTS datasets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                datasetName TEXT UNIQUE,
                rootPath TEXT
            );
        `).run();

        dbConn.prepare(`
            CREATE TABLE IF NOT EXISTS dataset_images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                datasetId INTEGER,
                relPath TEXT,
                FOREIGN KEY (datasetId) REFERENCES datasets (id),
                UNIQUE (datasetId, relPath)
            );
        `).run();

        dbConn.prepare(`
            CREATE TABLE IF NOT EXISTS labeling_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                datasetId INTEGER NOT NULL,
                sessionType TEXT NOT NULL,
                sessionName TEXT UNIQUE NOT NULL,
                prompt TEXT UNIQUE NOT NULL,
                labelOptions TEXT UNIQUE NOT NULL,
                metadataJson TEXT UNIQUE NOT NULL,
                FOREIGN KEY (datasetId) REFERENCES datasets (id)
            )
        `).run();
    });

    createTablesTransaction();
    console.log('Created tables');
}

function insertDataset(datasetName, rootPath, imageRelPaths) {
    const insertDatasetTransaction = dbConn.transaction(() => {
        const datasetInsertInfo = dbConn.prepare(`
            INSERT INTO datasets (datasetName, rootPath) VALUES (:datasetName, :rootPath);
        `).run({datasetName, rootPath});

        const datasetId = datasetInsertInfo.lastInsertRowid;

        const insertImage = dbConn.prepare(`
            INSERT INTO dataset_images (datasetId, relPath) VALUES (:datasetId, :relPath);
        `);
        for (const relPath of imageRelPaths) insertImage.run({datasetId, relPath});
    });

    insertDatasetTransaction();
    console.log(`Inserted dataset ${datasetName}`);
}

function insertLabelingSession(datasetId: number, sessionType: string, name: string,
                               prompt: string, labelOptions: string, metadataJson: string) {
    const insertTransaction = dbConn.transaction(() => {
        const sessionInsertInfo = dbConn.prepare(`
            INSERT INTO labeling_sessions (datasetId, sessionType, sessionName, prompt, labelOptions, metadataJson)
                VALUES (:datasetId, :sessionType, :name, :prompt, :labelOptions, :metadataJson);
        `).run({datasetId, sessionType, name, prompt, labelOptions, metadataJson});

        const sessionId = sessionInsertInfo.lastInsertRowId;
    });

    insertTransaction();
    console.log(`Inserted labeling session ${name}`);
}

function selectAllDatasets() {
    const datasetRows = dbConn.prepare(`
        SELECT datasets.id, datasets.datasetName, datasets.rootPath, count(di.id) AS imageCount FROM datasets
            INNER JOIN dataset_images di on datasets.id = di.datasetId
        GROUP BY datasets.id;
    `).all();
    console.log(JSON.stringify(datasetRows));
    return datasetRows;
}

function selectDataset(datasetId: number) {
    const datasetRow = dbConn.prepare(`
        SELECT id, datasetName, rootPath FROM datasets
        WHERE id = :datasetId;
    `).get({datasetId});
    console.log(JSON.stringify(datasetRow));
    return datasetRow;
}

export {connect, createTables, insertDataset, insertLabelingSession, selectAllDatasets, selectDataset};
