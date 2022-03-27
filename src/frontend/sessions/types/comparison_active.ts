import {PrivateSessionBase} from '../base';
import {dbapi} from '../../backend';
import {sampleSlices, SliceSampleOpts} from '../../sampling';
import {getInitialComparison} from '../../sort';

export class ComparisonActiveSortSession extends PrivateSessionBase {
    static createSession(datasetId: number | string, sessionName: string, prompt: string, labelOptions: string,
                         slicesFrom: string, sliceOpts: SliceSampleOpts, comparisonCount: number): number {

        const slices = sampleSlices(dbapi.selectDatasetImages(datasetId), sliceOpts);
        const comparisons = [getInitialComparison(slices)];

        const metadata = this.createBasicMetadata(slicesFrom, sliceOpts);

        return dbapi.insertLabelingSession(datasetId, 'ComparisonActiveSort', sessionName, prompt, labelOptions,
            null, JSON.stringify(metadata), slices, comparisons);
    }
}
