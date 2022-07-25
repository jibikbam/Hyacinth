import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'node:zlib';
import * as daikon from 'daikon';

const DICOM_FILE_EXT = '.dcm';

export function readNiftiFile(imagePath: string): ArrayBufferLike {
    if (!imagePath.endsWith('.nii.gz')) throw new Error(`Not an image path: ${imagePath}`);
    const rawData = fs.readFileSync(imagePath);
    return zlib.gunzipSync(rawData).buffer;
}

export function readNiftiFileHeaderBytes(imagePath: string): ArrayBufferLike {
    // This function reads and returns the first 540 bytes (compressed)
    // of a gzipped nifti file (the largest possible header)
    // For reference, Nifti header sizes are: Nifti 1 (348B) - Nifti 2 (540B)
    // TODO: support uncompressed (.nii)?
    if (!imagePath.endsWith('.nii.gz')) throw new Error(`Not a nifti path: ${imagePath}`);

    // Read and decompress only the first 540 bytes (will be larger after decompression)
    const file = fs.openSync(imagePath, 'r');
    const fileBuffer = Buffer.alloc(540);
    fs.readSync(file, fileBuffer, 0, 540, null);
    fs.closeSync(file);
    // finishFlush required to prevent "unexpected end of file"
    return zlib.gunzipSync(fileBuffer, {finishFlush: zlib.constants.Z_SYNC_FLUSH}).buffer;
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
        series.images.length,
        series.images[0].getCols(),
        series.images[0].getRows(),
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
    const [iMax, jMax, kMax] = dims; // slice count, width, height
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

    return [dims, iop, voxelArray];
}

export function readDicom2d(imagePath: string): [[number, number], Float32Array] {
    const fileData = fs.readFileSync(imagePath);
    const image = daikon.Series.parseImage(new DataView(daikon.Utils.toArrayBuffer(fileData)));

    const dims: [number, number] = [image.getCols(), image.getRows()];
    const imageData: Float32Array = image.getInterpretedData(false, false);

    return [dims, imageData];
}

export function readDicom2dDims(imagePath: string): [number, number] {
    const fileData = fs.readFileSync(imagePath);
    const image = daikon.Series.parseImage(new DataView(daikon.Utils.toArrayBuffer(fileData)));
    return [image.getCols(), image.getRows()];
}
