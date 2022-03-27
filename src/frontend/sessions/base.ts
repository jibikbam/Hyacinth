export abstract class SessionBase {
    static createSession(datasetId: number | string, sessionName: string, prompt: string, labelOptions: string,
                         imageCount: number, slicesFrom: string, sliceCount: number, sliceDim: number,
                         sliceMinPct: number, sliceMaxPct: number): number {
        throw new NotImplementedError();
    }
}


export abstract class PrivateSessionBase extends SessionBase {
    static createBasicMetadata(slicesFrom: string, imageCount: number, sliceCount: number, sliceDim: number,
                               sliceMinPct: number, sliceMaxPct: number): {[key: string]: number | string} {
        return {
            'Slices From': slicesFrom,
            'Image Count': imageCount,
            'Slice Count': sliceCount,
            'Slice Dim': sliceDim,
            'Slice Min Pct': sliceMinPct,
            'Slice Max Pct': sliceMaxPct,
        }
    }
}

function NotImplementedError() {
    this.name = 'NotImplementedError';
    this.message = '';
}
NotImplementedError.prototype = Error.prototype;
