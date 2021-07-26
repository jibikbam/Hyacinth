type SessionType = 'Classification' | 'Comparison';
type Orientation = 'Sagittal';
type SamplingType = 'Random' | 'Sort';
type ElementType = 'Slice' | 'Comparison';

interface Dataset {
    id: number;
    datasetName: string;
    rootPath: string;
    imageCount?: number;
    sessionCount?: number;
}

interface DatasetImage {
    id: number;
    datasetId: number;
    relPath: string;
    datasetRootPath?: string;
}

interface LabelingSession {
    id: number;
    datasetId: number;
    sessionType: SessionType;
    sessionName: string;
    prompt: string;
    labelOptions: string;
    metadataJson: string;
}

interface SessionElement {
    id: number;
    sessionId: number;
    elementType: ElementType;
    elementIndex: number;
}

interface Slice extends SessionElement {
    imageId: number;
    sliceIndex: number
    orientation: Orientation;
    datasetRootPath: string;
    imageRelPath: string;
}

interface ElementLabel {
    id: number;
    elementId: number;
    labelValue: string;
    startTimestamp: number;
    finishTimestamp: number;
}

interface SliceAttributes {
    imageId: number;
    sliceIndex: number;
    orientation: Orientation;
}

interface DBApiType {
    connect: () => void;
    createTables: () => void;
    insertDataset: (datasetName: string, rootPath: string, imageRelPaths: string[]) => void;
    insertLabelingSession: (datasetId: number, sessionType: string, name: string,
                            prompt: string, labelOptions: string, metadataJson: string,
                            slices: SliceAttributes[]) => number;
    insertElementLabel: (elementId: number, labelValue: string,
                         startTimestamp: number, finishTimestamp: number) => void;
    selectAllDatasets: () => Dataset[];
    selectDataset: (datasetId: number) => Dataset;
    selectDatasetImages: (datasetId: number) => DatasetImage[];
    selectDatasetSessions: (datasetId: number) => LabelingSession[];
    selectLabelingSession: (sessionId: number) => LabelingSession;
    selectSessionSlices: (sessionId: number) => Slice[];
    selectElementLabels: (elementId: number) => ElementLabel[];
}

interface FileApiType {
    getDatasetImages: (datasetRootPath: string) => string[];
}

interface VolumeApiType {
    readNiftiHeader: (imagePath: string) => any;
    readNifti: (imagePath: string) => any;
}

const dbapi = (window as any).dbapi as DBApiType;
const fileapi = (window as any).fileapi as FileApiType;
const volumeapi = (window as any).volumeapi as VolumeApiType;

export {SessionType, Orientation, SamplingType, Dataset, DatasetImage, LabelingSession, SessionElement, Slice, ElementLabel, SliceAttributes, dbapi, fileapi, volumeapi};
