import {PrivateSessionBase} from '../base';
import {dbapi, LabelingSession, SessionElement} from '../../backend';
import {SliceSampleOpts} from '../../sampling';
import * as Sampling from '../../sampling';
import * as Collab from '../../collaboration';

export class ClassificationSession extends PrivateSessionBase {
    static createSession(datasetId: number | string, sessionName: string, prompt: string, labelOptions: string,
                         slicesFrom: string, sliceOpts: SliceSampleOpts, comparisonCount: number): number {

        const slices = Sampling.sampleSlices(dbapi.selectDatasetImages(datasetId), sliceOpts);
        const metadata = this.createBasicMetadata(slicesFrom, sliceOpts);

        return dbapi.insertLabelingSession(datasetId, 'Classification', sessionName, prompt, labelOptions,
            JSON.stringify(metadata), slices, null);
    }

    static selectElementsToLabel(session: LabelingSession): SessionElement[] {
        return dbapi.selectSessionSlices(session.id);
    }

    static shouldWarnAboutLabelOverwrite(session: LabelingSession, index: number): boolean {
        return false;
    }

    static addLabel(session: LabelingSession, element: SessionElement, labelValue: string, startTimestamp: number) {
        dbapi.insertElementLabel(element.id, labelValue, startTimestamp, Date.now());
    }

    static exportToJsonString(session: LabelingSession): string {
        const sessionJson = Collab.sessionAttributesToJson(session);
        sessionJson['slices'] = Collab.slicesToJson(dbapi.selectSessionSlices(session.id));
        return Collab.jsonToString(sessionJson);
    }

    static importFromJson(sessionJson: object, newSessionName: string, datasetId: number | string): number {
        const {prompt, labelOptions, metadataJson} = Collab.sessionAttributesFromJson(sessionJson);
        const slices = Collab.slicesFromSessionJson(sessionJson, datasetId);

        return dbapi.insertLabelingSession(datasetId, 'Classification', newSessionName, prompt, labelOptions,
            metadataJson, slices, null);
    }
}
