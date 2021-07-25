type SessionType = 'Classification' | 'Comparison';
type Orientation = 'Sagittal';
type SamplingType = 'Random' | 'Sort';

interface Dataset {
    id: number;
    datasetName: string;
    rootPath: string;
    imageCount?: number;
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

interface Slice {
    id: number;
    sessionId: number;
    elementIndex: number;
    imageId: number;
    sliceIndex: number
    orientation: Orientation;
    datasetRootPath: string;
    imageRelPath: string;
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
                            slices: SliceAttributes[]) => void;
    selectAllDatasets: () => Dataset[];
    selectDataset: (datasetId: number) => Dataset;
    selectDatasetImages: (datasetId: number) => DatasetImage[];
    selectDatasetSessions: (datasetId: number) => LabelingSession[];
    selectLabelingSession: (sessionId: number) => LabelingSession;
    selectSessionSlices: (sessionId: number) => Slice[];
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

export {SessionType, Orientation, SamplingType, Dataset, DatasetImage, LabelingSession, Slice, SliceAttributes, dbapi, fileapi, volumeapi};
