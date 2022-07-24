export type SessionCategory = 'Classification' | 'Comparison';
export type SessionType = 'Classification' | 'ComparisonRandom' | 'ComparisonActiveSort';
export type ElementType = 'Slice' | 'Comparison';

export interface Dataset {
    id: number;
    datasetName: string;
    rootPath: string;
    imageCount?: number;
    sessionCount?: number;
}

export interface DatasetImage {
    id: number;
    datasetId: number;
    relPath: string;
    datasetRootPath?: string;
}

export interface LabelingSession {
    id: number;
    datasetId: number;
    sessionType: SessionType;
    sessionName: string;
    prompt: string;
    labelOptions: string;
    metadataJson: string;
}

export interface SessionElement {
    id: number;
    sessionId: number;
    elementType: ElementType;
    elementIndex: number;
    elementLabel?: string;
}

export interface Slice extends SessionElement {
    imageId: number;
    sliceDim: number;
    sliceIndex: number;
    datasetRootPath: string;
    imageRelPath: string;
}

export interface Comparison extends SessionElement {
    imageId1: number;
    sliceDim1: number;
    sliceIndex1: number;
    imageId2: number;
    sliceDim2: number;
    sliceIndex2: number
    datasetRootPath: string;
    imageRelPath1: string;
    imageRelPath2: string;
}

export interface ElementLabel {
    id: number;
    elementId: number;
    labelValue: string;
    startTimestamp: number;
    finishTimestamp: number;
}

export interface SliceAttributes {
    imageId: number;
    sliceDim: number;
    sliceIndex: number;
}

export interface DBApiType {
    connect: (dbPath: string) => void;
    createTables: () => void;
    insertDataset: (datasetName: string, rootPath: string, imageRelPaths: string[]) => number;
    insertLabelingSession: (datasetId: number | string, sessionType: SessionType, name: string,
                            prompt: string, labelOptions: string, metadataJson: string,
                            slices: SliceAttributes[], comparisons: number[][] | null) => number;
    insertElementLabel: (elementId: number | string, labelValue: string,
                         startTimestamp: number, finishTimestamp: number) => void;
    insertComparisonLabelActive: (elementId: number | string, labelValue: string,
                                  startTimestamp: number, finishTimestamp: number,
                                  newComparison: [Slice, Slice] | null) => void;
    deleteLabelingSession: (sessionId: number | string) => void;
    selectAllDatasets: () => Dataset[];
    isDatasetNameAvailable: (datasetName: string) => boolean;
    selectDataset: (datasetId: number | string) => Dataset;
    selectDatasetImages: (datasetId: number | string) => DatasetImage[];
    selectDatasetSessions: (datasetId: number | string) => LabelingSession[];
    isLabelingSessionNameAvailable: (datasetId: number | string, sessionName: string) => boolean;
    selectLabelingSession: (sessionId: number | string) => LabelingSession;
    selectSessionSlices: (sessionId: number | string) => Slice[];
    selectSessionComparisons: (sessionId: number | string) => Comparison[];
    selectElementLabels: (elementId: number | string) => ElementLabel[];
    selectSessionLatestComparisonLabels: (sessionId: number | string) => (string | null)[];
    runWithRollback: (func: Function) => void;
}

export interface FileApiType {
    getDatabaseFilePath: () => string;
    showFolderDialog: () => string[] | undefined;
    showOpenJsonDialog: () => string[] | undefined;
    showSaveDialog: (defaultName: string) => string | undefined;
    getDatasetImages: (datasetRootPath: string, dicomAsSeries: boolean) => string[];
    readJsonFile: (filePath: string) => string;
    writeTextFile: (savePath: string, contents: string) => void;
    getThumbnailsDir: () => string;
    thumbnailExists: (thumbnailName: string) => boolean;
    thumbnailsExist: (thumbnailNames: string[]) => boolean[];
    writeThumbnail: (canvas: HTMLCanvasElement, thumbnailName: string) => void;
}

export interface VolumeApiType {
    readImageFile: (imagePath: string) => ArrayBufferLike;
    readNiftiFileHeaderBytes: (imagePath: string) => ArrayBufferLike;
    readDicomSeriesDims: (seriesDirPath: string) => [[number, number, number], [number, number, number, number, number, number]];
    readDicomSeries: (seriesDirPath: string) => [[number, number, number], [number, number, number, number, number, number], Float32Array];
    readDicom2d: (imagePath: string) => [[number, number], Float32Array];
}

export let dbapi: DBApiType;
export let fileapi: FileApiType;
export let volumeapi: VolumeApiType;

export function setupRenderer() {
    dbapi = (window as any).dbapi as DBApiType;
    fileapi = (window as any).fileapi as FileApiType;
    volumeapi = (window as any).volumeapi as VolumeApiType;
}

export function setupTestInject(_dbapi: DBApiType, _fileapi: FileApiType, _volumeapi: VolumeApiType) {
    dbapi = _dbapi;
    fileapi = _fileapi;
    volumeapi = _volumeapi;
}
