import * as assert from 'assert';
import {dbapi} from '../../frontend/backend';
import {SliceSampleOpts} from '../../frontend/sampling';
import * as Session from '../../frontend/sessions/session';

import * as Fixtures from '../fixtures';

const SLICE_OPTS: SliceSampleOpts = {
    imageCount: 4,
    sliceCount: 10,
    sliceDim: 0,
    sliceMinPct: 20,
    sliceMaxPct: 80,
};

export function testClassificationSessionCreation() {
    const dataset = Fixtures.datasetFixture();
    const sessClass = Session.getSessionClass('Classification');
    const sessionId = sessClass.createSession(dataset.id, 'Test session', 'Test prompt!', 'Label 1,Label2',
        'Create New', SLICE_OPTS, 0);

    const session = dbapi.selectLabelingSession(sessionId);

    assert.equal(session.id, 1);
    assert.equal(session.datasetId, dataset.id);
    assert.equal(session.sessionType, 'Classification');
    assert.equal(session.sessionName, 'Test session');
    assert.equal(session.prompt, 'Test prompt!');
    assert.equal(session.labelOptions, 'Label 1,Label2');
    assert.equal(
        session.metadataJson,
        '{"Slices From":"Create New","Image Count":4,"Slice Count":10,"Slice Dim":0,"Slice Min Pct":20,"Slice Max Pct":80}'
    );
}

export function testComparisonRandomSessionCreation() {
}

export function testComparisonActiveSortSessionCreation() {
}
