import {dbapi} from '../../frontend/backend';
import {SliceSampleOpts} from '../../frontend/sampling';
import * as Sampling from '../../frontend/sampling';

import * as assert from 'assert';
import * as Fixtures from '../fixtures';

export function testSliceSampling() {
    const dataset = Fixtures.datasetFixture();
    const images = dbapi.selectDatasetImages(dataset.id);

    function sample(imageCount: number, sliceCount: number, sliceDim: number, sliceMinPct: number, sliceMaxPct: number) {
        const sliceOpts: SliceSampleOpts = {imageCount, sliceCount, sliceDim, sliceMinPct, sliceMaxPct};
        return Sampling.sampleSlices(images, sliceOpts);
    }

    assert.strictEqual(sample(4, 10, 0, 20, 80).length, 10);
    assert.strictEqual(sample(1, 10, 0, 0, 100).length, 10);
    assert.strictEqual(sample(1, 10000, 0, 0, 100).length, 176);
    assert.throws(() => sample(0, 10, 0, 0, 100), {message: `Can't sample 0 elements`});
    assert.throws(() => sample(4, 0, 0, 20, 80), {message: `Can't sample 0 elements`});
    assert.throws(() => sample(4, 10, -1, 20, 80), {message: `Invalid sliceDim -1`});
    assert.throws(() => sample(4, 10, 3, 20, 80), {message: `Invalid sliceDim 3`});
}

export function testComparisonSampling() {
    const sample = Sampling.sampleComparisons;

    assert.strictEqual(sample(10, 20).length, 20);
    assert.throws(() => sample(10, 0), {message: `Can't sample 0 elements`});
    assert.throws(() => sample(0, 10), {message: `Can't sample 10 elements from an array of length 0`});
    assert.throws(() => sample(10, 100), {message: `Can't sample 100 elements from an array of length 36`});
}
