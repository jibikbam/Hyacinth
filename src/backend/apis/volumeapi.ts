import * as fs from 'fs';
import * as path from 'path';
import * as niftiReader from 'nifti-reader-js';
import * as daikon from 'daikon';

const DICOM_FILE_EXT = '.dcm';

function readNiftiData(imagePath) {
    const fileData = fs.readFileSync(imagePath);
    const dataArrayBuffer = fileData.buffer.slice(fileData.byteOffset, fileData.byteOffset + fileData.byteLength);

    return niftiReader.decompress(dataArrayBuffer);
}

export function readNiftiHeader(imagePath) {
    const niftiData = readNiftiData(imagePath);
    return niftiReader.readHeader(niftiData);
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

    return [dims, series];
}

export function readDicomSeriesDims(seriesDirPath: string) {
    const [dims, _] = buildDicomSeries(seriesDirPath);
    return dims;
}

export function readDicomSeries(seriesDirPath: string) {
    const [dims, series] = buildDicomSeries(seriesDirPath);

    const numImagePixels = dims[0] * dims[1];
    const numVoxels = numImagePixels * dims[2];

    const finalArray = new Float32Array(numVoxels);
    let offset = 0;
    for (const image of series.images) {
        finalArray.set(image.getInterpretedData(false, false), offset);
        offset += numImagePixels;
    }

    return [dims, finalArray];
}
