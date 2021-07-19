interface Dataset {
    id: number;
    datasetName: string;
    rootPath: string;
    imageCount?: number;
}

interface DBApiType {
    connect: () => void;
    createTables: () => void;
    insertDataset: (datasetName: string, rootPath: string, imageRelPaths: string[]) => void;
    insertLabelingSession: (datasetId: number, sessionType: string, name: string,
                            prompt: string, labelOptions: string, metadataJson: string) => void;
    selectAllDatasets: () => Dataset[];
    selectDataset: (datasetId: number) => Dataset;
}

interface FileApiType {
    getDatasetImages: (datasetRootPath: string) => string[];
}

interface VolumeApiType {
    readNifti: (imagePath: string) => any;
}

const dbapi = (window as any).dbapi as DBApiType;
const fileapi = (window as any).fileapi as FileApiType;
const volumeapi = (window as any).volumeapi as VolumeApiType;

export {Dataset, dbapi, fileapi, volumeapi};
