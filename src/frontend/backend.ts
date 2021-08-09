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
    comparisonSampling: SamplingType;
    metadataJson: string;
}

interface SessionElement {
    id: number;
    sessionId: number;
    elementType: ElementType;
    elementIndex: number;
    elementLabel?: string;
}

interface Slice extends SessionElement {
    imageId: number;
    sliceIndex: number
    orientation: Orientation;
    datasetRootPath: string;
    imageRelPath: string;
}

interface Comparison extends SessionElement {
    imageId1: number;
    sliceIndex1: number
    orientation1: Orientation;
    imageId2: number;
    sliceIndex2: number
    orientation2: Orientation;
    datasetRootPath: string;
    imageRelPath1: string;
    imageRelPath2: string;
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
                            prompt: string, labelOptions: string, comparisonSampling: SamplingType | null, metadataJson: string,
                            slices: SliceAttributes[], comparisons: number[][] | null) => number;
    insertElementLabel: (elementId: number, labelValue: string,
                         startTimestamp: number, finishTimestamp: number) => void;
    insertComparison: (sessionId: number, elementIndex: number, slice1: Slice, slice2: Slice) => void;
    selectAllDatasets: () => Dataset[];
    selectDataset: (datasetId: number) => Dataset;
    selectDatasetImages: (datasetId: number) => DatasetImage[];
    selectDatasetSessions: (datasetId: number) => LabelingSession[];
    selectLabelingSession: (sessionId: number) => LabelingSession;
    selectSessionSlices: (sessionId: number) => Slice[];
    selectSessionComparisons: (sessionId: number) => Comparison[];
    selectElementLabels: (elementId: number) => ElementLabel[];
    selectSessionLatestComparisonLabels: (sessionId: number) => (string | null)[];
}

interface FileApiType {
    showFolderDialog: () => string[] | undefined;
    getDatasetImages: (datasetRootPath: string) => string[];
}

interface VolumeApiType {
    readNiftiHeader: (imagePath: string) => any;
    readNifti: (imagePath: string) => any;
}

const dbapi = (window as any).dbapi as DBApiType;
const fileapi = (window as any).fileapi as FileApiType;
const volumeapi = (window as any).volumeapi as VolumeApiType;

export {SessionType, Orientation, SamplingType, Dataset, DatasetImage, LabelingSession, SessionElement, Slice, Comparison, ElementLabel, SliceAttributes, dbapi, fileapi, volumeapi};
