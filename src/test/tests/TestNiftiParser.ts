import * as Nifti from '../../frontend/parsers/nifti';

import * as assert from 'assert';

// Note: Tests here are run against fakevolumeapi, not real data!

export function testLoadDims() {
    const header = Nifti.parseHeader('img1.nii.gz');
    assert.strictEqual(header.littleEndian, true);
    assert.strictEqual(header.sizeOfHeader, 348);
    assert.deepStrictEqual(header.dim, [3, 176, 256, 256, 1, 0, 0, 0]);
}
