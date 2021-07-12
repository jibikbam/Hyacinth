import * as fs from 'fs';
import * as path from 'path';

const DATASETS_PATH = 'data/datasets'; //TODO: Allow any path
const IMAGE_FILE_EXT = '.nii.gz';

function getDatasetImages(datasetRootPath) {
    if (!fs.existsSync(datasetRootPath)) return null;
    return fs.readdirSync(datasetRootPath).filter(s => s.endsWith(IMAGE_FILE_EXT));
}

export {getDatasetImages};
