import {volumeapi} from './backend';
import * as Nifti from './parsers/nifti';

export type ImageDataTypedArray = Int16Array | Int32Array | Float32Array | Float64Array | Uint16Array | Uint32Array;

export interface LoadedImage {
    imageData: ImageDataTypedArray;
    dims: [number, number, number] | [number, number];
}

export function loadImage(imagePath: string): LoadedImage {
    if (imagePath.endsWith('.nii.gz')) {
        const [header, imageData] = Nifti.parse(imagePath);
        return {
            imageData: imageData,
            dims: header.dim.slice(1, 4) as [number, number, number],
        }
    }
    else if (imagePath.endsWith('.dcm')) {
        const [dims, imageData] = volumeapi.readDicom2d(imagePath);
        return {
            imageData: imageData,
            dims: dims,
        }
    }
    else {
        const [dims, iop, imageData] = volumeapi.readDicomSeries(imagePath);
        return {
            imageData: imageData,
            dims: dims,
        }
    }
}
