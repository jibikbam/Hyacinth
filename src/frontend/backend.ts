export type SessionType = 'Classification' | 'Comparison';
export type SamplingType = 'Random' | 'Sort';
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
    comparisonSampling: SamplingType;
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
    connect: () => void;
    createTables: () => void;
    insertDataset: (datasetName: string, rootPath: string, imageRelPaths: string[]) => void;
    insertLabelingSession: (datasetId: number | string, sessionType: string, name: string,
                            prompt: string, labelOptions: string, comparisonSampling: SamplingType | null, metadataJson: string,
                            slices: SliceAttributes[], comparisons: number[][] | null) => number;
    insertElementLabel: (elementId: number | string, labelValue: string,
                         startTimestamp: number, finishTimestamp: number) => void;
    insertComparison: (sessionId: number | string, elementIndex: number, slice1: Slice, slice2: Slice) => void;
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
}

export interface FileApiType {
    showFolderDialog: () => string[] | undefined;
    showOpenJsonDialog: () => string[] | undefined;
    showSaveDialog: (defaultName: string) => string | undefined;
    getDatasetImages: (datasetRootPath: string) => string[];
    readJsonFile: (filePath: string) => string;
    writeTextFile: (savePath: string, contents: string) => void;
}

export interface VolumeApiType {
    readNiftiHeader: (imagePath: string) => any;
    readNifti: (imagePath: string) => any;
    readDicomSeries: (seriesDirPath: string) => [[number, number, number], Float32Array];
}

export const dbapi = (window as any).dbapi as DBApiType;
export const fileapi = (window as any).fileapi as FileApiType;
export const volumeapi = (window as any).volumeapi as VolumeApiType;
