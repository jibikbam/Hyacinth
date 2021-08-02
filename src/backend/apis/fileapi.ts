import * as fs from 'fs';
import * as path from 'path';
import {ipcRenderer} from 'electron';

const IMAGE_FILE_EXT = '.nii.gz';

export function showFolderDialog() {
    return ipcRenderer.sendSync('show-dialog');
}

function isImage(imagePath) {
    return imagePath.endsWith(IMAGE_FILE_EXT);
}

function getImageFullPathsRecursive(dirPath): string[] {
    const imageFullPaths = [];
    for (const fileName of fs.readdirSync(dirPath)) {
        const filePath = dirPath + '/' + fileName;

        if (fs.statSync(filePath).isDirectory()) {
            for (const p of getImageFullPathsRecursive(filePath)) imageFullPaths.push(p);
        }
        else {
            if (isImage(filePath)) imageFullPaths.push(filePath);
        }
    }
    return imageFullPaths;
}

export function getDatasetImages(datasetRootPath: string) {
    if (!fs.existsSync(datasetRootPath) || !fs.statSync(datasetRootPath).isDirectory()) return null;
    const fullPaths = getImageFullPathsRecursive(datasetRootPath);
    return fullPaths.map(fp => fp.slice(datasetRootPath.length + 1));
}
