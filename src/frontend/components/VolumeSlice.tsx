import * as React from 'react';
import {useEffect, useRef, useState} from 'react';
import {volumeapi} from '../backend';

function drawSlice(canvas: HTMLCanvasElement, imageHeader, imageData, sliceIndex, brightness, sliceDim) {
    const dims = imageHeader.dims.slice(1, 4);
    const xMax = dims[sliceDim];
    const yMax = dims[(sliceDim + 1) % 3];

    canvas.width = yMax;
    canvas.height = xMax;
    const context = canvas.getContext('2d');
    const canvasImageData = context.createImageData(canvas.width, canvas.height);

    let maxValue = 0;
    for (const v of imageData) {
        if (v > maxValue) maxValue = v;
    }
    maxValue = maxValue * ((100 - brightness) / 100);

    for (let x = 0; x < xMax; x++) {
        for (let y = 0; y < yMax; y++) {
            let ijk: number[];
            switch (sliceDim) {
                case 0:
                    ijk = [x, y, sliceIndex];
                    break;
                case 1:
                    ijk = [sliceIndex, x, y];
                    break;
                case 2:
                    ijk = [y, sliceIndex, x];
                    break;
            }

            const dim1Offset = ijk[0];
            const dim2Offset = ijk[1] * dims[0];
            const dim3Offset = ijk[2] * dims[0] * dims[1];
            const volOffset = dim1Offset + dim2Offset + dim3Offset;

            let value = imageData[volOffset];
            value = (value / maxValue) * 255;
            value = Math.min(value, 255);

            const xOffset = x * yMax;
            const yOffset = y;
            const drawOffset = xOffset + yOffset;

            const canvasOffset = drawOffset * 4;
            // R G B A
            canvasImageData.data[canvasOffset] = value & 0xFF;
            canvasImageData.data[canvasOffset + 1] = value & 0xFF;
            canvasImageData.data[canvasOffset + 2] = value & 0xFF;
            canvasImageData.data[canvasOffset + 3] = 0xFF;
        }
    }

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
            drawSlice(canvasRef.current, image.header, image.data, sliceIndex, brightness, sliceDim);
        }
    }, [image, sliceIndex, sliceDim, brightness]);

    return <canvas style={{height: '80vh'}} ref={canvasRef} width={0} height={0} />
}

export {VolumeSlice};
