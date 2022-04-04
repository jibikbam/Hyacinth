import {PrivateSessionBase} from '../base';
import {dbapi, LabelingSession, SessionElement, Slice} from '../../backend';
import {SliceSampleOpts} from '../../sampling';
import * as Sampling from '../../sampling';
import * as Sort from '../../sort';
import * as Collab from '../../collaboration';

export class ComparisonActiveSortSession extends PrivateSessionBase {
    static createSession(datasetId: number | string, sessionName: string, prompt: string, labelOptions: string,
                         slicesFrom: string, sliceOpts: SliceSampleOpts, comparisonCount: number): number {

        const slices = Sampling.sampleSlices(dbapi.selectDatasetImages(datasetId), sliceOpts);
        const comparisons = [Sort.getInitialComparison(slices)];

        const metadata = this.createBasicMetadata(slicesFrom, sliceOpts);

        return dbapi.insertLabelingSession(datasetId, 'ComparisonActiveSort', sessionName, prompt, labelOptions,
            JSON.stringify(metadata), slices, comparisons);
    }

    static selectElementsToLabel(session: LabelingSession): SessionElement[] {
        return dbapi.selectSessionComparisons(session.id);
    }

    static shouldWarnAboutLabelOverwrite(session: LabelingSession, index: number): boolean {
        // Checks whether there are more labels after "index" which we should warn about in the UI
        const allComparisonLabels = dbapi.selectSessionLatestComparisonLabels(session.id);
        return allComparisonLabels.length > (index + 1) && allComparisonLabels[index + 1] !== null;
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
        const sortResult = Sort.sortSlices(
            Sort.buildSortMatrix(comparisons, labels),
            dbapi.selectSessionSlices(session.id)
        );

        let newComparison: [Slice, Slice] | null;
        if (Array.isArray(sortResult)) {
            newComparison = null;
            console.log('Sort Results:', sortResult.map(r => r.elementIndex));
        }
        else {
            newComparison = [sortResult.slice1, sortResult.slice2];
        }

        dbapi.insertComparisonLabelActive(element.id, labelValue, startTimestamp, Date.now(), newComparison);
    }

    static exportToJsonString(session: LabelingSession): string {
        const sessionJson = Collab.sessionAttributesToJson(session);
        sessionJson['slices'] = Collab.slicesToJson(dbapi.selectSessionSlices(session.id));
        return Collab.jsonToString(sessionJson);
    }

    static importFromJson(sessionJson: object, newSessionName: string, datasetId: number | string): number {
        const {prompt, labelOptions, metadataJson} = Collab.sessionAttributesFromJson(sessionJson);
        const slices = Collab.slicesFromSessionJson(sessionJson, datasetId);
        const comparisons = [Sort.getInitialComparison(slices)];

        return dbapi.insertLabelingSession(datasetId, 'ComparisonActiveSort', newSessionName, prompt, labelOptions,
            metadataJson, slices, comparisons);
    }
}
