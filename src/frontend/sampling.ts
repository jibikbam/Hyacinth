import {DatasetImage, SliceAttributes, volumeapi} from './backend';
import {rotateDicomAxes} from './components/VolumeSlice';

function randomInt(max: number) {
    return Math.floor(Math.random() * max);
}

// Fisher-Yates, but partial - we only shuffle as many items as we need.
// Note that in the full shuffle case (count == arr.length), a redundant swap (0 -> 0) is performed
// at the end of the loop. This is avoided in the traditional Fisher-Yates by an "i > 0" clause in the for loop,
// however, when (count < arr.length), the last swap is NO LONGER redundant, so we must include it
// for partial shuffling via the "i > (arr.length - count - 1)" clause in the for loop.
function sampleWithoutReplacement<Type>(arr: Type[], count: number): Type[] {
    if (count === 0) throw new Error(`Can't sample 0 elements`)
    if (count > arr.length) throw new Error(`Can't sample ${count} elements from an array of length ${arr.length}`)

    for (let i = arr.length - 1; i > (arr.length - count - 1); i--) {
        const j = randomInt(i + 1);

        const swap = arr[j];
        arr[j] = arr[i];
        arr[i] = swap;
    }

    return arr.slice(arr.length - count, arr.length);
}

function doImageSample(images: DatasetImage[], imageCount: number): DatasetImage[] {
    const imagesCopy = images.slice();
    return sampleWithoutReplacement(imagesCopy, imageCount);
}

function loadSliceCount(image: DatasetImage, sliceDim: number): number {
    if (sliceDim < 0 || sliceDim > 2) throw new Error(`Invalid sliceDim ${sliceDim}`);

    const imagePath = image.datasetRootPath + '/' + image.relPath;
    // TODO: better way to distinguish image types
    if (imagePath.endsWith('.dcm')) {
        return 1;
    }
    else if (imagePath.endsWith('.nii.gz')) {
        const imageHeader = volumeapi.readNiftiHeader(image.datasetRootPath + '/' + image.relPath);
        return imageHeader.dims[sliceDim + 1]; // dim[0] in Nifti header stores number of dimensions
    }
    else {
        let [dims, iop] = volumeapi.readDicomSeriesDims(imagePath);
        // Correct dim order to match order when loading dicom (note that dims are reversed in loading code)
        dims = rotateDicomAxes(dims, iop) as [number, number, number];
        return dims[sliceDim];
    }
}

function doSliceSample(images: {image: DatasetImage, sliceCount: number}[],
                       sliceDim: number, sliceMinPct: number, sliceMaxPct: number,
                       sliceCount: number) {
    const possibleSlices: SliceAttributes[] = [];
    for (const {image, sliceCount} of images) {
        const minSlice = Math.floor(sliceCount * (sliceMinPct / 100));
        const maxSlice = Math.floor(sliceCount * (sliceMaxPct / 100));
        for (let i = minSlice; i < maxSlice; i++) {
            possibleSlices.push({
                imageId: image.id,
                sliceDim: sliceDim,
                sliceIndex: i,
            });
        }
    }

    if (sliceCount > possibleSlices.length) sliceCount = possibleSlices.length;
    return sampleWithoutReplacement(possibleSlices, sliceCount);
}

export function sampleSlices(images: DatasetImage[], imageCount: number, sliceCount: number,
                      sliceDim: number, sliceMinPct: number, sliceMaxPct: number): SliceAttributes[] {
    const startMs = Date.now();

    let curMs = Date.now();
    const sampledImages = doImageSample(images, imageCount);
    console.log(`Sampled ${sampledImages.length} images in ${Date.now() - curMs}ms`);

    curMs = Date.now();
    const imagesWithCounts = sampledImages.map(img => ({image: img, sliceCount: loadSliceCount(img, sliceDim)}))
    console.log(`Loaded ${imagesWithCounts.length} slice counts in ${Date.now() - curMs}ms`);

    curMs = Date.now();
    const slices = doSliceSample(imagesWithCounts, sliceDim, sliceMinPct, sliceMaxPct, sliceCount);
    console.log(`Sampled ${slices.length} slices in ${Date.now() - curMs}ms`);
    console.log(`Finished sampling slices in ${Date.now() - startMs}ms`);
    return slices;
}

export function sampleComparisons(sliceCount: number, comparisonCount: number): number[][] {
    const startMs = Date.now();

    let curMs = Date.now();
    const combinations = [];
    for (let i = 0; i < sliceCount - 1; i++) {
        for (let j = i + 1; j < sliceCount - 1; j++) {
            combinations.push([i, j]);
        }
    }
    console.log(`Generated ${combinations.length} combinations in ${Date.now() - curMs}ms`);

    curMs = Date.now();
    const comparisons = sampleWithoutReplacement(combinations, comparisonCount);
    console.log(`Sampled ${comparisons.length} comparisons in ${Date.now() - curMs}ms`);
    console.log(`Finished sampling comparisons in ${Date.now() - startMs}ms`);
    return comparisons;
}
