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
    insertComparison: dbapi.insertComparison,
    deleteLabelingSession: dbapi.deleteLabelingSession,
    selectAllDatasets: dbapi.selectAllDatasets,
    selectDataset: dbapi.selectDataset,
    selectDatasetImages: dbapi.selectDatasetImages,
    selectDatasetSessions: dbapi.selectDatasetSessions,
    selectLabelingSession: dbapi.selectLabelingSession,
    selectSessionSlices: dbapi.selectSessionSlices,
    selectSessionComparisons: dbapi.selectSessionComparisons,
    selectElementLabels: dbapi.selectElementLabels,
    selectSessionLatestComparisonLabels: dbapi.selectSessionLatestComparisonLabels,
});

contextBridge.exposeInMainWorld('fileapi', {
    showFolderDialog: fileapi.showFolderDialog,
    showOpenJsonDialog: fileapi.showOpenJsonDialog,
    showSaveDialog: fileapi.showSaveDialog,
    getDatasetImages: fileapi.getDatasetImages,
    readJsonFile: fileapi.readJsonFile,
    writeTextFile: fileapi.writeTextFile,
});

contextBridge.exposeInMainWorld('volumeapi', {
    readNiftiHeader: volumeapi.readNiftiHeader,
    readNifti: volumeapi.readNifti,
    readDicomSeries: volumeapi.readDicomSeries,
});
