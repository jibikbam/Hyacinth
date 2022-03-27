import {PrivateSessionBase} from '../base';
import {dbapi} from '../../backend';
import {sampleComparisons, sampleSlices, SliceSampleOpts} from '../../sampling';

export class ComparisonRandomSession extends PrivateSessionBase {
    static createSession(datasetId: number | string, sessionName: string, prompt: string, labelOptions: string,
                         slicesFrom: string, sliceOpts: SliceSampleOpts, comparisonCount: number): number {

        const slices = sampleSlices(dbapi.selectDatasetImages(datasetId), sliceOpts);
        const comparisons = sampleComparisons(sliceOpts.sliceCount, comparisonCount);

        const metadata = this.createBasicMetadata(slicesFrom, sliceOpts);
        metadata['Comparison Count'] = comparisonCount;

        return dbapi.insertLabelingSession(datasetId, 'ComparisonRandom', sessionName, prompt, labelOptions,
            null, JSON.stringify(metadata), slices, comparisons);
    }
}
