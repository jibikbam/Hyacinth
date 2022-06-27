import * as Nifti from './parsers/nifti';

const IMAGE_CACHE_SIZE = 3;
const IMAGE_CACHE: [string, any][] = [];
export function loadCached(imagePath: string) {
    for (const [p, img] of IMAGE_CACHE) {
        if (p === imagePath) return img;
    }

    const image = Nifti.parse(imagePath);
    // Insert at index 0
    IMAGE_CACHE.splice(0, 0, [imagePath, image]);
    // Pop from end until queue is of correct length
    while (IMAGE_CACHE.length > IMAGE_CACHE_SIZE) IMAGE_CACHE.pop();

    return image;
}

function arrMax(arr) {
    // TODO: sometimes this takes 10-20x longer, seemingly at random, and slows down draw
    let maxValue = arr[0];
    for (let i = 0; i < arr.length; i++) {
        const v = arr[i];
        if (v > maxValue) maxValue = v;
    }
    return maxValue;
}

export function renderCanvas3D(canvas: HTMLCanvasElement, dims: [number, number, number], imageData, sliceDim: number, sliceIndex: number) {
    const [iMax, jMax, kMax] = dims;
    const maxValue = arrMax(imageData);

    const context = canvas.getContext('2d');
    let canvasImageData;

    function getImageValue(i: number, j: number, k: number) {
        const dataOffset = i + (j * iMax) + (k * iMax * jMax);
        const rawValue = imageData[dataOffset];
        return (rawValue / maxValue) * 255;
    }

    function drawPixel(xMax: number, yMax: number, x: number, y: number, value: number) {
        // Compute 1D draw offset
        const drawOffset = x + (y * xMax);

        // Map 1D index to RGBA 1D index
        const canvasOffset = drawOffset * 4;
        // Write canvas image data (R G B A)
        canvasImageData.data[canvasOffset] = value & 0xFF;
        canvasImageData.data[canvasOffset + 1] = value & 0xFF;
        canvasImageData.data[canvasOffset + 2] = value & 0xFF;
        canvasImageData.data[canvasOffset + 3] = 0xFF;
    }

    if (sliceDim === 0) {
        const [sliceMax, xMax, yMax] = [dims[0], dims[1], dims[2]];
        canvasImageData = context.createImageData(xMax, yMax);

        for (let x = 0; x < xMax; x++) {
            for (let y = 0; y < yMax; y++) {
                const value = getImageValue(sliceIndex, x, y);
                drawPixel(xMax, yMax, x, yMax - y, value);
            }
        }
    }
    else if (sliceDim === 1) {
        // const [sliceMax, xMax, yMax] = [dims[1], dims[0], dims[2]];
        const [xMax, sliceMax, yMax] = [dims[0], dims[1], dims[2]];
        canvasImageData = context.createImageData(xMax, yMax);

        for (let x = 0; x < xMax; x++) {
            for (let y = 0; y < yMax; y++) {
                const value = getImageValue(x, sliceMax - sliceIndex, y);
                drawPixel(xMax, yMax, x, yMax - y, value);
            }
        }
    }
    else if (sliceDim === 2) {
        // const [sliceMax, xMax, yMax] = [dims[2], dims[0], dims[1]];
        const [xMax, yMax, sliceMax] = [dims[0], dims[1], dims[2]];
        canvasImageData = context.createImageData(xMax, yMax);

        for (let x = 0; x < xMax; x++) {
            for (let y = 0; y < yMax; y++) {
                const value = getImageValue(x, y, sliceIndex);
                drawPixel(xMax, yMax, x, yMax - y, value);
            }
        }
    }

    canvas.width = canvasImageData.width;
    canvas.height = canvasImageData.height;
    context.putImageData(canvasImageData, 0, 0);
}
