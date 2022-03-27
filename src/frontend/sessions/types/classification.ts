import {PrivateSessionBase} from '../base';
import {sampleSlices} from '../../sampling';
import {dbapi} from '../../backend';

export class ClassificationSession extends PrivateSessionBase {
    static createSession(datasetId: number | string, sessionName: string, prompt: string, labelOptions: string,
                         imageCount: number, slicesFrom: string, sliceCount: number, sliceDim: number,
                         sliceMinPct: number, sliceMaxPct: number): number {
        const datasetImages = dbapi.selectDatasetImages(datasetId);
        const slices = sampleSlices(datasetImages, imageCount, sliceCount, sliceDim, sliceMinPct, sliceMaxPct);

        const metadata = this.createBasicMetadata(slicesFrom, imageCount, sliceCount, sliceDim, sliceMinPct, sliceMaxPct);
        const metadataJson = JSON.stringify(metadata);

        return dbapi.insertLabelingSession(datasetId, 'Classification', sessionName, prompt, labelOptions,
            null, metadataJson, slices, null);
    }
}
