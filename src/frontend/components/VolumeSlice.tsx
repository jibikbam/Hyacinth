import * as React from 'react';
import {useEffect, useMemo, useRef} from 'react';
import {volumeapi} from '../backend';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import {Rank, Tensor3D} from '@tensorflow/tfjs';

function imageDataTo3d(dims: [number, number, number], imageDataArray: Int32Array | Float32Array): Tensor3D {
    // Create tensor and reshape to 3D (need to reverse dims for correct order)
    const image1d = tf.tensor1d(imageDataArray);
    return tf.reshape<Rank.R3>(image1d, dims.slice().reverse() as [number, number, number]);
}

function loadVolume(imagePath: string): Tensor3D {
    if (imagePath.endsWith('.nii.gz')) {
        // Load nifti
        const [imageHeader, imageData] = volumeapi.readNifti(imagePath);

        // Get image dims 1-3 (dim[0] in the Nifti format stores the number of dimensions)
        const dims: [number, number, number] = imageHeader.dims.slice(1, 4);

        // Convert to Int32 because TF tensors do not accept Int16
        const imageDataArray = new Int32Array(imageData);
        let image3d = imageDataTo3d(dims, imageDataArray);
        // Reorder axes
        image3d = tf.transpose(image3d, [2, 1, 0])
        // Flip for display
        image3d = tf.reverse(image3d, 1);
        image3d = tf.reverse(image3d, 2);
        return image3d;
    }
    else {
        // Load dicom series
        const [dims, imageData] = volumeapi.readDicomSeries(imagePath);
        let image3d = imageDataTo3d(dims, imageData);
        // Reorder axes
        image3d = tf.transpose(image3d, [0, 2, 1]);
        return image3d;
    }
}

function drawSlice(canvas: HTMLCanvasElement, image3d: Tensor3D, sliceDim: number, sliceIndex: number, brightness: number,
                   hFlip: boolean, vFlip: boolean, tFlip: boolean) {
    const dims = image3d.shape;
    // Clamp out of bounds slice index
    sliceIndex = Math.max(Math.min(sliceIndex, dims[sliceDim] - 1), 0);

    // Slice RAS+ data along sliceDim
    let imSlice;
    switch (sliceDim) {
        case 0: imSlice = tf.slice(image3d, [sliceIndex, 0, 0], [1, -1, -1]); break;
        case 1: imSlice = tf.slice(image3d, [0, sliceIndex, 0], [-1, 1, -1]); break;
        case 2: imSlice = tf.slice(image3d, [0, 0, sliceIndex], [-1, -1, 1]); break;
    }
    imSlice = tf.squeeze(imSlice);
    // Apply flips
    if (hFlip) imSlice = tf.reverse(imSlice, 1);
    if (vFlip) imSlice = tf.reverse(imSlice, 0);
    if (tFlip) imSlice = tf.transpose(imSlice);
    // Convert to JS array for indexing
    const sliceData = imSlice.arraySync() as number[][];

    // Define xMax and yMax (#cols and #rows)
    const xMax = imSlice.shape[0], yMax = imSlice.shape[1];

    // Update canvas size and initialize ImageData array
    canvas.width = xMax;
    canvas.height = yMax;
    const context = canvas.getContext('2d');
    const canvasImageData = context.createImageData(canvas.width, canvas.height);

    // Compute max value of image for tone mapping (and adjust for brightness)
    let minValue = tf.min(image3d).arraySync() as number;
    let maxValue = (tf.max(image3d).arraySync() as number) - minValue;
    maxValue = maxValue * ((100 - brightness) / 100);

    // x and y are in 2D output space
    for (let x = 0; x < xMax; x++) {
        for (let y = 0; y < yMax; y++) {
            // Get value and tone map to 8 bits (0-255)
            // (uses maxValue computed earlier with brightness)
            let value = sliceData[x][y];
            value = value - minValue;
            value = (value / maxValue) * 255;
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

    // Write image data to canvas
    context.putImageData(canvasImageData, 0, 0);
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

    const image = useMemo(() => {
        return loadVolume(imagePath);
    }, [imagePath]);

    useEffect(() => {
        if (image) {
            drawSlice(canvasRef.current, image, sliceDim, sliceIndex, brightness, hFlip, vFlip, transpose);
        }
    }, [image, sliceDim, sliceIndex, brightness, hFlip, vFlip, transpose]);

    return <canvas className="w-full h-full" ref={canvasRef} width={0} height={0} />
}

export {VolumeSlice};
