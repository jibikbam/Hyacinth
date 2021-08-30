import * as React from 'react';
import {useEffect, useRef, useState} from 'react';
import {volumeapi} from '../backend';

function drawSlice(canvas: HTMLCanvasElement, imageHeader, imageData, sliceIndex: number, sliceDim: number, brightness: number) {
    // Get image dims 1-3 (dim[0] in the Nifti format stores the number of dimensions)
    const dims: number[] = imageHeader.dims.slice(1, 4);

    // Map x / y / sliceIndex sizes (from 2D output space) to i / j / k dimension sizes
    // sliceDim is the dimension which will be varied (sliceIndex / sliceMax)
    // i.e. when sliceDim is 0, dims[0] (left to Right) is varied, producing Sagittal slices
    // This function assumes RAS+ Nifti data, and displays this data raw (affine is NOT used!)
    let xMax: number, yMax: number, sliceMax: number;
    switch(sliceDim) {
        case 0:
            [xMax, yMax, sliceMax] = [dims[2], dims[1], dims[0]];
            break;
        case 1:
            [xMax, yMax, sliceMax] = [dims[0], dims[2], dims[1]];
            break;
        case 2:
            [xMax, yMax, sliceMax] = [dims[0], dims[1], dims[2]];
            break;
    }

    // Update canvas size and initialize ImageData array
    canvas.width = xMax;
    canvas.height = yMax;
    const context = canvas.getContext('2d');
    const canvasImageData = context.createImageData(canvas.width, canvas.height);

    // Compute max value of image for tone mapping (and adjust for brightness)
    let maxValue: number = 0;
    for (const v of imageData) {
        if (v > maxValue) maxValue = v;
    }
    maxValue = maxValue * ((100 - brightness) / 100);

    // x and y are in 2D output space
    for (let x = 0; x < xMax; x++) {
        for (let y = 0; y < yMax; y++) {
            // Map x / y / sliceIndex to i / j / k space
            let ijk: number[];
            switch (sliceDim) {
                case 0:
                    ijk = [sliceMax - sliceIndex - 1, x, yMax - y - 1];
                    break;
                case 1:
                    ijk = [xMax - x - 1, sliceIndex, yMax - y - 1];
                    break;
                case 2:
                    ijk = [xMax - x - 1, yMax - y - 1, sliceIndex];
                    break;
            }

            // Map i / j / k to the Nifti 1D data array
            const dim1Offset = ijk[0];
            const dim2Offset = ijk[1] * dims[0];
            const dim3Offset = ijk[2] * dims[0] * dims[1];
            const volOffset = dim1Offset + dim2Offset + dim3Offset;

            // Get value and tone map to 8 bits (0-255)
            // (uses maxValue computed earlier with brightness)
            let value = imageData[volOffset];
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

function VolumeSlice({imagePath, sliceIndex, sliceDim = 0, brightness}: {imagePath: string, sliceIndex: number, sliceDim?: number, brightness: number}) {
    const [image, setImage] = useState(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        const [imageHeader, imageData] = volumeapi.readNifti(imagePath);
        setImage({
            header: imageHeader,
            data: imageData
        })
    }, []);

    useEffect(() => {
        if (image) {
            drawSlice(canvasRef.current, image.header, image.data, sliceIndex, sliceDim, brightness);
        }
    }, [image, sliceIndex, sliceDim, brightness]);

    return <canvas style={{height: '80vh'}} ref={canvasRef} width={0} height={0} />
}

export {VolumeSlice};
