import {Dataset, dbapi} from '../frontend/backend';

let curUniqueNumber = 0;

function getUniqueNumber() {
    curUniqueNumber += 1;
    return curUniqueNumber;
}

export function datasetFixture(): Dataset {
    const num = getUniqueNumber();
    const imageRelPaths = [
        'img1.nii.gz',
        'img2.nii.gz',
        'img3.nii.gz',
        'img4.nii.gz',
    ];
    const datasetId = dbapi.insertDataset(`Dataset ${num}`, `~/test_dataset_${num}`, imageRelPaths);
    return dbapi.selectDataset(datasetId);
}
