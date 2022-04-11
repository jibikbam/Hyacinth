import {Dataset, dbapi, LabelingSession, SessionType} from '../frontend/backend';
import {SliceSampleOpts} from '../frontend/sampling';
import * as Session from '../frontend/sessions/session';

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

export function sliceOptsFixture(): SliceSampleOpts {
    return {
        imageCount: 4,
        sliceCount: 10,
        sliceDim: 0,
        sliceMinPct: 20,
        sliceMaxPct: 80,
    };
}

export function sessionFixture(sessionType: SessionType): LabelingSession {
    const sessClass = Session.getSessionClass(sessionType);
    const dataset = datasetFixture();
    const sessionId = sessClass.createSession(dataset.id, `Session ${getUniqueNumber()}`, 'Test prompt!',
        'Label 1,Label2', 'Create New', sliceOptsFixture(), 12);
    return dbapi.selectLabelingSession(sessionId);
}
