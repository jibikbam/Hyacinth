import {volumeapi} from './backend';
import * as Nifti from './parsers/nifti';
import * as Render from './render';

type ImageType = 'Nifti3D' | 'DicomSeries3D' | 'Dicom2D';
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

function getDicomDimMap(iop): [number, number, number] {
    switch (computeDicomImagePlane(iop)) {
        case 0: return [0, 1, 2]; // Sagittal
        case 1: return [1, 2, 0]; // Coronal
        case 2: return [2, 0, 1]; // Axial
    }
}

function getImageType(imagePath: string): ImageType {
    if (imagePath.endsWith('.nii.gz')) return 'Nifti3D';
    else if (imagePath.endsWith('.dcm')) return 'Dicom2D';
    else return 'DicomSeries3D';
}

export function loadDims(imagePath: string): [number, number, number] {
    const imageType = getImageType(imagePath);
    switch (imageType) {
        case 'Nifti3D': {
            const imageHeader = volumeapi.readNiftiHeader(imagePath);
            return imageHeader.dims.slice(1, 4);
        }
        case 'DicomSeries3D': {
            const [dims, iop] = volumeapi.readDicomSeriesDims(imagePath);
            const dimMap = getDicomDimMap(iop);
            return Render.mapDims(dims, dimMap);
        }
        case 'Dicom2D': {
            const [dims, imageData] = volumeapi.readDicom2d(imagePath);
            return [1, dims[0], dims[1]];
        }
        default: throw new Error(`Unknown image type "${imageType}" for path: ${imagePath}`);
    }
}

function loadImage(imagePath: string): LoadedImage {
    const imageType = getImageType(imagePath);
    switch (imageType) {
        case 'Nifti3D': {
            const [header, imageData] = Nifti.parse(imagePath);
            return {
                imageData: imageData,
                dims: header.dim.slice(1, 4) as [number, number, number],
                dimMap: [0, 1, 2],
                flipY: true,  // Nifti images are drawn bottom to top
            }
        }
        case 'DicomSeries3D': {
            const [dims, iop, imageData] = volumeapi.readDicomSeriesNew(imagePath);
            const dimMap = getDicomDimMap(iop);
            return {
                imageData: imageData,
                dims: dims,
                dimMap: dimMap,
                flipY: false,
            }
        }
        case 'Dicom2D': {
            const [dims, imageData] = volumeapi.readDicom2d(imagePath);
            return {
                imageData: imageData,
                dims: [1, dims[0], dims[1]],
                dimMap: [0, 1, 2],
                flipY: false,
            }
        }
        default: throw new Error(`Unknown image type "${imageType}" for path: ${imagePath}`);
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
