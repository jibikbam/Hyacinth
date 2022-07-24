import {volumeapi} from './backend';
import * as Nifti from './parsers/nifti';

export type ImageDataTypedArray = Int16Array | Int32Array | Float32Array | Float64Array | Uint16Array | Uint32Array;

export interface LoadedImage {
    imageData: ImageDataTypedArray;
    dims: [number, number, number];
    dimMap: [number, number, number];
    flipY: boolean;
}

function computeDicomImagePlane(iop: [number, number, number, number, number, number]): 0 | 1 | 2 {
    const iopRounded = iop.map(v => Math.round(v));
    const [a1, a2, a3, b1, b2, b3] = iopRounded;
    // Compute cross product of iopRounded[0:3] and iopRounded[3:6]
    const iopCross = [
        a2 * b3 - a3 * b2,
        a3 * b1 - a1 * b3,
        a1 * b2 - a2 * b1
    ];
    const iopCrossAbs = iopCross.map(v => Math.abs(v));

    if (iopCrossAbs[0] === 1) return 0;  // Sagittal
    else if (iopCrossAbs[1] === 1) return 1;  // Coronal
    else if (iopCrossAbs[2] === 1) return 2;  // Axial
    else throw Error(`Unknown dicom image plane: ${iopCrossAbs}`);
}

function loadImage(imagePath: string): LoadedImage {
    if (imagePath.endsWith('.nii.gz')) {
        const [header, imageData] = Nifti.parse(imagePath);
        return {
            imageData: imageData,
            dims: header.dim.slice(1, 4) as [number, number, number],
            dimMap: [0, 1, 2],
            flipY: true,  // Nifti images are drawn bottom to top
        }
    }
    else if (imagePath.endsWith('.dcm')) {
        const [dims, imageData] = volumeapi.readDicom2d(imagePath);
        return {
            imageData: imageData,
            dims: [1, dims[0], dims[1]],
            dimMap: [0, 1, 2],
            flipY: false,
        }
    }
    else {
        const [dims, iop, imageData] = volumeapi.readDicomSeriesNew(imagePath);
        const imagePlane = computeDicomImagePlane(iop);

        let dimMap;
        if (imagePlane === 0) dimMap = [0, 1, 2];       // Sagittal
        else if (imagePlane === 1) dimMap = [1, 2, 0];  // Coronal
        else dimMap = [2, 0, 1];                        // Axial

        return {
            imageData: imageData,
            dims: dims,
            dimMap: dimMap,
            flipY: false,
        }
    }
}

const IMAGE_CACHE_SIZE = 3;
const IMAGE_CACHE: [string, LoadedImage][] = [];

export function loadCached(imagePath: string): LoadedImage {
    for (const [p, img] of IMAGE_CACHE) {
        if (p === imagePath) return img;
    }

    const image = loadImage(imagePath);
    // Insert at index 0
    IMAGE_CACHE.splice(0, 0, [imagePath, image]);
    // Pop from end until queue is of correct length
    while (IMAGE_CACHE.length > IMAGE_CACHE_SIZE) IMAGE_CACHE.pop();

    return image;
}
