import {PrivateSessionBase} from '../base';
import {dbapi, LabelingSession, SessionElement} from '../../backend';
import {sampleSlices, SliceSampleOpts} from '../../sampling';

export class ClassificationSession extends PrivateSessionBase {
    static createSession(datasetId: number | string, sessionName: string, prompt: string, labelOptions: string,
                         slicesFrom: string, sliceOpts: SliceSampleOpts, comparisonCount: number): number {

        const slices = sampleSlices(dbapi.selectDatasetImages(datasetId), sliceOpts);
        const metadata = this.createBasicMetadata(slicesFrom, sliceOpts);

        return dbapi.insertLabelingSession(datasetId, 'Classification', sessionName, prompt, labelOptions,
            null, JSON.stringify(metadata), slices, null);
    }

    static selectElementsToLabel(session: LabelingSession): SessionElement[] {
        return dbapi.selectSessionSlices(session.id);
    }

    static shouldWarnAboutLabelOverwrite(session: LabelingSession, index: number): boolean {
        return false;
    }

    static addLabel(session: LabelingSession, element: SessionElement, labelValue: string, startTimestamp: number) {
        dbapi.insertElementLabel(element.id, labelValue, startTimestamp, Date.now(), null);
    }
}
