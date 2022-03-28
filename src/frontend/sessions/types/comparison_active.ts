import {PrivateSessionBase} from '../base';
import {dbapi, LabelingSession, SessionElement} from '../../backend';
import {sampleSlices, SliceSampleOpts} from '../../sampling';
import {buildSortMatrix, getInitialComparison, sortSlices} from '../../sort';
import {
    basicSessionJsonIsValid,
    createBasicSessionJson, importComparisonsFromSessionJson,
    importSlicesFromSessionJson,
    toJsonString
} from '../../collaboration';

export class ComparisonActiveSortSession extends PrivateSessionBase {
    static createSession(datasetId: number | string, sessionName: string, prompt: string, labelOptions: string,
                         slicesFrom: string, sliceOpts: SliceSampleOpts, comparisonCount: number): number {

        const slices = sampleSlices(dbapi.selectDatasetImages(datasetId), sliceOpts);
        const comparisons = [getInitialComparison(slices)];

        const metadata = this.createBasicMetadata(slicesFrom, sliceOpts);

        return dbapi.insertLabelingSession(datasetId, 'ComparisonActiveSort', sessionName, prompt, labelOptions,
            null, JSON.stringify(metadata), slices, comparisons);
    }

    static selectElementsToLabel(session: LabelingSession): SessionElement[] {
        return dbapi.selectSessionComparisons(session.id);
    }

    static shouldWarnAboutLabelOverwrite(session: LabelingSession, index: number): boolean {
        const allComparisonLabels = dbapi.selectSessionLatestComparisonLabels(session.id);
        return allComparisonLabels.length > (index + 2);
    }

    static addLabel(session: LabelingSession, element: SessionElement, labelValue: string, startTimestamp: number) {
        const initialComparisons = dbapi.selectSessionComparisons(session.id);
        const initialLabels = dbapi.selectSessionLatestComparisonLabels(session.id);

        // Remove any labels that we will be overwriting
        const comparisons = initialComparisons.slice(0, element.elementIndex + 1);
        const labels = initialLabels.slice(0, element.elementIndex + 1);
        // Add new label
        labels[element.elementIndex] = labelValue;

        // Compute new sort result with modified labels
        const sortResult = sortSlices(
            buildSortMatrix(comparisons, labels),
            dbapi.selectSessionSlices(session.id)
        );

        let newComparisonOpts;
        if (Array.isArray(sortResult)) {
            newComparisonOpts = null;
            console.log('Sort Results:', sortResult.map(r => r.elementIndex));
        }
        else {
            newComparisonOpts = {
                sessionId: session.id,
                elementIndex: element.elementIndex + 1,
                slice1: sortResult.slice1,
                slice2: sortResult.slice2,
            }
        }

        // TODO: dedicated insert function for active label in dbapi
        dbapi.insertElementLabel(element.id, labelValue, startTimestamp, Date.now(), newComparisonOpts);
    }

    static exportToJsonString(session: LabelingSession): string {
        const sessionJson = createBasicSessionJson(session);
        return toJsonString(sessionJson);
    }

    static importFromJson(sessionJson: object, newSessionName: string, datasetId: number | string): number {
        if (!basicSessionJsonIsValid(sessionJson)) return;
        const slices = importSlicesFromSessionJson(sessionJson, datasetId);
        const comparisons = [getInitialComparison(slices)];

        const sj = sessionJson;
        return dbapi.insertLabelingSession(datasetId, 'ComparisonActiveSort', newSessionName, sj['prompt'], sj['labelOptions'],
            null, sj['metadataJson'], slices, comparisons);
    }
}
