import {SliceSampleOpts} from '../sampling';

export abstract class SessionBase {
    static createSession(datasetId: number | string, sessionName: string, prompt: string, labelOptions: string,
                         slicesFrom: string, sliceOpts: SliceSampleOpts, comparisonCount: number): number {
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
