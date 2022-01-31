import {volumeapi} from './backend';
import * as tf from '@tensorflow/tfjs-core';
import {Rank, Tensor3D} from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';

type ImageType = 'Nifti3D' | 'DicomSeries3D' | 'Dicom2D';

interface LoadedImage {
    image2d?: number[][];
    image3d?: Tensor3D;

    is3d: boolean;
    pixelsBottomUp: boolean;
    imageType: ImageType;
}

function getImageType(imagePath: string): ImageType {
    if (imagePath.endsWith('.dcm')) return 'Dicom2D';
    else if (imagePath.endsWith('.nii.gz')) return 'Nifti3D';
    return 'DicomSeries3D';
}

function rightRotateArray<T>(arr: T[], count: number): T[] {
    const newArr = new Array(arr.length);
    for (let i = 0; i < arr.length; i++) {
        const newIndex = (i + count) % arr.length;
        newArr[newIndex] = arr[i];
    }
    return newArr;
}


function reverseDims(dims: [number, number, number]): [number, number, number] {
    return dims.slice().reverse() as [number, number, number];
}

function computeDicomImagePlane(iop: [number, number, number, number, number, number]): number {
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

export function rotateDicomAxes(axes: number[], iop: [number, number, number, number, number, number]): number[] {
    return rightRotateArray(axes, computeDicomImagePlane(iop) + 1);
}

function reshape2d(dims: [number, number], imageData: Float32Array): number[][] {
    const outerArray = new Array(dims[0]);
    for (let x = 0; x < dims[0]; x++) {
        const innerArray = new Array(dims[1]);
        for (let y = 0; y < dims[1]; y++) {
            const xOffset = x;
            const yOffset = y * dims[0];
            innerArray[y] = imageData[xOffset + yOffset];
        }
        outerArray[x] = innerArray;
    }
    return outerArray;
}

function loadNifti3d(imagePath: string): LoadedImage {
    const [imageHeader, imageData] = volumeapi.readNifti(imagePath);

    // Get image dims 1-3 (dim[0] in the Nifti format stores the number of dimensions)
    const dims: [number, number, number] = imageHeader.dims.slice(1, 4);

    // Convert to Int32 because TF tensors do not accept Int16
    const imageDataArray = new Int32Array(imageData);

    const image3d = tf.tidy(() => {
        // Convert to 3D
        const im1d = tf.tensor1d(imageDataArray);
        let im3d = tf.reshape<Rank.R3>(im1d, reverseDims(dims));
        // Reorder axes (undoes dim reversal which is needed for reshape)
        im3d = tf.transpose(im3d, [2, 1, 0]);
        return im3d;
    });

    return {image3d, is3d: true, pixelsBottomUp: true, imageType: 'Nifti3D'};
}

function loadDicomSeries3d(imagePath: string): LoadedImage {
    const [dims, iop, imageDataArray] = volumeapi.readDicomSeries(imagePath);

    const image3d = tf.tidy(() => {
        // Convert to 3D
        const im1d = tf.tensor1d(imageDataArray);
        let im3d = tf.reshape<Rank.R3>(im1d, reverseDims(dims));
        // Reorder axes (undoes dim reversal which is needed for reshape)
        im3d = tf.transpose(im3d, [2, 1, 0]);

        // Right-rotate axes to correct order based on the image plane of the DICOM
        // Ensures axes are always [Sagittal, Coronal, Axial]
        const newOrder = rotateDicomAxes([0, 1, 2], iop);
        // Optimization: if newOrder is [0, 1, 2], transpose would do nothing
        if (newOrder[0] !== 0 || newOrder[1] !== 1 || newOrder[2] !== 2) im3d = tf.transpose(im3d, newOrder);

        return im3d;
    });

    return {image3d, is3d: true, pixelsBottomUp: false, imageType: 'DicomSeries3D'};
}

function loadDicom2d(imagePath: string): LoadedImage {
    const [dims, imageData] = volumeapi.readDicom2d(imagePath);
    const image2d = reshape2d(dims, imageData);

    return {image2d, is3d: false, pixelsBottomUp: false, imageType: 'Dicom2D'};
}

function loadImage(imagePath: string): LoadedImage {
    const imageType = getImageType(imagePath);
    switch (imageType) {
        case 'Nifti3D': return loadNifti3d(imagePath);
        case 'DicomSeries3D': return loadDicomSeries3d(imagePath);
        case 'Dicom2D': return loadDicom2d(imagePath);
    }
}

// Implements an LRU cache for image data
const IMAGE_CACHE_SIZE = 3;
const IMAGE_CACHE: [string, LoadedImage][] = [];
export function loadImageCached(imagePath: string): LoadedImage {
    for (const [p, img] of IMAGE_CACHE) {
        if (p === imagePath) return img;
    }

    const image = loadImage(imagePath);
    // Insert at index 0
    IMAGE_CACHE.splice(0, 0, [imagePath, image]);
    // Pop from end until queue is of correct length
    while (IMAGE_CACHE.length > IMAGE_CACHE_SIZE) {
        const [_, img] = IMAGE_CACHE.pop();
        tf.dispose(img.image3d); // Dispose of old tensors
    }

    return image;
}

export function sliceVolume(image: LoadedImage, sliceDim: number, sliceIndex: number,
                   hFlip: boolean, vFlip: boolean, tFlip: boolean): number[][] {
    const image3d = image.image3d;
    const dims = image3d.shape;

    // Nifti pixel data is stored bottom-up instead of top-down, so we vertically flip the 2D slices
    // (equivalent to drawing from the bottom up)
    if (image.pixelsBottomUp) vFlip = !vFlip;

    // Clamp slice index to prevent any out of bounds errors
    sliceIndex = Math.max(Math.min(sliceIndex, dims[sliceDim] - 1), 0);

    return tf.tidy(() => {
        // Slice RAS data along sliceDim
        let imSlice;
        switch (sliceDim) {
            case 0: imSlice = tf.slice(image3d, [sliceIndex, 0, 0], [1, -1, -1]); break;
            case 1: imSlice = tf.slice(image3d, [0, sliceIndex, 0], [-1, 1, -1]); break;
            case 2: imSlice = tf.slice(image3d, [0, 0, sliceIndex], [-1, -1, 1]); break;
        }
        imSlice = tf.squeeze(imSlice);
        // Apply flips
        if (hFlip) imSlice = tf.reverse(imSlice, 0);
        if (vFlip) imSlice = tf.reverse(imSlice, 1);
        if (tFlip) imSlice = tf.transpose(imSlice);
        // Convert to JS array for indexing
        return imSlice.arraySync() as number[][];
    });
}

export function renderToCanvas(canvas: HTMLCanvasElement, imageData: number[][], brightness: number) {
    // Define xMax and yMax (#cols and #rows)
    const xMax = imageData.length, yMax = imageData[0].length;

    // Update canvas size and initialize ImageData array
    canvas.width = xMax;
    canvas.height = yMax;
    const context = canvas.getContext('2d');
    const canvasImageData = context.createImageData(canvas.width, canvas.height);

    // Compute min and max imageData values for tone mapping
    let minValue = imageData[0][0];
    let maxValue = imageData[0][0];
    for (let x = 0; x < xMax; x++) {
        for (let y = 0; y < yMax; y++) {
            const v = imageData[x][y];
            if (v < minValue) minValue = v;
            if (v > maxValue) maxValue = v;
        }
    }
    const maxLessMin = maxValue - minValue;
    const toneMapDivisor = maxLessMin * ((100 - brightness) / 100);

    // Render imageData to canvas
    for (let x = 0; x < xMax; x++) {
        for (let y = 0; y < yMax; y++) {
            // Get value and tone map to 8 bits (0-255)
            // (uses maxValue computed earlier with brightness)
            let value = imageData[x][y];
            value = value - minValue;
            value = (value / toneMapDivisor) * 255;
            value = Math.min(value, 255);

            // Map x and y to 1D canvas array
            const xOffset = x;
            const yOffset = y * xMax;
            const drawOffset = xOffset + yOffset;

            // Map 1D index to RGBA 1D index
            const canvasOffset = drawOffset * 4;
            // Write canvas image data (R G B A)
            canvasImageData.data[canvasOffset] = value & 0xFF;
            canvasImageData.data[canvasOffset + 1] = value & 0xFF;
            canvasImageData.data[canvasOffset + 2] = value & 0xFF;
            canvasImageData.data[canvasOffset + 3] = 0xFF;
        }
    }
    context.putImageData(canvasImageData, 0, 0);
}

export function clearCanvas(canvasEl: HTMLCanvasElement) {
    const context = canvasEl.getContext('2d');
    context.clearRect(0, 0, canvasEl.width, canvasEl.height);
}
