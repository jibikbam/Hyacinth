import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'node:zlib';
import * as niftiReader from 'nifti-reader-js';
import * as pako from 'pako';
import * as daikon from 'daikon';

const DICOM_FILE_EXT = '.dcm';

export function readImageFile(imagePath: string): ArrayBufferLike {
    if (!imagePath.endsWith('.nii.gz')) throw new Error(`Not an image path: ${imagePath}`);
    const rawData = fs.readFileSync(imagePath);
    return zlib.gunzipSync(rawData).buffer;
}

function readNiftiData(imagePath) {
    const fileData = fs.readFileSync(imagePath);
    const dataArrayBuffer = fileData.buffer.slice(fileData.byteOffset, fileData.byteOffset + fileData.byteLength);

    return niftiReader.decompress(dataArrayBuffer);
}

export function readNiftiHeader(imagePath: string) {
    // TODO: replace with function that ONLY reads dims, without parser?
    // Read and decompress only the first 540 bytes (roughly 1000x speedup over decompressing entire file)
    // Note that the nifti header is 540B long (decompressed), so 540B (compressed) is slightly larger
    const file = fs.openSync(imagePath, 'r');
    const fileBuffer = Buffer.alloc(540);
    fs.readSync(file, fileBuffer, 0, 540, null);
    fs.closeSync(file);
    const dataInflated = pako.inflate(fileBuffer).buffer;

    return niftiReader.readHeader(dataInflated);
}

export function readNifti(imagePath) {
    const niftiData = readNiftiData(imagePath);
    const imgHeader = niftiReader.readHeader(niftiData);
    const imgDataUntyped = niftiReader.readImage(imgHeader, niftiData);
    const imgData = new Int16Array(imgDataUntyped);

    return [imgHeader, imgData];
}

function buildDicomSeries(seriesDirPath: string) {
    if (!fs.statSync(seriesDirPath).isDirectory()) throw new Error(`Dicom seriesDirPath is not a directory: ${seriesDirPath}`);

    const imageNames = fs.readdirSync(seriesDirPath).filter(n => n.endsWith(DICOM_FILE_EXT));
    if (imageNames.length === 0) throw new Error(`Dicom series dir is empty: ${seriesDirPath}`);

    const series = new daikon.Series();

    for (const imageName of imageNames) {
        const fileData = fs.readFileSync(path.join(seriesDirPath, imageName));
        const image = daikon.Series.parseImage(new DataView(daikon.Utils.toArrayBuffer(fileData)));
        if (image === null) {
            console.log(`DICOM parsing error for file ${imageName} in ${seriesDirPath}`);
        }
        else if (!image.hasPixelData()) {
            console.log(`DICOM has no pixel data - file ${imageName} in ${seriesDirPath}`);
        }
        else if (series.images.length > 0 && series.images[0].getSeriesId() !== image.getSeriesId()) {
            console.log(`DICOM series does not match for file ${imageName} in ${seriesDirPath}`);
        }
        else {
            series.addImage(image);
        }
    }

    series.buildSeries();

    const dims = [
        series.images[0].getCols(),
        series.images[0].getRows(),
        series.images.length,
    ];
    const iop = series.images[0].getImageDirections(); // Image Orientation (Patient) - (0020, 0037)

    return [dims, iop, series];
}

export function readDicomSeriesDims(seriesDirPath: string): [[number, number, number], [number, number, number, number, number, number]] {
    const [dims, iop, _] = buildDicomSeries(seriesDirPath);
    return [dims, iop];
}

export function readDicomSeries(seriesDirPath: string): [[number, number, number], [number, number, number, number, number, number], Float32Array] {
    const [dims, iop, series] = buildDicomSeries(seriesDirPath);

    const numImagePixels = dims[0] * dims[1];
    const numVoxels = numImagePixels * dims[2];

    const finalArray = new Float32Array(numVoxels);
    let offset = 0;
    for (const image of series.images) {
        finalArray.set(image.getInterpretedData(false, false), offset);
        offset += numImagePixels;
    }

    return [dims, iop, finalArray];
}

export function readDicomSeriesNew(seriesDirPath: string): [[number, number, number], [number, number, number, number, number, number], Float32Array] {
    const [dims, iop, series] = buildDicomSeries(seriesDirPath);
    // TODO: order dims by ijk in buildDicomSeries so we do not have to change order here (after old renderer is removed)
    const [jMax, kMax, iMax] = dims; // width, height, slice count
    const pixelDataBySlice = series.images.map((image) => image.getInterpretedData(false, false));

    // Order voxels to be nifti-like (i fastest, then j, then k slowest)
    // so that we can reuse the same rendering function for nifti and dicom
    // Note that ijk is not necessarily RAS in the DICOM, but we account for that by mapping dims later
    const voxelArray = new Float32Array(iMax * jMax * kMax);
    for (let k = 0; k < kMax; k++) {
        for (let j = 0; j < jMax; j++) {
            for (let i = 0; i < iMax; i++) {
                voxelArray[i + (j * iMax) + (k * iMax * jMax)] = pixelDataBySlice[i][j + (k * jMax)];
            }
        }
    }

    // TODO: remove newDims after above TODO
    const newDims: [number, number, number] = [iMax, jMax, kMax];
    return [newDims, iop, voxelArray];
}

// TODO: function to read 2d dims only?
export function readDicom2d(imagePath: string): [[number, number], Float32Array] {
    const fileData = fs.readFileSync(imagePath);
    const image = daikon.Series.parseImage(new DataView(daikon.Utils.toArrayBuffer(fileData)));

    const dims: [number, number] = [image.getCols(), image.getRows()];
    const imageData: Float32Array = image.getInterpretedData(false, false);

    return [dims, imageData];
}
