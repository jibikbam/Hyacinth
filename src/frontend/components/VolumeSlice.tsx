import * as React from 'react';
import {useEffect, useRef, useState} from 'react';
import {volumeapi} from '../backend';
import * as tf from '@tensorflow/tfjs-core';
import {Rank, Tensor3D} from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';

type ImageType = 'Nifti' | 'DICOM';

interface ImageVolume {
    image3d: Tensor3D;
    imageType: ImageType;
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

function loadVolume(imagePath: string): ImageVolume {
    // TODO: better way to distinguish nifti and dicom
    if (imagePath.endsWith('.nii.gz')) {
        // Load nifti
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
        return {image3d, imageType: 'Nifti'};
    }
    else {
        // Load dicom series
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
        return {image3d, imageType: 'DICOM'};
    }
}

// Implements an LRU cache for image volumes
const IMAGE_CACHE_SIZE = 3;
const IMAGE_CACHE: [string, ImageVolume][] = [];
function loadVolumeCached(imagePath: string): ImageVolume {
    for (const [p, img] of IMAGE_CACHE) {
        if (p === imagePath) return img;
    }

    const image = loadVolume(imagePath);
    // Insert at index 0
    IMAGE_CACHE.splice(0, 0, [imagePath, image]);
    // Pop from end until queue is of correct length
    while (IMAGE_CACHE.length > IMAGE_CACHE_SIZE) {
        const [_, img] = IMAGE_CACHE.pop();
        tf.dispose(img.image3d); // Dispose of old tensors
    }

    return image;
}

function sliceVolume(image: ImageVolume, sliceDim: number, sliceIndex: number,
                   hFlip: boolean, vFlip: boolean, tFlip: boolean): number[][] {
    const {image3d, imageType} = image;
    const dims = image3d.shape;

    // Nifti pixel data is stored bottom-up instead of top-down, so we vertically flip the 2D slices
    // (equivalent to drawing from the bottom up)
    if (imageType === 'Nifti') vFlip = !vFlip;

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

function renderToCanvas(canvas: HTMLCanvasElement, imageData: number[][], brightness: number) {
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

function drawImage2d(dims: [number, number], imageData: Float32Array, canvas: HTMLCanvasElement) {
    // TODO: clean up this function
    // Update canvas size and initialize ImageData array
    canvas.width = dims[0];
    canvas.height = dims[1];
    const context = canvas.getContext('2d');
    const canvasImageData = context.createImageData(canvas.width, canvas.height);

    let maxValue = 0;
    for (let i = 0; i < imageData.length; i++) {
        const v = imageData[i];
        if (v > maxValue) maxValue = v;
    }

    for (let i = 0; i < imageData.length; i++) {
        let value = imageData[i];
        value = (value / maxValue) * 255;

        const canvasOffset = i * 4;

        // Write canvas image data (R G B A)
        canvasImageData.data[canvasOffset] = value & 0xFF;
        canvasImageData.data[canvasOffset + 1] = value & 0xFF;
        canvasImageData.data[canvasOffset + 2] = value & 0xFF;
        canvasImageData.data[canvasOffset + 3] = 0xFF;
    }

    context.putImageData(canvasImageData, 0, 0);
}

function clearCanvas(canvasEl: HTMLCanvasElement) {
    const context = canvasEl.getContext('2d');
    context.clearRect(0, 0, canvasEl.width, canvasEl.height);
}

interface VolumeSliceProps {
    imagePath: string;
    sliceDim: number;
    sliceIndex: number;
    brightness: number;
    hFlip?: boolean;
    vFlip?: boolean;
    transpose?: boolean;
}

function VolumeSlice({imagePath, sliceDim, sliceIndex, brightness, hFlip = false, vFlip = false, transpose = false}: VolumeSliceProps) {
    const canvasRef = useRef(null);
    const [curImagePath, setCurImagePath] = useState<string | null>(null);

    function draw() {
        // TODO: clean this up
        if (imagePath.endsWith('.dcm')) {
            const [dims, imageData] = volumeapi.readDicom2d(imagePath);
            drawImage2d(dims, imageData, canvasRef.current);
            return;
        }
        const image3d = loadVolumeCached(imagePath);
        const slice = sliceVolume(image3d, sliceDim, sliceIndex, hFlip, vFlip, transpose);
        renderToCanvas(canvasRef.current, slice, brightness);
    }

    useEffect(() => {
        // If we are loading a different image, clear the canvas to act as a simple loading indicator
        if (curImagePath !== imagePath) {
            clearCanvas(canvasRef.current);
            setTimeout(draw, 100); // Timeout required so empty canvas is rendered
        }
        else {
            draw();
        }
        setCurImagePath(imagePath);
    }, [imagePath, sliceDim, sliceIndex, brightness, hFlip, vFlip, transpose]);

    return (
        <div className="w-full h-full bg-black">
            <canvas className="w-full h-full" ref={canvasRef} width={0} height={0} />
        </div>
    )

}

export {VolumeSlice};
