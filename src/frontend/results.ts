import {Comparison, dbapi, LabelingSession, Slice} from './backend';
import {splitLabelOptions} from './utils';
import {buildSortMatrix, sortSlices} from './sort';

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

function computeClassificationResults(session: LabelingSession): SessionResults {
    const slices = dbapi.selectSessionSlices(session.id);
    const slicesWithLabels: [Slice, string | null][] = slices.map(s => {
        const _labels = dbapi.selectElementLabels(s.id);
        const _latestLabelValue = _labels.length > 0 ? _labels[_labels.length - 1].labelValue : null;

        return [s, _latestLabelValue];
    });

    const labelOptions = splitLabelOptions(session.labelOptions);

    slicesWithLabels.sort(([a, aLabel], [b, bLabel]) => {
        const aKey = aLabel === null ? 0 : labelOptions.indexOf(aLabel) + 1;
        const bKey = bLabel === null ? 0 : labelOptions.indexOf(bLabel) + 1;

        return bKey - aKey; // We want highest first, for lowest first: aKey - bKey
    });

    const sliceResults = slicesWithLabels.map(([s, sLabel]) => {
        return {
            slice: s,
            latestLabelValue: sLabel,
        };
    });

    const labelingComplete = !slicesWithLabels.map(([_, l]) => l).includes(null);

    return {
        labelingComplete: labelingComplete,
        sliceResults: sliceResults,
    }
}

function computeComparisonResults(session: LabelingSession): SessionResults {
    const slices = dbapi.selectSessionSlices(session.id);
    const comparisons = dbapi.selectSessionComparisons(session.id);
    const comparisonLabels = dbapi.selectSessionLatestComparisonLabels(session.id);

    const comparisonsWithLabels: [Comparison, string][] = comparisons.map((c, i) => [c, comparisonLabels[i]]);

    function findSlice(imageId: number, sliceDim: number, sliceIndex: number) {
        for (const sl of slices) {
            if (sl.imageId === imageId && sl.sliceDim === sliceDim && sl.sliceIndex === sliceIndex) return sl;
        }
        throw new Error(`Could not find slice for comparison imageId=${imageId} sliceDim=${sliceDim} sliceIndex=${sliceIndex}`);
    }

    function inc([win, loss, draw]: [number, number, number], result: 'Win' | 'Loss' | 'Draw'): [number, number, number] {
        if (result === 'Win') win += 1;
        else if (result === 'Loss') loss += 1;
        else draw += 1;

        return [win, loss, draw];
    }

    // Initialize scores
    const sliceScores = {};
    for (const sl of slices) sliceScores[sl.id] = [0, 0, 0];

    for (const [c, label] of comparisonsWithLabels) {
        const sl1 = findSlice(c.imageId1, c.sliceDim1, c.sliceIndex1);
        const sl2 = findSlice(c.imageId2, c.sliceDim2, c.sliceIndex2);

        if (label === 'First') {
            sliceScores[sl1.id] = inc(sliceScores[sl1.id], 'Win');
            sliceScores[sl2.id] = inc(sliceScores[sl2.id], 'Loss');
        }
        else if (label === 'Second') {
            sliceScores[sl1.id] = inc(sliceScores[sl1.id], 'Loss');
            sliceScores[sl2.id] = inc(sliceScores[sl2.id], 'Win');
        }
        else {
            sliceScores[sl1.id] = inc(sliceScores[sl1.id], 'Draw');
            sliceScores[sl2.id] = inc(sliceScores[sl2.id], 'Draw');
        }
    }

    const sliceResults: SliceResult[] = slices.map(s => {
        const [win, loss, draw] = sliceScores[s.id];
        const total = win + loss + draw;
        return {
            slice: s,
            score: total === 0 ? 0 : (win - loss) / total,
            win: win,
            loss: loss,
            draw: draw,
        };
    });

    sliceResults.sort((a, b) => {
        return b.score - a.score; // We want highest first, for lowest first: a - b
    });

    const labelingComplete = !comparisonLabels.includes(null);

    return {
        labelingComplete: labelingComplete,
        sliceResults: sliceResults,
    };
}

function computeSortResults(session: LabelingSession): SessionResults {
    const slices = dbapi.selectSessionSlices(session.id);
    const comparisons = dbapi.selectSessionComparisons(session.id);
    const comparisonLabels = dbapi.selectSessionLatestComparisonLabels(session.id);

    const sortResult = sortSlices(
        buildSortMatrix(comparisons, comparisonLabels),
        slices
    );

    if (Array.isArray(sortResult)) {
        return {
            labelingComplete: true,
            sliceResults: (sortResult as Slice[]).map(s => ({slice: s})),
        }
    }
    else {
        return {
            labelingComplete: false,
            sliceResults: slices.map(s => ({slice: s})),
        }
    }
}

export function computeResults(session: LabelingSession): SessionResults {
    const [type, sampling] = [session.sessionType, session.comparisonSampling];
    if (type === 'Classification') {
        return computeClassificationResults(session);
    }
    else if (type === 'Comparison' && sampling === 'Random') {
        return computeComparisonResults(session);
    }
    else if (type === 'Comparison' && sampling === 'Sort') {
        return computeSortResults(session);
    }
    else {
        throw new Error(`Cannot handle session: type=${type} sampling=${sampling}`);
    }
}
