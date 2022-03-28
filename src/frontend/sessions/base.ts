import {SliceSampleOpts} from '../sampling';
import {LabelingSession, SessionElement} from '../backend';

export abstract class SessionBase {
    static createSession(datasetId: number | string, sessionName: string, prompt: string, labelOptions: string,
                         slicesFrom: string, sliceOpts: SliceSampleOpts, comparisonCount: number): number {
        throw new NotImplementedError();
    }

    static selectElementsToLabel(session: LabelingSession): SessionElement[] {
        throw new NotImplementedError();
    }

    static shouldWarnAboutLabelOverwrite(session: LabelingSession, index: number): boolean {
        throw new NotImplementedError();
    }

    static addLabel(session: LabelingSession, element: SessionElement, labelValue: string, startTimestamp: number) {
        throw new NotImplementedError();
    }

    static exportToJsonString(session: LabelingSession): string {
        throw new NotImplementedError();
    }

    static importFromJson(sessionJson: object, newSessionName: string, datasetId: number | string) {
        throw new NotImplementedError();
    }
}


export abstract class PrivateSessionBase extends SessionBase {
    static createBasicMetadata(slicesFrom: string, sliceOpts: SliceSampleOpts): {[key: string]: number | string} {
        return {
            'Slices From': slicesFrom,
            'Image Count': sliceOpts.imageCount,
            'Slice Count': sliceOpts.sliceCount,
            'Slice Dim': sliceOpts.sliceDim,
            'Slice Min Pct': sliceOpts.sliceMinPct,
            'Slice Max Pct': sliceOpts.sliceMaxPct,
        }
    }
}

function NotImplementedError() {
    this.name = 'NotImplementedError';
    this.message = '';
}
NotImplementedError.prototype = Error.prototype;
