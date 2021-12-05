import * as fs from 'fs';
import * as path from 'path';
import {ipcRenderer} from 'electron';

const NIFTI_EXT = '.nii.gz';
const DICOM_EXT = '.dcm';

export function showFolderDialog() {
    return ipcRenderer.sendSync('show-open-directory-dialog');
}

export function showOpenJsonDialog() {
    return ipcRenderer.sendSync('show-open-json-dialog');
}

export function showSaveDialog(defaultName: string) {
    return ipcRenderer.sendSync('show-save-file-dialog', defaultName);
}

function isNiftiFile(filePath) {
    return filePath.endsWith(NIFTI_EXT);
}

function isDicomDir(filePath) {
    // Checks if filePath is a directory which contains only dicom slices
    // We assume this directory represents a dicom volume when the slices are combined
    const fileNames = fs.readdirSync(filePath);
    if (fileNames.length === 0) return false;
    for (const fileName of fileNames) {
        if (!fileName.endsWith(DICOM_EXT)) return false;
    }
    return true;
}

function getImageFullPathsRecursive(dirPath): string[] {
    const imageFullPaths = [];
    for (const fileName of fs.readdirSync(dirPath)) {
        const filePath = dirPath + '/' + fileName;

        if (fs.statSync(filePath).isDirectory()) {
            if (isDicomDir(filePath)) {
                imageFullPaths.push(filePath);
            }
            else {
                for (const p of getImageFullPathsRecursive(filePath)) imageFullPaths.push(p);
            }
        }
        else {
            if (isNiftiFile(filePath)) imageFullPaths.push(filePath);
        }
    }
    return imageFullPaths;
}

export function getDatasetImages(datasetRootPath: string) {
    if (!fs.existsSync(datasetRootPath) || !fs.statSync(datasetRootPath).isDirectory()) return null;
    const fullPaths = getImageFullPathsRecursive(datasetRootPath);
    return fullPaths.map(fp => fp.slice(datasetRootPath.length + 1));
}

export function readJsonFile(filePath: string): string {
    if (!filePath.endsWith('.json')) throw new Error('Not a JSON file.');
    return fs.readFileSync(filePath, 'utf8');
}

export function writeTextFile(savePath: string, contents: string) {
    if (typeof contents !== 'string') throw new Error('Text file contents must be a string.');
    fs.writeFileSync(savePath, contents);
    console.log(`Wrote text file at path ${savePath}`);
}
