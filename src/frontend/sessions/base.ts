import {SliceSampleOpts} from '../sampling';
import {LabelingSession, SessionElement} from '../backend';
import {SessionResults, SliceResult} from '../results';

export abstract class SessionBase {
    abstract createSession(datasetId: number | string, sessionName: string, prompt: string, labelOptions: string,
                           slicesFromSession: LabelingSession | null, sliceOpts: SliceSampleOpts, comparisonCount: number): number

    abstract selectElementsToLabel(session: LabelingSession): SessionElement[]

    abstract isComparison(): boolean

    abstract shouldWarnAboutLabelOverwrite(session: LabelingSession, index: number): boolean

    abstract addLabel(session: LabelingSession, element: SessionElement, labelValue: string, startTimestamp: number)

    abstract computeResults(session: LabelingSession): SessionResults

    abstract exportToJsonString(session: LabelingSession): string

    abstract importFromJson(sessionJson: object, newSessionName: string, datasetId: number | string): number

    abstract exportLabelsToCsv(session: LabelingSession): string

    abstract exportResultsToCsv(results: SliceResult[]): string
}

export abstract class PrivateSessionBase extends SessionBase {}

export function createBasicMetadata(slicesFromSession: LabelingSession | null,
                                    sliceOpts: SliceSampleOpts): {[key: string]: number | string} {
    return {
        'Slices From': slicesFromSession ? slicesFromSession.sessionName : 'Create New',
        'Image Count': sliceOpts.imageCount,
        'Slice Count': sliceOpts.sliceCount,
        'Slice Dim': sliceOpts.sliceDim,
        'Slice Min Pct': sliceOpts.sliceMinPct,
        'Slice Max Pct': sliceOpts.sliceMaxPct,
    }
}
