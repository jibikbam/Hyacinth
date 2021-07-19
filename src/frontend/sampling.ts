import {DatasetImage, Orientation, SliceAttributes, volumeapi} from './backend';

function randomInt(max: number) {
    return Math.floor(Math.random() * max);
}

function sampleWithReplacement<Type>(arr: Type[], count: number): Type[] {
    const sampled: Type[] = [];
    for (let i = 0; i < count; i++) {
        const ind = randomInt(arr.length);
        sampled.push(arr[ind]);
    }
    return sampled;
}

function sampleSlices(images: DatasetImage[], imageCount: number, sliceCount: number,
                      orientation: Orientation, sliceMinPct: number, sliceMaxPct: number): SliceAttributes[] {
    const sampledImages = sampleWithReplacement(images, imageCount);
    const sampledImageSliceCounts: number[] = [];

    for (const img of sampledImages) {
        const imageHeader = volumeapi.readNiftiHeader(img.datasetRootPath + '/' + img.relPath);
        const sliceCount: number = imageHeader.dims[3]; // TODO: handle orientation
        sampledImageSliceCounts.push(sliceCount);
    }

    const slices: SliceAttributes[] = [];
    while (slices.length < sliceCount) {
        const randomIndex = randomInt(imageCount);
        const slice: SliceAttributes = {
            imageId: sampledImages[randomIndex].id,
            sliceIndex: randomInt(sampledImageSliceCounts[randomIndex]),
            orientation: orientation,
        }

        let alreadySampled = false;
        for (const sl of slices) {
            if (sl.imageId === slice.imageId && sl.sliceIndex === slice.sliceIndex) alreadySampled = true;
        }
        if (!alreadySampled) slices.push(slice);
    }

    return slices;
}

export {sampleSlices};
