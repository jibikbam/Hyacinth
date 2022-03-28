import {Comparison, DatasetImage, dbapi, LabelingSession, Slice, SliceAttributes} from './backend';
import {getInitialComparison, sliceToString} from './sort';
import {SliceResult} from './results';

export function toJsonString(obj: object) {
    return JSON.stringify(obj, null, 1);
}

export function createBasicSessionJson(session: LabelingSession): object {
    return {
        sessionType: session.sessionType,
        sessionName: session.sessionName,
        prompt: session.prompt,
        labelOptions: session.labelOptions,
        metadataJson: session.metadataJson,
        slices: slicesToJson(dbapi.selectSessionSlices(session.id)),
    };
}

function slicesToJson(slices: Slice[]): object[] {
    const slicesJson = [];
    for (const slice of slices) {
        slicesJson.push({
            imageRelPath: slice.imageRelPath,
            sliceDim: slice.sliceDim,
            sliceIndex: slice.sliceIndex,
        });
    }
    return slicesJson;
}

export function comparisonsToJson(comparisons: Comparison[]): object[] {
    const comparisonsJson = [];
    for (const comparison of comparisons) {
        comparisonsJson.push({
            imageRelPath1: comparison.imageRelPath1,
            sliceDim1: comparison.sliceDim1,
            sliceIndex1: comparison.sliceIndex1,
            imageRelPath2: comparison.imageRelPath2,
            sliceDim2: comparison.sliceDim2,
            sliceIndex2: comparison.sliceIndex2,
        });
    }
    return comparisonsJson;
}

const SESSION_TYPES = ['Classification', 'Comparison'];
const COMPARISON_SAMPLINGS = ['Random', 'Sort', null];

const SESSION_VALID_KEY_TYPES = [
    ['sessionName', 'string'],
    ['sessionType', 'string'],
    ['prompt', 'string'],
    ['labelOptions', 'string'],
    ['metadataJson', 'string'],
]

export function basicSessionJsonIsValid(sessionJson: object): boolean {
    let valid = true;
    for (const [k, t] of SESSION_VALID_KEY_TYPES) {
        if (!(k in sessionJson)) {
            valid = false;
            console.log(`Session JSON is missing key ${k}`);
        }
        else if (typeof sessionJson[k] !== t) {
            valid = false;
            console.log(`Session JSON value ${k}=${sessionJson[k]} is of invalid type "${typeof sessionJson[k]}" (should be "${t}")`);
        }
    }

    const metadataJson = JSON.parse(sessionJson['metadataJson']);
    for (const [k, v] of Object.entries(metadataJson)) {
        if (typeof v !== 'string' && typeof v !== 'number' && typeof v !== 'boolean') {
            valid = false;
            console.log(`Session JSON metadata value ${k}=${v} is of invalid type ${typeof v}`);
        }
    }
    return valid;
}

function getImagesByPath(datasetId: number | string): {[key: string]: DatasetImage} {
    return Object.fromEntries(dbapi.selectDatasetImages(datasetId).map(di => [di.relPath, di]));
}

export function importSlicesFromSessionJson(sessionJson: any, datasetId: number | string): SliceAttributes[] {
    const imagesByPath = getImagesByPath(datasetId);

    const slices: SliceAttributes[] = [];
    for (const sl of sessionJson.slices) {
        const dImg = imagesByPath[sl.imageRelPath];
        if (!dImg) throw new Error(`Invalid imageRelPath ${sl.imageRelPath}`);
        slices.push({
            imageId: dImg.id,
            sliceDim: sl.sliceDim,
            sliceIndex: sl.sliceIndex,
        });
    }
    return slices;
}

