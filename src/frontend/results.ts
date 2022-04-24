import {Comparison, dbapi, SessionElement, Slice} from './backend';
import * as Utils from './utils';

export interface SliceResult {
    slice: Slice;
    latestLabelValue?: string;

    score?: number;
    win?: number;
    loss?: number;
    draw?: number;
}

export interface SessionResults {
    labelingComplete: boolean;
    sliceResults: SliceResult[];
}

export function withLabels<T extends SessionElement>(elements: T[]): [T, string | null][] {
    return elements.map(e => {
        const labels = dbapi.selectElementLabels(e.id);
        const latest = (labels.length > 0) ? labels[0].labelValue : null;
        return [e, latest];
    })
}

export function sortedByLabel<T extends SessionElement>(elementsWithLabels: [T, string | null][],
                                                        labelOptionsString: string): [T, string | null][] {
    const labelOptions = Utils.splitLabelOptions(labelOptionsString);
    const cloned = elementsWithLabels.slice();
    cloned.sort(([a, aLabel], [b, bLabel]) => {
        const aKey = (aLabel === null) ? 0 : labelOptions.indexOf(aLabel) + 1;
        const bKey = (bLabel === null) ? 0 : labelOptions.indexOf(bLabel) + 1;
        return bKey - aKey; // We want highest first - for lowest first: aKey - bKey
    });
    return cloned;
}

export function computeScores(slices: Slice[], comparisonsWithLabels: [Comparison, string | null][]): SliceResult[] {
    function findSlice(imageId: number, sliceDim: number, sliceIndex: number) {
        const slice = slices.find(s => s.imageId === imageId && s.sliceDim === sliceDim && s.sliceIndex == sliceIndex);
        if (slice) return slice;
        else throw new Error(`Could not find slice for comparison: ${imageId} ${sliceDim} ${sliceIndex}`);
    }

    function inc([win, loss, draw]: [number, number, number], result: 'W' | 'L' | 'D'): [number, number, number] {
        switch (result) {
            case 'W': return [win + 1, loss, draw];
            case 'L': return [win, loss + 1, draw];
            default: return [win, loss, draw + 1];
        }
    }

    // Initialize scores
    const sliceScores = {};
    for (const sl of slices) sliceScores[sl.id] = [0, 0, 0];

    for (const [c, label] of comparisonsWithLabels) {
        const sl1 = findSlice(c.imageId1, c.sliceDim1, c.sliceIndex1);
        const sl2 = findSlice(c.imageId2, c.sliceDim2, c.sliceIndex2);

        if (label === 'First') {
            sliceScores[sl1.id] = inc(sliceScores[sl1.id], 'W');
            sliceScores[sl2.id] = inc(sliceScores[sl2.id], 'L');
        }
        else if (label === 'Second') {
            sliceScores[sl1.id] = inc(sliceScores[sl1.id], 'L');
            sliceScores[sl2.id] = inc(sliceScores[sl2.id], 'W');
        }
        else if (label) { // ensure not null
            sliceScores[sl1.id] = inc(sliceScores[sl1.id], 'D');
            sliceScores[sl2.id] = inc(sliceScores[sl2.id], 'D');
        }
        else {} // label is null
    }

    return slices.map(slice => {
        const [win, loss, draw] = sliceScores[slice.id];
        const total = win + loss + draw;
        const score = (total === 0) ? 0 : (win - loss) / total;
        return {slice, score, win, loss, draw};
    });
}

export function sortedByScore(results: SliceResult[]): SliceResult[] {
    const cloned = results.slice();
    cloned.sort((a, b) => b.score - a.score);
    return cloned;
}
