import {Comparison, DatasetImage, dbapi, LabelingSession, Slice, SliceAttributes} from './backend';
import {sliceToString} from './sort';
import {SliceResult} from './results';
import * as JsonUtils from './json_utils';

// ---- Export Session ----

export function jsonToString(obj: object): string {
    return JSON.stringify(obj, null, 1);
}

export function sessionAttributesToJson(session: LabelingSession): object {
    const {sessionType, sessionName, prompt, labelOptions, metadataJson} = session;
    return {sessionType, sessionName, prompt, labelOptions, metadataJson};
}

export function slicesToJson(slices: Slice[]): object[] {
    return slices.map(s => {
        const {imageRelPath, sliceDim, sliceIndex} = s;
        return {imageRelPath, sliceDim, sliceIndex};
    });
}

export function comparisonsToJson(comparisons: Comparison[]): object[] {
    return comparisons.map(c => {
        const {imageRelPath1, sliceDim1, sliceIndex1, imageRelPath2, sliceDim2, sliceIndex2} = c;
        return {imageRelPath1, sliceDim1, sliceIndex1, imageRelPath2, sliceDim2, sliceIndex2};
    });
}


// ---- Import Session ----

class SessionImportException extends Error {
    constructor(msg) {
        super(msg);
        this.name = 'SessionImportException';
    }
}

const SESSION_VALID_KEY_TYPES: [string, string][] = [
    ['sessionName', 'string'],
    ['sessionType', 'string'],
    ['prompt', 'string'],
    ['labelOptions', 'string'],
    ['metadataJson', 'string'],
];
const SESSION_VALID_METADATA_TYPES = ['string', 'number', 'boolean'];

export function sessionAttributesFromJson(sessionJson: object): {prompt: string, labelOptions: string, metadataJson: string} {
    let valid = true;

    // Validate attribute keys exist and their values have the correct type
    if (!JsonUtils.validateJsonWithKeys(sessionJson, SESSION_VALID_KEY_TYPES)) valid = false;

    // Parse metadata JSON string and validate its values have the correct types
    const metadataJson = JSON.parse(sessionJson['metadataJson']);
    if (!JsonUtils.validateJsonValues(metadataJson, SESSION_VALID_METADATA_TYPES)) valid = false;

    // Throw error if attributes are not valid
    if (!valid) throw new SessionImportException('Session attributes are malformed.');

    metadataJson['Imported From'] = sessionJson['sessionName'];
    return {
        prompt: sessionJson['prompt'],
        labelOptions: sessionJson['labelOptions'],
        metadataJson: JSON.stringify(metadataJson),
    }
}

type ImagesByPath = {[key: string]: DatasetImage};
function getImagesByPath(datasetId: number | string): ImagesByPath {
    return Object.fromEntries(dbapi.selectDatasetImages(datasetId).map(di => [di.relPath, di]));
}

function findImage(imagesByPath: ImagesByPath, relPath: string): DatasetImage {
    const dImg = imagesByPath[relPath];
    if (!dImg) throw new SessionImportException(`Slice image ${relPath} is missing from dataset.`);
    return dImg;
}

const SLICE_VALID_KEY_TYPES: [string, string][] = [
    ['imageRelPath', 'string'],
    ['sliceDim', 'number'],
    ['sliceIndex', 'number'],
];

function sliceFromJson(sliceJson: object, imagesByPath: ImagesByPath): SliceAttributes {
    if (!JsonUtils.validateJsonWithKeys(sliceJson, SLICE_VALID_KEY_TYPES)) {
        throw new SessionImportException('Session slices are malformed.');
    }

    return {
        imageId: findImage(imagesByPath, sliceJson['imageRelPath']).id,
        sliceDim: sliceJson['sliceDim'],
        sliceIndex: sliceJson['sliceIndex'],
    }
}

export function slicesFromSessionJson(sessionJson: any, datasetId: number | string): SliceAttributes[] {
    if (!JsonUtils.validateJsonWithKeys(sessionJson, [['slices', 'object']])) {
        throw new SessionImportException('Session slices are malformed.');
    }

    const imagesByPath = getImagesByPath(datasetId);
    return sessionJson['slices'].map(sj => sliceFromJson(sj, imagesByPath));
}

const COMPARISON_VALID_KEY_TYPES: [string, string][] = [
    ['imageRelPath1', 'string'],
    ['sliceDim1', 'number'],
    ['sliceIndex1', 'number'],
    ['imageRelPath2', 'string'],
    ['sliceDim2', 'number'],
    ['sliceIndex2', 'number'],
];

function comparisonFromJson(comparisonJson: object, imagesByPath: ImagesByPath,
                            sliceIndicesByString: {[key: string]: number}): [number, number] {
    if (!JsonUtils.validateJsonWithKeys(comparisonJson, COMPARISON_VALID_KEY_TYPES)) {
        throw new SessionImportException('Session comparisons are malformed.');
    }

    const cj = comparisonJson;
    const img1 = findImage(imagesByPath, cj['imageRelPath1']);
    const img2 = findImage(imagesByPath, cj['imageRelPath2']);

    const sl1: SliceAttributes = {imageId: img1.id, sliceDim: cj['sliceDim1'], sliceIndex: cj['sliceIndex1']};
    const sl2: SliceAttributes = {imageId: img2.id, sliceDim: cj['sliceDim2'], sliceIndex: cj['sliceIndex2']};

    const ind1 = sliceIndicesByString[sliceToString(sl1)];
    if (ind1 === undefined) throw new Error(`Slice from comparison not found (${sl1.imageId} ${sl1.sliceDim} ${sl1.sliceIndex})`);
    const ind2 = sliceIndicesByString[sliceToString(sl2)];
    if (ind2 === undefined) throw new Error(`Slice from comparison not found (${sl2.imageId} ${sl2.sliceDim} ${sl2.sliceIndex})`);

    return [ind1, ind2];
}

export function comparisonsFromSessionJson(sessionJson: object, datasetId: number | string,
                                          slices: SliceAttributes[]): [number, number][] {
    if (!JsonUtils.validateJsonWithKeys(sessionJson, [['comparisons', 'object']])) {
        throw new SessionImportException('Session comparisons are malformed');
    }

    const imagesByPath = getImagesByPath(datasetId);
    const sliceIndByString = Object.fromEntries(slices.map((s, i) => [sliceToString(s), i]));

    return sessionJson['comparisons'].map(cj => comparisonFromJson(cj, imagesByPath, sliceIndByString));
}


// ---- Export Labels ----

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
