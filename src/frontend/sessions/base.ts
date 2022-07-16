import {SliceSampleOpts} from '../sampling';
import {LabelingSession, SessionElement, SliceAttributes} from '../backend';
import {SessionResults, SliceResult} from '../results';

export abstract class SessionBase {
    abstract createSession(datasetId: number | string, sessionName: string, prompt: string, labelOptions: string,
                           slices: SliceAttributes[], metadata: object, comparisonCount: number): number

    abstract selectElementsToLabel(session: LabelingSession): SessionElement[]

    abstract isComparison(): boolean

    abstract isActive(): boolean;

    abstract sessionTags(): string[]

    abstract shouldWarnAboutLabelOverwrite(session: LabelingSession, index: number): boolean

    abstract addLabel(session: LabelingSession, element: SessionElement, labelValue: string, startTimestamp: number)

    abstract computeResults(session: LabelingSession): SessionResults

    abstract exportToJsonString(session: LabelingSession): string

    abstract importFromJson(sessionJson: object, newSessionName: string, datasetId: number | string): number

    abstract exportLabelsToCsv(session: LabelingSession): string

    abstract exportResultsToCsv(results: SliceResult[]): string
}

export abstract class PrivateSessionBase extends SessionBase {}
