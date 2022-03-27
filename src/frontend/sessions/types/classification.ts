import {PrivateSessionBase} from '../base';
import {dbapi} from '../../backend';
import {sampleSlices, SliceSampleOpts} from '../../sampling';

export class ClassificationSession extends PrivateSessionBase {
    static createSession(datasetId: number | string, sessionName: string, prompt: string, labelOptions: string,
                         slicesFrom: string, sliceOpts: SliceSampleOpts, comparisonCount: number): number {

        const slices = sampleSlices(dbapi.selectDatasetImages(datasetId), sliceOpts);
        const metadata = this.createBasicMetadata(slicesFrom, sliceOpts);

        return dbapi.insertLabelingSession(datasetId, 'Classification', sessionName, prompt, labelOptions,
            null, JSON.stringify(metadata), slices, null);
    }
}
