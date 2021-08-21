import * as Database from 'better-sqlite3';

const DATABASE_PATH = 'data/db/hyacinth.db';
let dbConn;

export function connect() {
    dbConn = new Database(DATABASE_PATH);
    dbConn.pragma('foreign_keys = ON;');
    console.log('Connected to ' + DATABASE_PATH);
}

export function createTables() {
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
                comparisonSampling TEXT,
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

        dbConn.prepare(`
            CREATE TABLE IF NOT EXISTS element_labels (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                elementId INTEGER NOT NULL,
                labelValue TEXT NOT NULL,
                startTimestamp INTEGER NOT NULL,
                finishTimestamp INTEGER NOT NULL,
                FOREIGN KEY (elementId) REFERENCES session_elements (id)
            )
        `).run();
    });

    createTablesTransaction();
    console.log('Created tables');
}

export function insertDataset(datasetName, rootPath, imageRelPaths) {
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

export function insertLabelingSession(datasetId: number, sessionType: string, name: string,
                               prompt: string, labelOptions: string, comparisonSampling: string | null, metadataJson: string,
                               slices: any, comparisons: any) {
    labelOptions = labelOptions.split(',').map(s => s.trim()).join(',');
    if (sessionType !== 'Comparison') comparisonSampling = null;

    let insertedSessionId;
    const insertTransaction = dbConn.transaction(() => {
        const sessionInsertInfo = dbConn.prepare(`
            INSERT INTO labeling_sessions (datasetId, sessionType, sessionName, prompt, labelOptions, comparisonSampling, metadataJson)
                VALUES (:datasetId, :sessionType, :name, :prompt, :labelOptions, :comparisonSampling, :metadataJson);
        `).run({datasetId, sessionType, name, prompt, labelOptions, comparisonSampling, metadataJson});

        const sessionId = sessionInsertInfo.lastInsertRowid;
        insertedSessionId = sessionId;

        const insertElement = dbConn.prepare(`
            INSERT INTO session_elements (sessionId, elementType, elementIndex, imageId1, sliceIndex1, orientation1, imageId2, sliceIndex2, orientation2)
                VALUES (:sessionId, :elementType, :elementIndex, :imageId1, :sliceIndex1, :orientation1, :imageId2, :sliceIndex2, :orientation2);
        `);

        for (const [i, slice] of slices.entries()) {
            insertElement.run({
                sessionId: sessionId,
                elementType: 'Slice',
                elementIndex: i,
                imageId1: slice.imageId,
                sliceIndex1: slice.sliceIndex,
                orientation1: slice.orientation,
                imageId2: null,
                sliceIndex2: null,
                orientation2: null,
            });
        }

        if (comparisons) {
            for (const [i, c] of comparisons.entries()) {
                const sl1 = slices[c[0]];
                const sl2 = slices[c[1]];

                insertElement.run({
                    sessionId: sessionId,
                    elementType: 'Comparison',
                    elementIndex: i,
                    imageId1: sl1.imageId,
                    sliceIndex1: sl1.sliceIndex,
                    orientation1: sl1.orientation,
                    imageId2: sl2.imageId,
                    sliceIndex2: sl2.sliceIndex,
                    orientation2: sl2.orientation,
                });
            }
        }
    });

    insertTransaction();
    console.log(`Inserted labeling session ${name}`);
    return insertedSessionId;
}

export function insertElementLabel(elementId: number, labelValue: string, startTimestamp: number, finishTimestamp: number) {
    const insertTransaction = dbConn.transaction(() => {
        dbConn.prepare(`
            INSERT INTO element_labels (elementId, labelValue, startTimestamp, finishTimestamp)
                VALUES (:elementId, :labelValue, :startTimestamp, :finishTimestamp);
        `).run({elementId, labelValue, startTimestamp, finishTimestamp});
    });

    insertTransaction();
    console.log(`Inserted label "${labelValue}" for element ${elementId}`);
}

export function insertComparison(sessionId: number, elementIndex: number, slice1, slice2) {
    const insertTransaction = dbConn.transaction(() => {
        const insertStatement = dbConn.prepare(`
            INSERT INTO session_elements (sessionId, elementType, elementIndex, imageId1, sliceIndex1, orientation1, imageId2, sliceIndex2, orientation2)
                VALUES (:sessionId, :elementType, :elementIndex, :imageId1, :sliceIndex1, :orientation1, :imageId2, :sliceIndex2, :orientation2);
        `);

        insertStatement.run({
            sessionId: sessionId,
            elementIndex: elementIndex,
            elementType: 'Comparison',
            imageId1: slice1.imageId,
            sliceIndex1: slice1.sliceIndex,
            orientation1: slice1.orientation,
            imageId2: slice2.imageId,
            sliceIndex2: slice2.sliceIndex,
            orientation2: slice2.orientation,
        });
    });

    insertTransaction();
    console.log(`Inserted additional comparison for session ${sessionId}`);
}

export function selectAllDatasets() {
    const datasetRows = dbConn.prepare(`
        SELECT d.id, d.datasetName, d.rootPath, count(DISTINCT di.id) AS imageCount, count(DISTINCT ls.id) AS sessionCount
        FROM datasets d
            LEFT JOIN dataset_images di on d.id = di.datasetId
            LEFT JOIN labeling_sessions ls on d.id = ls.datasetId
        GROUP BY d.id;
    `).all();
    console.log(`Selected ${datasetRows.length} datasets`);
    return datasetRows;
}

export function selectDataset(datasetId: number) {
    const datasetRow = dbConn.prepare(`
        SELECT d.id, d.datasetName, d.rootPath, count(di.id) AS imageCount
        FROM datasets d
        INNER JOIN dataset_images di on d.id = di.datasetId
        WHERE d.id = :datasetId;
    `).get({datasetId});
    console.log(`Selected dataset ${datasetRow.id} ${datasetRow.datasetName}`);
    return datasetRow;
}

export function selectDatasetImages(datasetId: number) {
    const imageRows = dbConn.prepare(`
        SELECT di.id, di.datasetId, di.relPath, d.rootPath as datasetRootPath FROM dataset_images di
        INNER JOIN datasets d on di.datasetId = d.id
        WHERE di.datasetId = :datasetId;
    `).all({datasetId});
    console.log(`Selected ${imageRows.length} images for dataset ${datasetId}`);
    return imageRows;
}

export function selectDatasetSessions(datasetId: number) {
    const sessionRows = dbConn.prepare(`
        SELECT id, datasetId, sessionType, sessionName, prompt, labelOptions, comparisonSampling, metadataJson
        FROM labeling_sessions
        WHERE datasetId = :datasetId;
    `).all({datasetId});
    console.log(`Selected ${sessionRows.length} sessions for dataset ${datasetId}`);
    return sessionRows;
}

export function selectLabelingSession(sessionId: number) {
    const sessionRow = dbConn.prepare(`
        SELECT id, datasetId, sessionType, sessionName, prompt, labelOptions, comparisonSampling, metadataJson FROM labeling_sessions
        WHERE id = :sessionId;
    `).get({sessionId});
    console.log(`Selected session ${sessionRow.id} ${sessionRow.sessionName}`);
    return sessionRow;
}

export function selectSessionSlices(sessionId: number) {
    const sliceRows = dbConn.prepare(`
        SELECT se.id, se.sessionId, se.elementType, se.elementIndex, se.imageId1 as imageId, se.sliceIndex1 as sliceIndex, se.orientation1 as orientation,
               d.rootPath as datasetRootPath, di.relPath as imageRelPath,
               (SELECT el.labelValue FROM element_labels el WHERE el.elementId = se.id ORDER BY el.finishTimestamp DESC LIMIT 1) AS elementLabel
        FROM session_elements se
        INNER JOIN dataset_images di on se.imageId1 = di.id
        INNER JOIN datasets d on di.datasetId = d.id
        WHERE se.sessionId = :sessionId AND se.elementType = 'Slice'
        ORDER BY se.elementIndex;
    `).all({sessionId});
    console.log(`Selected ${sliceRows.length} slices for session ${sessionId}`);
    return sliceRows;
}

export function selectSessionComparisons(sessionId: number) {
    const comparisonRows = dbConn.prepare(`
        SELECT se.id, se.sessionId, se.elementType, se.elementIndex, se.imageId1, se.sliceIndex1, se.orientation1, se.imageId2, se.sliceIndex2, se.orientation2,
               d.rootPath AS datasetRootPath, di1.relPath AS imageRelPath1, di2.relPath AS imageRelPath2,
               (SELECT el.labelValue FROM element_labels el WHERE el.elementId = se.id ORDER BY el.finishTimestamp DESC LIMIT 1) AS elementLabel
        FROM session_elements se
            INNER JOIN dataset_images di1 on se.imageId1 = di1.id
            INNER JOIN dataset_images di2 on se.imageId2 = di2.id
            INNER JOIN datasets d on di1.datasetId = d.id
        WHERE se.sessionId = :sessionId AND se.elementType = 'Comparison'
        ORDER BY se.elementIndex;
    `).all({sessionId});
    console.log(`Selected ${comparisonRows.length} comparisons for session ${sessionId}`);
    return comparisonRows;
}

export function selectElementLabels(elementId: number) {
    const labelRows = dbConn.prepare(`
        SELECT id, elementId, labelValue, startTimestamp, finishTimestamp
        FROM element_labels
        WHERE elementId = :elementId
        ORDER BY finishTimestamp DESC;
    `).all({elementId});
    console.log(`Selected ${labelRows.length} labels for element ${elementId}`);
    return labelRows;
}

export function selectSessionLatestComparisonLabels(sessionId: number) {
    const labelRows = dbConn.prepare(`
        SELECT (SELECT el.labelValue FROM element_labels el WHERE el.elementId = se.id ORDER BY el.finishTimestamp DESC LIMIT 1) AS elementLabel
        FROM session_elements se
        WHERE se.sessionId = :sessionId AND se.elementType = 'Comparison'
        ORDER BY se.id;
    `).all({sessionId});
    console.log(`Selected ${labelRows.length} latest comparison labels for session ${sessionId}`);
    return labelRows.map(r => r.elementLabel);
}
