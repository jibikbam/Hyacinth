import {dbapi} from './backend';

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
