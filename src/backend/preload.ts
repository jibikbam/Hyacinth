import {contextBridge} from 'electron';
import * as dbapi from './apis/dbapi';
import * as fileapi from './apis/fileapi';
import * as volumeapi from './apis/volumeapi';

contextBridge.exposeInMainWorld('dbapi', {
    connect: dbapi.connect,
    createTables: dbapi.createTables,
    insertDataset: dbapi.insertDataset,
    insertLabelingSession: dbapi.insertLabelingSession,
    insertElementLabel: dbapi.insertElementLabel,
    insertComparisonLabelActive: dbapi.insertComparisonLabelActive,
    deleteLabelingSession: dbapi.deleteLabelingSession,
    selectAllDatasets: dbapi.selectAllDatasets,
    isDatasetNameAvailable: dbapi.isDatasetNameAvailable,
    selectDataset: dbapi.selectDataset,
    selectDatasetImages: dbapi.selectDatasetImages,
    selectDatasetSessions: dbapi.selectDatasetSessions,
    isLabelingSessionNameAvailable: dbapi.isLabelingSessionNameAvailable,
    selectLabelingSession: dbapi.selectLabelingSession,
    selectSessionSlices: dbapi.selectSessionSlices,
    selectSessionComparisons: dbapi.selectSessionComparisons,
    selectElementLabels: dbapi.selectElementLabels,
    selectSessionLatestComparisonLabels: dbapi.selectSessionLatestComparisonLabels,
    runWithRollback: dbapi.runWithRollback,
});

contextBridge.exposeInMainWorld('fileapi', {
    getDatabaseFilePath: fileapi.getDatabaseFilePath,
    showFolderDialog: fileapi.showFolderDialog,
    showOpenJsonDialog: fileapi.showOpenJsonDialog,
    showSaveDialog: fileapi.showSaveDialog,
    getDatasetImages: fileapi.getDatasetImages,
    readJsonFile: fileapi.readJsonFile,
    writeTextFile: fileapi.writeTextFile,
    getThumbnailsDir: fileapi.getThumbnailsDir,
    thumbnailExists: fileapi.thumbnailExists,
    thumbnailsExist: fileapi.thumbnailsExist,
    writeThumbnail: fileapi.writeThumbnail,
});

contextBridge.exposeInMainWorld('volumeapi', {
    readImageFile: volumeapi.readImageFile,
    readNiftiHeader: volumeapi.readNiftiHeader,
    readNifti: volumeapi.readNifti,
    readDicomSeriesDims: volumeapi.readDicomSeriesDims,
    readDicomSeries: volumeapi.readDicomSeries,
    readDicom2d: volumeapi.readDicom2d,
});
