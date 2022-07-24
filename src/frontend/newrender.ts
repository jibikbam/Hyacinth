import * as ImageLoad from './imageload';
import {LoadedImage} from './imageload';

const IMAGE_CACHE_SIZE = 3;
const IMAGE_CACHE: [string, LoadedImage][] = [];
export function loadCached(imagePath: string) {
    for (const [p, img] of IMAGE_CACHE) {
        if (p === imagePath) return img;
    }

    const image = ImageLoad.loadImage(imagePath);
    // Insert at index 0
    IMAGE_CACHE.splice(0, 0, [imagePath, image]);
    // Pop from end until queue is of correct length
    while (IMAGE_CACHE.length > IMAGE_CACHE_SIZE) IMAGE_CACHE.pop();

    return image;
}

function computePercentiles(pixelData: number[], q: number[]): number[] {
    const pixelDataSorted = pixelData.slice().sort((a, b) => a - b);
    return q.map(qVal => pixelDataSorted[Math.floor((pixelDataSorted.length - 1) * (qVal / 100))]);
}

function mapDims(ijk: [number, number, number], map: [number, number, number]): [number, number, number] {
    return [ijk[map[0]], ijk[map[1]], ijk[map[2]]];
}

function computeInverseDimMap(map: [number, number, number]): [number, number, number] {
    return [
        map.indexOf(0),
        map.indexOf(1),
        map.indexOf(2),
    ]
}

export function renderCanvas3D(canvas: HTMLCanvasElement, image: LoadedImage,
                               sliceDim: number, sliceIndex: number, brightness: number) {
    const imageData = image.imageData;
    const rawDims = image.dims;
    const dimMap = image.dimMap;
    const dimMapInverse = computeInverseDimMap(dimMap);

    const [iMax, jMax, kMax] = rawDims;
    const dims = mapDims(rawDims, dimMap);

    function getVoxelValue(i: number, j: number, k: number) {
        [i, j, k] = mapDims([i, j, k], dimMapInverse);
        return imageData[i + (j * iMax) + (k * iMax * jMax)];
    }

    function get2DIndex(x: number, y: number, xMax: number, yMax: number): number {
        if (image.flipY) y = (yMax - y - 1);
        return x + (y * xMax);
    }

    let width: number, height: number;
    let sliceData: number[];

    if (sliceDim === 0) {
        const [sliceMax, xMax, yMax] = [dims[0], dims[1], dims[2]];
        [width, height, sliceData] = [xMax, yMax, new Array(xMax * yMax)];

        for (let x = 0; x < xMax; x++) {
            for (let y = 0; y < yMax; y++) {
                sliceData[get2DIndex(x, y, xMax, yMax)] = getVoxelValue(sliceIndex, x, y);
            }
        }
    }
    else if (sliceDim === 1) {
        const [xMax, sliceMax, yMax] = [dims[0], dims[1], dims[2]];
        [width, height, sliceData] = [xMax, yMax, new Array(xMax * yMax)];

        for (let x = 0; x < xMax; x++) {
            for (let y = 0; y < yMax; y++) {
                sliceData[get2DIndex(x, y, xMax, yMax)] = getVoxelValue(x, sliceMax - sliceIndex, y);
            }
        }
    }
    else if (sliceDim === 2) {
        const [xMax, yMax, sliceMax] = [dims[0], dims[1], dims[2]];
        [width, height, sliceData] = [xMax, yMax, new Array(xMax * yMax)];

        for (let x = 0; x < xMax; x++) {
            for (let y = 0; y < yMax; y++) {
                sliceData[get2DIndex(x, y, xMax, yMax)] = getVoxelValue(x, y, sliceIndex);
            }
        }
    }

    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    const canvasImageData = context.createImageData(width, height);

    const [minValue, brightPctValue] = computePercentiles(sliceData, [0, brightness]);
    const toneMapDivisor = brightPctValue - minValue;

    for (let i = 0; i < sliceData.length; i++) {
        // Retrieve value and tone map to 8 bits (0-255)
        let value = sliceData[i];
        value = value - minValue;
        value = (value / toneMapDivisor) * 255;
        value = Math.min(value, 255);
        // Map 1D index to RGBA 1D index
        const canvasOffset = i * 4;
        // Write canvas image data (R G B A)
        canvasImageData.data[canvasOffset] = value & 0xFF;
        canvasImageData.data[canvasOffset + 1] = value & 0xFF;
        canvasImageData.data[canvasOffset + 2] = value & 0xFF;
        canvasImageData.data[canvasOffset + 3] = 0xFF;
    }

    context.putImageData(canvasImageData, 0, 0);
}

export function loadAndRender(canvas: HTMLCanvasElement, imagePath: string,
                       sliceDim: number, sliceIndex: number, brightness: number) {
    const image = loadCached(imagePath);
    renderCanvas3D(canvas, image, sliceDim, sliceIndex, brightness);
}
