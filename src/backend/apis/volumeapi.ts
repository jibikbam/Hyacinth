import * as fs from 'fs';
import * as niftiReader from 'nifti-reader-js';

function readNifti(imagePath) {
    const fileData = fs.readFileSync(imagePath);
    const dataArrayBuffer = fileData.buffer.slice(fileData.byteOffset, fileData.byteOffset + fileData.byteLength);

    const niftiData = niftiReader.decompress(dataArrayBuffer);
    const imgHeader = niftiReader.readHeader(niftiData);
    const imgDataUntyped = niftiReader.readImage(imgHeader, niftiData);
    const imgData = new Int16Array(imgDataUntyped);

    return [imgHeader, imgData];
}

export {readNifti};
