import {dbapi} from '../../frontend/backend';
import {SliceSampleOpts} from '../../frontend/sampling';
import * as Session from '../../frontend/sessions/session';

import * as assert from 'assert';
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
    const sessClass = Session.getClass('Classification');
    const sessionId = sessClass.createSession(dataset.id, 'Test session', 'Test prompt!', 'Label 1,Label2',
        null, SLICE_OPTS, 0);

    const session = dbapi.selectLabelingSession(sessionId);

    assert.deepStrictEqual(
        session,
        {
            id: 1,
            datasetId: dataset.id,
            sessionType: 'Classification',
            sessionName: 'Test session',
            prompt: 'Test prompt!',
            labelOptions: 'Label 1,Label2',
            metadataJson: '{"Slices From":"Create New","Image Count":4,"Slice Count":10,"Slice Dim":0,"Slice Min Pct":20,"Slice Max Pct":80}',
        }
    );

    const slices = dbapi.selectSessionSlices(session.id);

    assert.deepStrictEqual(slices.map(s => s.elementIndex), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const slice of slices) {
        assert.strictEqual(slice.sessionId, session.id);
        assert.strictEqual(slice.elementType, 'Slice');
        assert.strictEqual(slice.sliceDim, 0);
        assert.strictEqual(slice.datasetRootPath, dataset.rootPath);
    }

    const comparisons = dbapi.selectSessionComparisons(session.id);
    assert.strictEqual(comparisons.length, 0);
}

export function testComparisonRandomSessionCreation() {
    const dataset = Fixtures.datasetFixture();
    const sessClass = Session.getClass('ComparisonRandom');
    const sessionId = sessClass.createSession(dataset.id, 'Test session', 'Test prompt!', 'Label 1,Label2',
        null, SLICE_OPTS, 12);

    const session = dbapi.selectLabelingSession(sessionId);

    assert.deepStrictEqual(
        session,
        {
            id: 1,
            datasetId: dataset.id,
            sessionType: 'ComparisonRandom',
            sessionName: 'Test session',
            prompt: 'Test prompt!',
            labelOptions: 'Label 1,Label2',
            metadataJson: '{"Slices From":"Create New","Image Count":4,"Slice Count":10,"Slice Dim":0,"Slice Min Pct":20,"Slice Max Pct":80,"Comparison Count":12}',
        }
    );

    const slices = dbapi.selectSessionSlices(session.id);

    assert.deepStrictEqual(slices.map(s => s.elementIndex), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const slice of slices) {
        assert.strictEqual(slice.sessionId, session.id);
        assert.strictEqual(slice.elementType, 'Slice');
        assert.strictEqual(slice.sliceDim, 0);
        assert.strictEqual(slice.datasetRootPath, dataset.rootPath);
    }

    const comparisons = dbapi.selectSessionComparisons(session.id);

    assert.deepStrictEqual(comparisons.map(c => c.elementIndex), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    for (const comparison of comparisons) {
        assert.strictEqual(comparison.sessionId, session.id);
        assert.strictEqual(comparison.elementType, 'Comparison');
        assert.strictEqual(comparison.sliceDim1, 0);
        assert.strictEqual(comparison.sliceDim2, 0);
        assert.strictEqual(comparison.datasetRootPath, dataset.rootPath);
    }
}

export function testComparisonActiveSortSessionCreation() {
    const dataset = Fixtures.datasetFixture();
    const sessClass = Session.getClass('ComparisonActiveSort');
    const sessionId = sessClass.createSession(dataset.id, 'Test session', 'Test prompt!', 'Label 1,Label2',
        null, SLICE_OPTS, 0);

    const session = dbapi.selectLabelingSession(sessionId);

    assert.deepStrictEqual(
        session,
        {
            id: 1,
            datasetId: dataset.id,
            sessionType: 'ComparisonActiveSort',
            sessionName: 'Test session',
            prompt: 'Test prompt!',
            labelOptions: 'Label 1,Label2',
            metadataJson: '{"Slices From":"Create New","Image Count":4,"Slice Count":10,"Slice Dim":0,"Slice Min Pct":20,"Slice Max Pct":80}',
        }
    );

    const slices = dbapi.selectSessionSlices(session.id);

    assert.deepStrictEqual(slices.map(s => s.elementIndex), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const slice of slices) {
        assert.strictEqual(slice.sessionId, session.id);
        assert.strictEqual(slice.elementType, 'Slice');
        assert.strictEqual(slice.sliceDim, 0);
        assert.strictEqual(slice.datasetRootPath, dataset.rootPath);
    }

    const comparisons = dbapi.selectSessionComparisons(session.id);

    assert.deepStrictEqual(comparisons.map(c => c.elementIndex), [0]);
    assert.strictEqual(comparisons[0].sessionId, session.id);
    assert.strictEqual(comparisons[0].elementType, 'Comparison');
    assert.strictEqual(comparisons[0].sliceDim1, 0);
    assert.strictEqual(comparisons[0].sliceDim2, 0);
    assert.strictEqual(comparisons[0].datasetRootPath, dataset.rootPath);
}
