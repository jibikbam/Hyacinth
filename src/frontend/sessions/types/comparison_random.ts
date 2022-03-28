import {PrivateSessionBase} from '../base';
import {dbapi, LabelingSession, SessionElement} from '../../backend';
import {sampleComparisons, sampleSlices, SliceSampleOpts} from '../../sampling';
import {
    basicSessionJsonIsValid,
    comparisonsToJson,
    createBasicSessionJson, importComparisonsFromSessionJson,
    importSlicesFromSessionJson,
    toJsonString
} from '../../collaboration';

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

    static selectElementsToLabel(session: LabelingSession): SessionElement[] {
        return dbapi.selectSessionComparisons(session.id);
    }

    static shouldWarnAboutLabelOverwrite(session: LabelingSession, index: number): boolean {
        return false;
    }

    static addLabel(session: LabelingSession, element: SessionElement, labelValue: string, startTimestamp: number) {
        dbapi.insertElementLabel(element.id, labelValue, startTimestamp, Date.now(), null);
    }

    static exportToJsonString(session: LabelingSession): string {
        const sessionJson = createBasicSessionJson(session);
        sessionJson['comparisons'] = comparisonsToJson(dbapi.selectSessionComparisons(session.id));
        return toJsonString(sessionJson);
    }

    static importFromJson(sessionJson: object, newSessionName: string, datasetId: number | string): number {
        if (!basicSessionJsonIsValid(sessionJson)) return;
        const slices = importSlicesFromSessionJson(sessionJson, datasetId);
        const comparisons = importComparisonsFromSessionJson(sessionJson, datasetId, slices);

        const sj = sessionJson;
        return dbapi.insertLabelingSession(datasetId, 'ComparisonRandom', newSessionName, sj['prompt'], sj['labelOptions'],
            null, sj['metadataJson'], slices, comparisons);
    }
}
