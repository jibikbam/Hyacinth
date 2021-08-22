import {dbapi, SliceAttributes} from './backend';
import {getInitialComparison, sliceToString} from './sort';

export function sessionToJson(sessionId: number): string {
    const session = dbapi.selectLabelingSession(sessionId);
    const slices = dbapi.selectSessionSlices(sessionId);
    const comparisons = dbapi.selectSessionComparisons(sessionId);

    const sessionJson = {
        sessionType: session.sessionType,
        sessionName: session.sessionName,
        prompt: session.prompt,
        labelOptions: session.labelOptions,
        comparisonSampling: session.comparisonSampling,
        metadataJson: session.metadataJson,
        slices: [],
        comparisons: [],
    };
    for (const slice of slices) {
        sessionJson.slices.push({
            imageRelPath: slice.imageRelPath,
            sliceIndex: slice.sliceIndex,
            orientation: slice.orientation,
        });
    }
    // Only export comparisons if sampling is Random (Sort sampling will create its own comparisons)
    if (session.comparisonSampling === 'Random') {
        for (const comparison of comparisons) {
            sessionJson.comparisons.push({
                imageRelPath1: comparison.imageRelPath1,
                sliceIndex1: comparison.sliceIndex1,
                orientation1: comparison.orientation1,
                imageRelPath2: comparison.imageRelPath2,
                sliceIndex2: comparison.sliceIndex2,
                orientation2: comparison.orientation2,
            });
        }
    }
    return JSON.stringify(sessionJson, null, 1);
}

const SESSION_TYPES = ['Classification', 'Comparison'];
const COMPARISON_SAMPLINGS = ['Random', 'Sort', null];
const ORIENTATIONS = ['Sagittal'];

export function importSessionFromJson(sessionJson: any, newSessionName: string, datasetId: number): number {
    if (!SESSION_TYPES.includes(sessionJson.sessionType)) throw new Error(`Invalid sessionType ${sessionJson.sessionType}`);
    if (!COMPARISON_SAMPLINGS.includes(sessionJson.comparisonSampling)) throw new Error(`Invalid comparisonSampling ${sessionJson.comparisonSampling}`);
    if (typeof sessionJson.sessionName !== 'string') throw new Error(`Invalid sessionName ${sessionJson.sessionName}`);

    const datasetImages = dbapi.selectDatasetImages(datasetId);
    const imagesByPath = {};
    for (const dImg of datasetImages) {
        imagesByPath[dImg.relPath] = dImg;
    }

    const slices: SliceAttributes[] = [];
    for (const sl of sessionJson.slices) {
        if (!ORIENTATIONS.includes(sl.orientation)) throw new Error(`Invalid orientation ${sl.orientation}`);
        const dImg = imagesByPath[sl.imageRelPath];
        if (!dImg) throw new Error(`Invalid imageRelPath ${sl.imageRelPath}`);
        slices.push({
            imageId: dImg.id,
            sliceIndex: sl.sliceIndex,
            orientation: sl.orientation,
        });
    }

    const sliceIndByString = {};
    for (const [i, sl] of Object.entries(slices)) {
        sliceIndByString[sliceToString(sl)] = i;
    }

    const comparisons: number[][] = [];
    if (sessionJson.comparisonSampling === 'Sort') {
        comparisons.push(getInitialComparison(slices));
    }
    else {
        for (const co of sessionJson.comparisons) {
            const dImg1 = imagesByPath[co.imageRelPath1];
            if (!dImg1) throw new Error(`Invalid imageRelPath ${co.imageRelPath1}`);
            const dImg2 = imagesByPath[co.imageRelPath2];
            if (!dImg2) throw new Error(`Invalid imageRelPath ${co.imageRelPath2}`);

            const sl1: SliceAttributes = {imageId: dImg1.id, sliceIndex: co.sliceIndex1, orientation: co.orientation1};
            const sl2: SliceAttributes = {imageId: dImg2.id, sliceIndex: co.sliceIndex2, orientation: co.orientation2};

            const slInd1 = sliceIndByString[sliceToString(sl1)];
            if (!slInd1) throw new Error(`Slice from comparison not found (${sl1.imageId} ${sl1.sliceIndex} ${sl1.orientation})`);
            const slInd2 = sliceIndByString[sliceToString(sl2)];
            if (!slInd2) throw new Error(`Slice from comparison not found (${sl2.imageId} ${sl2.sliceIndex} ${sl2.orientation})`);

            comparisons.push([slInd1, slInd2]);
        }
    }

    // Parse metadata for sanity and ensure JSON is key/value with no nesting
    const metadataJson = JSON.parse(sessionJson.metadataJson);
    for (const [k, v] of Object.entries(metadataJson)) {
        if (typeof v !== 'string' && typeof v !== 'number' && typeof v !== 'boolean') throw new Error(`Invalid metadataJson value for key ${k}`);
    }
    metadataJson['Imported From'] = sessionJson.sessionName;

    return dbapi.insertLabelingSession(
        datasetId,
        sessionJson.sessionType,
        newSessionName,
        sessionJson.prompt,
        sessionJson.labelOptions,
        sessionJson.comparisonSampling,
        JSON.stringify(metadataJson),
        slices,
        comparisons
    );
}
