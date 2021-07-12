import * as fs from 'fs';
import * as path from 'path';

const DATASETS_PATH = 'data/datasets'; //TODO: Allow any path
const IMAGE_FILE_EXT = '.nii.gz';

function getDatasetImages(datasetDirName) {
    const datasetPath = path.join(DATASETS_PATH, datasetDirName);

    if (!fs.existsSync(datasetPath)) return null;

    const datasetImagePaths = fs.readdirSync(datasetPath).filter(s => s.endsWith(IMAGE_FILE_EXT));
    return datasetImagePaths;
}

export {getDatasetImages};
