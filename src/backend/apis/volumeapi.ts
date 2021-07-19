import * as fs from 'fs';
import * as niftiReader from 'nifti-reader-js';

function readNiftiData(imagePath) {
    const fileData = fs.readFileSync(imagePath);
    const dataArrayBuffer = fileData.buffer.slice(fileData.byteOffset, fileData.byteOffset + fileData.byteLength);

    return niftiReader.decompress(dataArrayBuffer);
}

function readNiftiHeader(imagePath) {
    const niftiData = readNiftiData(imagePath);
    return niftiReader.readHeader(niftiData);
}

function readNifti(imagePath) {
    const niftiData = readNiftiData(imagePath);
    const imgHeader = niftiReader.readHeader(niftiData);
    const imgDataUntyped = niftiReader.readImage(imgHeader, niftiData);
    const imgData = new Int16Array(imgDataUntyped);

    return [imgHeader, imgData];
}

export {readNiftiHeader, readNifti};
