import * as React from 'react';
import {useEffect, useRef, useState} from 'react';
import {volumeapi} from '../backend';

function drawSlice(canvas: HTMLCanvasElement, imageHeader, imageData, sliceIndex, brightness) {
    const rows = imageHeader.dims[1];
    const cols = imageHeader.dims[2];

    const sliceSize = rows * cols;
    const sliceOffset = sliceSize * sliceIndex;

    const context = canvas.getContext('2d');
    const canvasImageData = context.createImageData(canvas.width, canvas.height);

    let maxValue = 0;
    for (const v of imageData) {
        if (v > maxValue) maxValue = v;
    }
    maxValue = maxValue * ((100 - brightness) / 100);

    for (let row = 0; row < rows; row++) {
        const rowOffset = row * cols;
        for (let col = 0; col < cols; col++) {
            const imageOffset = sliceOffset + rowOffset + col;
            let value = imageData[imageOffset];
            value = (value / maxValue) * 255;
            value = Math.min(value, 255);

            const canvasOffset = (rowOffset + col) * 4;
            // R G B A
            canvasImageData.data[canvasOffset] = value & 0xFF;
            canvasImageData.data[canvasOffset + 1] = value & 0xFF;
            canvasImageData.data[canvasOffset + 2] = value & 0xFF;
            canvasImageData.data[canvasOffset + 3] = 0xFF;
        }
    }

    context.putImageData(canvasImageData, 0, 0);
}

function VolumeSlice({imagePath, sliceIndex, brightness}: {imagePath: string, sliceIndex: number, brightness: number}) {
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
            drawSlice(canvasRef.current, image.header, image.data, sliceIndex, brightness);
        }
    }, [image, sliceIndex, brightness]);

    return <canvas style={{height: '80vh'}} ref={canvasRef} width={image ? image.header.dims[1] : 100} height={image ? image.header.dims[2] : 100} />
}

export {VolumeSlice};
