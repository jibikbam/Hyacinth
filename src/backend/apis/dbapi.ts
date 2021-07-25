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
        // dbConn.prepare(`DROP TABLE IF EXISTS session_elements;`).run();
        // dbConn.prepare(`DROP TABLE IF EXISTS labeling_sessions;`).run();
        // dbConn.prepare(`DROP TABLE IF EXISTS dataset_images;`).run();
        // dbConn.prepare(`DROP TABLE IF EXISTS datasets;`).run();

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
                prompt TEXT NOT NULL,
                labelOptions TEXT NOT NULL,
                metadataJson TEXT NOT NULL,
                FOREIGN KEY (datasetId) REFERENCES datasets (id)
            )
        `).run();

        dbConn.prepare(`
            CREATE TABLE IF NOT EXISTS session_elements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sessionId INTEGER NOT NULL,
                elementType TEXT NOT NULL,
                elementIndex INTEGER NOT NULL,
                imageId1 INTEGER NOT NULL,
                sliceIndex1 INTEGER NOT NULL,
                orientation1 TEXT NOT NULL,
                imageId2 INTEGER,
                sliceIndex2 INTEGER,
                orientation2 TEXT,
                FOREIGN KEY (sessionId) REFERENCES labeling_sessions (id),
                FOREIGN KEY (imageId1) REFERENCES dataset_images (id),
                FOREIGN KEY (imageId2) REFERENCES dataset_images (id)
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
                               prompt: string, labelOptions: string, metadataJson: string,
                               slices: any) {
    const insertTransaction = dbConn.transaction(() => {
        const sessionInsertInfo = dbConn.prepare(`
            INSERT INTO labeling_sessions (datasetId, sessionType, sessionName, prompt, labelOptions, metadataJson)
                VALUES (:datasetId, :sessionType, :name, :prompt, :labelOptions, :metadataJson);
        `).run({datasetId, sessionType, name, prompt, labelOptions, metadataJson});

        const sessionId = sessionInsertInfo.lastInsertRowid;

        if (sessionType === 'Classification') {
            const insertSlice = dbConn.prepare(`
                INSERT INTO session_elements (sessionId, elementType, elementIndex, imageId1, sliceIndex1, orientation1, imageId2, sliceIndex2, orientation2)
                    VALUES (:sessionId, :elementType, :elementIndex, :imageId, :sliceIndex, :orientation, null, null, null);
            `);

            for (const [i, slice] of slices.entries()) {
                insertSlice.run({
                    sessionId: sessionId,
                    elementType: 'slice',
                    elementIndex: i,
                    imageId: slice.imageId,
                    sliceIndex: slice.sliceIndex,
                    orientation: slice.orientation,
                });
            }
        }
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

function selectDatasetImages(datasetId: number) {
    const imageRows = dbConn.prepare(`
        SELECT di.id, di.datasetId, di.relPath, d.rootPath as datasetRootPath FROM dataset_images di
        INNER JOIN datasets d on di.datasetId = d.id
        WHERE di.datasetId = :datasetId;
    `).all({datasetId});
    console.log(`Selected ${imageRows.length} images for dataset ${datasetId}`);
    console.log(JSON.stringify(imageRows));
    return imageRows;
}

function selectDatasetSessions(datasetId: number) {
    const sessionRows = dbConn.prepare(`
        SELECT id, datasetId, sessionType, sessionName, prompt, labelOptions, metadataJson FROM labeling_sessions;
    `).all({datasetId});
    console.log(`Selected ${sessionRows.length} sessions for dataset ${datasetId}`);
    console.log(JSON.stringify(sessionRows));
    return sessionRows;
}

function selectLabelingSession(sessionId: number) {
    const sessionRow = dbConn.prepare(`
        SELECT id, datasetId, sessionType, sessionName, prompt, labelOptions, metadataJson FROM labeling_sessions
        WHERE id = :sessionId;
    `).get({sessionId});
    console.log(`Selected session: ${JSON.stringify(sessionRow)}`);
    return sessionRow;
}

function selectSessionSlices(sessionId: number) {
    const sliceRows = dbConn.prepare(`
        SELECT se.id, se.sessionId, se.elementIndex, se.imageId1 as imageId, se.sliceIndex1 as sliceIndex, se.orientation1 as orientation,
               d.rootPath as datasetRootPath, di.relPath as imageRelPath
        FROM session_elements se
        INNER JOIN dataset_images di on se.imageId1 = di.id
        INNER JOIN datasets d on di.datasetId = d.id
        WHERE se.sessionId = :sessionId AND se.elementType = 'slice';
    `).all({sessionId});
    console.log(`Selected ${sliceRows.length} slices for session ${sessionId}`);
    console.log(JSON.stringify(sliceRows));
    return sliceRows;
}

export {connect, createTables, insertDataset, insertLabelingSession, selectAllDatasets, selectDataset, selectDatasetImages, selectDatasetSessions, selectLabelingSession, selectSessionSlices};
