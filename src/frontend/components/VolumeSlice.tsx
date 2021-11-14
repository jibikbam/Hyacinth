import * as React from 'react';
import {useEffect, useMemo, useRef, useState} from 'react';
import {volumeapi} from '../backend';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-cpu';

function flip(shouldFlip: boolean, val: number, valMax: number) {
    return (shouldFlip)
        ? valMax - val - 1
        : val;
}

function drawSlice(canvas: HTMLCanvasElement, imageHeader, imageData, sliceDim: number, sliceIndex: number, brightness: number,
                   hFlip: boolean, vFlip: boolean) {
    // Get image dims 1-3 (dim[0] in the Nifti format stores the number of dimensions)
    const dims: number[] = imageHeader.dims.slice(1, 4);

    // Flip scrubbing direction for sagittal
    if (sliceDim === 0) sliceIndex = dims[0] - sliceIndex - 1;
    // Clamp out of bounds slice index
    sliceIndex = Math.max(Math.min(sliceIndex, dims[sliceDim] - 1), 0);

    // Convert to Int32 because TF tensors do not accept Int16
    const imageData32 = new Int32Array(imageData);
    // Create tensor and reshape to 3D (need to reverse dims for correct order)
    const image1d = tf.tensor1d(imageData32);
    const image3d = tf.reshape(image1d, dims.reverse());

    // Slice RAS+ data along sliceDim
    let imSlice;
    switch (sliceDim) {
        case 0: imSlice = tf.slice(image3d, [0, 0, sliceIndex], [-1, -1, 1]); break;
        case 1: imSlice = tf.slice(image3d, [0, sliceIndex, 0], [-1, 1, -1]); break;
        case 2: imSlice = tf.slice(image3d, [sliceIndex, 0, 0], [1, -1, -1]); break;
    }
    imSlice = tf.squeeze(imSlice);
    // Flip as needed to display RAS+
    if (hFlip !== (sliceDim === 1 || sliceDim === 2)) imSlice = tf.reverse(imSlice, 1);
    if (!vFlip) imSlice = tf.reverse(imSlice, 0);
    // Convert to JS array for indexing
    const sliceData = imSlice.arraySync() as number[][];

    // Define xMax and yMax (#cols and #rows)
    // Note that dims were reversed at tensor creation
    const xMax = imSlice.shape[1], yMax = imSlice.shape[0];

    // Update canvas size and initialize ImageData array
    canvas.width = xMax;
    canvas.height = yMax;
    const context = canvas.getContext('2d');
    const canvasImageData = context.createImageData(canvas.width, canvas.height);

    // Compute max value of image for tone mapping (and adjust for brightness)
    let maxValue = tf.max(image3d).arraySync() as number;
    maxValue = maxValue * ((100 - brightness) / 100);

    // x and y are in 2D output space
    for (let x = 0; x < xMax; x++) {
        for (let y = 0; y < yMax; y++) {
            // Get value and tone map to 8 bits (0-255)
            // (uses maxValue computed earlier with brightness)
            let value = sliceData[y][x];  // Note reversed dims as mentioned above
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
}

function VolumeSlice({imagePath, sliceDim, sliceIndex, brightness, hFlip = false, vFlip = false}: VolumeSliceProps) {
    const canvasRef = useRef(null);

    const image = useMemo(() => {
        const [imageHeader, imageData] = volumeapi.readNifti(imagePath);
        return {
            header: imageHeader,
            data: imageData
        };
    }, [imagePath]);

    useEffect(() => {
        if (image) {
            drawSlice(canvasRef.current, image.header, image.data, sliceDim, sliceIndex, brightness, hFlip, vFlip);
        }
    }, [image, sliceDim, sliceIndex, brightness, hFlip, vFlip]);

    return <canvas className="w-full h-full" ref={canvasRef} width={0} height={0} />
}

export {VolumeSlice};
