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
        dbConn.prepare(`DROP TABLE IF EXISTS dataset_images;`).run();
        dbConn.prepare(`DROP TABLE IF EXISTS datasets;`).run();

        dbConn.prepare(`
            CREATE TABLE IF NOT EXISTS datasets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE,
                root_path TEXT
            );
        `).run();

        dbConn.prepare(`
            CREATE TABLE IF NOT EXISTS dataset_images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                dataset_id INTEGER,
                rel_path TEXT,
                FOREIGN KEY (dataset_id) REFERENCES datasets (id),
                UNIQUE (dataset_id, rel_path)
            );
        `).run();
    });

    createTablesTransaction();
    console.log('Created tables');
}

function insertDataset(datasetName, rootPath, imageRelPaths) {
    const insertDatasetTransaction = dbConn.transaction(() => {
        const datasetInsertInfo = dbConn.prepare(`
            INSERT INTO datasets (name, root_path) VALUES (:datasetName, :rootPath);
        `).run({datasetName, rootPath});

        const datasetId = datasetInsertInfo.lastInsertRowid;

        const insertImage = dbConn.prepare(`
            INSERT INTO dataset_images (dataset_id, rel_path) VALUES (:datasetId, :relPath);
        `);
        for (const relPath of imageRelPaths) insertImage.run({datasetId, relPath});
    });

    insertDatasetTransaction();
    console.log(`Inserted dataset ${datasetName}`);
}

function selectDatasets() {
    const datasetRows = dbConn.prepare(`
        SELECT datasets.id, datasets.name, datasets.root_path, count(di.id) AS image_count FROM datasets
            INNER JOIN dataset_images di on datasets.id = di.dataset_id
        GROUP BY datasets.id;
    `).all();
    console.log(JSON.stringify(datasetRows));
    return datasetRows;
}

export {connect, createTables, insertDataset, selectDatasets};