export function importComparisonsFromSessionJson(sessionJson: object, datasetId: number | string,
                                          slices: SliceAttributes[]): [number, number][] {
    const imagesByPath = getImagesByPath(datasetId);
    const sliceIndByString = Object.fromEntries(slices.map((s, i) => [sliceToString(s), i]));

    const comparisons: [number, number][] = [];
    for (const co of sessionJson['comparisons']) {
        const dImg1 = imagesByPath[co.imageRelPath1];
        if (!dImg1) throw new Error(`Invalid imageRelPath ${co.imageRelPath1}`);
        const dImg2 = imagesByPath[co.imageRelPath2];
        if (!dImg2) throw new Error(`Invalid imageRelPath ${co.imageRelPath2}`);

        const sl1: SliceAttributes = {imageId: dImg1.id, sliceDim: co.sliceDim1, sliceIndex: co.sliceIndex1};
        const sl2: SliceAttributes = {imageId: dImg2.id, sliceDim: co.sliceDim2, sliceIndex: co.sliceIndex2};

        const slInd1 = sliceIndByString[sliceToString(sl1)];
        if (slInd1 == undefined) throw new Error(`Slice from comparison not found (${sl1.imageId} ${sl1.sliceDim} ${sl1.sliceIndex})`);
        const slInd2 = sliceIndByString[sliceToString(sl2)];
        if (slInd2 == undefined) throw new Error(`Slice from comparison not found (${sl2.imageId} ${sl2.sliceDim} ${sl2.sliceIndex})`);

        comparisons.push([slInd1, slInd2]);
    }
    return comparisons;
}

export function sessionLabelsToCsv(sessionId: number): string {
    const labelSession = dbapi.selectLabelingSession(sessionId);

    const rows: string[][] = [];
    if (labelSession.sessionType === 'Classification') {
        // Header Row
        rows.push(['elementIndex', 'imageRelPath', 'sliceDim', 'sliceIndex', 'labelValue', 'startTimestamp', 'finishTimestamp']);

        const slices = dbapi.selectSessionSlices(labelSession.id);
        for (const slice of slices) {
            const labels = dbapi.selectElementLabels(slice.id);
            for (const label of labels) {
                rows.push([
                    slice.elementIndex.toString(), slice.imageRelPath, slice.sliceDim.toString(), slice.sliceIndex.toString(),
                    label.labelValue, label.startTimestamp.toString(), label.finishTimestamp.toString(),
                ]);
            }
        }
    }
    else { // Comparison
        // Header Row
        rows.push([
            'elementIndex',
            'imageRelPath1', 'sliceDim1', 'sliceIndex1',
            'imageRelPath2', 'sliceDim2', 'sliceIndex2',
            'labelValue', 'startTimestamp', 'finishTimestamp'
        ]);

        const comparisons = dbapi.selectSessionComparisons(labelSession.id);
        for (const comparison of comparisons) {
            const labels = dbapi.selectElementLabels(comparison.id);
            for (const label of labels) {
                rows.push([
                    comparison.elementIndex.toString(),
                    comparison.imageRelPath1, comparison.sliceDim1.toString(), comparison.sliceIndex1.toString(),
                    comparison.imageRelPath2, comparison.sliceDim2.toString(), comparison.sliceIndex2.toString(),
                    label.labelValue, label.startTimestamp.toString(), label.finishTimestamp.toString(),
                ]);
            }
        }
    }

    return rows.map(r => r.join(',')).join('\n');
}

export function sessionResultsToCsv(results: SliceResult[]): string {
    const rows: string[][] = [];

    const hasLabels = results[0].latestLabelValue !== undefined;
    const hasScores = results[0].score !== undefined;

    rows[0] = ['resultOrderIndex', 'elementIndex', 'imageRelPath', 'sliceDim', 'sliceIndex'];
    if (hasLabels) rows[0].push('latestLabelValue');
    if (hasScores) rows[0].push('score', 'comparison_wins', 'comparison_losses', 'comparison_draws');

    for (let i = 0; i < results.length; i++) {
        const r = results[i];
        const sl = r.slice;

        const curRow = [i.toString(), sl.elementIndex.toString(), sl.imageRelPath, sl.sliceDim.toString(), sl.sliceIndex.toString()];
        if (hasLabels) curRow.push(r.latestLabelValue ? r.latestLabelValue : 'UNLABELED');
        if (hasScores) curRow.push(r.score.toString(), r.win.toString(), r.loss.toString(), r.draw.toString());

        rows.push(curRow);
    }

    return rows.map(r => r.join(',')).join('\n');
}
