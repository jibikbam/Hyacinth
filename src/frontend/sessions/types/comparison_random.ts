import {PrivateSessionBase} from '../base';
import {dbapi, LabelingSession, SessionElement, SliceAttributes} from '../../backend';
import {SessionResults, SliceResult} from '../../results';
import * as Sampling from '../../sampling';
import * as Results from '../../results';
import * as Collab from '../../collaboration';

export class ComparisonRandomSession extends PrivateSessionBase {
    createSession(datasetId: number | string, sessionName: string, prompt: string, labelOptions: string,
                         slices: SliceAttributes[], metadata: object, comparisonCount: number): number {

        const comparisons = Sampling.sampleComparisons(slices.length, comparisonCount);

        metadata['Comparison Count'] = comparisons.length;
        metadata['Exhaustive'] = comparisonCount === -1;

        return dbapi.insertLabelingSession(datasetId, 'ComparisonRandom', sessionName, prompt, labelOptions,
            JSON.stringify(metadata), slices, comparisons);
    }

    selectElementsToLabel(session: LabelingSession): SessionElement[] {
        return dbapi.selectSessionComparisons(session.id);
    }

    isComparison(): boolean {
        return true;
    }

    isActive(): boolean {
        return false;
    }

    sessionTags(): string[] {
        return ['Comparison Session', 'Random Sampling'];
    }

    shouldWarnAboutLabelOverwrite(session: LabelingSession, index: number): boolean {
        return false;
    }

    addLabel(session: LabelingSession, element: SessionElement, labelValue: string, startTimestamp: number) {
        dbapi.insertElementLabel(element.id, labelValue, startTimestamp, Date.now());
    }

    computeResults(session: LabelingSession): SessionResults {
        const slices = dbapi.selectSessionSlices(session.id);
        const comparisonsWithLabels = Results.withLabels(dbapi.selectSessionComparisons(session.id));
        const resultsWithScores = Results.computeScores(slices, comparisonsWithLabels);
        const resultsSorted = Results.sortedByScore(resultsWithScores);
        return {
            labelingComplete: !comparisonsWithLabels.map(([_, l]) => l).includes(null),
            sliceResults: resultsSorted,
        }
    }

    exportToJsonString(session: LabelingSession): string {
        const sessionJson = Collab.sessionAttributesToJson(session);
        sessionJson['slices'] = Collab.slicesToJson(dbapi.selectSessionSlices(session.id));
        sessionJson['comparisons'] = Collab.comparisonsToJson(dbapi.selectSessionComparisons(session.id));
        return Collab.jsonToString(sessionJson);
    }

    importFromJson(sessionJson: object, newSessionName: string, datasetId: number | string): number {
        const {prompt, labelOptions, metadataJson} = Collab.sessionAttributesFromJson(sessionJson);
        const slices = Collab.slicesFromSessionJson(sessionJson, datasetId);
        const comparisons = Collab.comparisonsFromSessionJson(sessionJson, datasetId, slices);

        return dbapi.insertLabelingSession(datasetId, 'ComparisonRandom', newSessionName, prompt, labelOptions,
            metadataJson, slices, comparisons);
    }

    exportLabelsToCsv(session: LabelingSession): string {
        return Collab.comparisonLabelsToCsv(session);
    }

    exportResultsToCsv(results: SliceResult[]): string {
        return Collab.sessionResultsToCsv(results);
    }
}
