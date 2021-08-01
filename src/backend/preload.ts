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
    getDatasetImages: fileapi.getDatasetImages,
});

contextBridge.exposeInMainWorld('volumeapi', {
    readNiftiHeader: volumeapi.readNiftiHeader,
    readNifti: volumeapi.readNifti,
});
