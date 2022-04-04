import {PrivateSessionBase} from '../base';
import {dbapi, LabelingSession, SessionElement} from '../../backend';
import {SliceSampleOpts} from '../../sampling';
import {SessionResults, SliceResult} from '../../results';
import * as Sampling from '../../sampling';
import * as Results from '../../results';
import * as Collab from '../../collaboration';

export class ComparisonRandomSession extends PrivateSessionBase {
    static createSession(datasetId: number | string, sessionName: string, prompt: string, labelOptions: string,
                         slicesFrom: string, sliceOpts: SliceSampleOpts, comparisonCount: number): number {

        const slices = Sampling.sampleSlices(dbapi.selectDatasetImages(datasetId), sliceOpts);
        const comparisons = Sampling.sampleComparisons(sliceOpts.sliceCount, comparisonCount);

        const metadata = this.createBasicMetadata(slicesFrom, sliceOpts);
        metadata['Comparison Count'] = comparisonCount;

        return dbapi.insertLabelingSession(datasetId, 'ComparisonRandom', sessionName, prompt, labelOptions,
            JSON.stringify(metadata), slices, comparisons);
    }

    static selectElementsToLabel(session: LabelingSession): SessionElement[] {
        return dbapi.selectSessionComparisons(session.id);
    }

    static shouldWarnAboutLabelOverwrite(session: LabelingSession, index: number): boolean {
        return false;
    }

    static addLabel(session: LabelingSession, element: SessionElement, labelValue: string, startTimestamp: number) {
        dbapi.insertElementLabel(element.id, labelValue, startTimestamp, Date.now());
    }

    static computeResults(session: LabelingSession): SessionResults {
        const slices = dbapi.selectSessionSlices(session.id);
        const comparisonsWithLabels = Results.withLabels(dbapi.selectSessionComparisons(session.id));
        const resultsWithScores = Results.computeScores(slices, comparisonsWithLabels);
        const resultsSorted = Results.sortedByScore(resultsWithScores);
        return {
            labelingComplete: !comparisonsWithLabels.map((_, l) => l).includes(null),
            sliceResults: resultsSorted,
        }
    }

    static exportToJsonString(session: LabelingSession): string {
        const sessionJson = Collab.sessionAttributesToJson(session);
        sessionJson['slices'] = Collab.slicesToJson(dbapi.selectSessionSlices(session.id));
        sessionJson['comparisons'] = Collab.comparisonsToJson(dbapi.selectSessionComparisons(session.id));
        return Collab.jsonToString(sessionJson);
    }

    static importFromJson(sessionJson: object, newSessionName: string, datasetId: number | string): number {
        const {prompt, labelOptions, metadataJson} = Collab.sessionAttributesFromJson(sessionJson);
        const slices = Collab.slicesFromSessionJson(sessionJson, datasetId);
        const comparisons = Collab.comparisonsFromSessionJson(sessionJson, datasetId, slices);

        return dbapi.insertLabelingSession(datasetId, 'ComparisonRandom', newSessionName, prompt, labelOptions,
            metadataJson, slices, comparisons);
    }

    static exportLabelsToCsv(session: LabelingSession): string {
        return Collab.comparisonLabelsToCsv(session);
    }

    static exportResultsToCsv(results: SliceResult[]): string {
        return Collab.sessionResultsToCsv(results);
    }
}
