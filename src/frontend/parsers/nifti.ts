import {volumeapi} from '../backend';
import {ImageDataTypedArray} from '../imageload';

function range(max) {
    return Array.from(Array(max).keys());
}

const NIFTI1_HEADER_SIZE_BYTES = 348;

interface Nifti1Header {
    niftiType: 'Nifti1';
    littleEndian: boolean;
    sizeOfHeader: number;
    dim: number[];
    dataType: number;
    bitPix: number;
    pixDim: number[];
    voxOffset: number;
}

export function parseHeaderFromView(view: DataView): Nifti1Header {
    // TODO: support nifti2
    let littleEndian = false;
    let sizeOfHeader = view.getInt32(0, false);
    if (sizeOfHeader !== NIFTI1_HEADER_SIZE_BYTES) {
        sizeOfHeader = view.getInt32(0, true);
        if (sizeOfHeader !== NIFTI1_HEADER_SIZE_BYTES) throw new Error(`Not a nifti 1 file!`);
        littleEndian = true;
    }

    return {
        niftiType: 'Nifti1',
        littleEndian: littleEndian,
        sizeOfHeader: sizeOfHeader,
        dim: range(8).map(i => view.getInt16(40 + (i * 2), littleEndian)),
        dataType: view.getInt16(70, littleEndian),
        bitPix: view.getInt16(72, littleEndian),
        pixDim: range(8).map(i => view.getFloat32(76 + (i * 4), littleEndian)),
        // Note vox_offset is stored as a float for compatibility reasons, which is confusing (it's a byte offset)
        // JS doesn't have an integer type anyway though, so it doesn't matter! (but we round anyway, for sanity)
        voxOffset: Math.round(view.getFloat32(108, littleEndian)),
    }
}


function getTypedView(imageDataBuffer: ArrayBufferLike, dataTypeCode: number): ImageDataTypedArray {
    switch (dataTypeCode) {
        case 4: return new Int16Array(imageDataBuffer);
        case 8: return new Int32Array(imageDataBuffer);
        case 16: return new Float32Array(imageDataBuffer);
        case 64: return new Float64Array(imageDataBuffer);
        case 512: return new Uint16Array(imageDataBuffer);
        case 768: return new Uint32Array(imageDataBuffer);
        default: throw new Error(`Unsupported dataType code: ${dataTypeCode}`);
    }
}

export function parseHeader(imagePath: string): Nifti1Header {
    const fileData = volumeapi.readNiftiFileHeaderBytes(imagePath);
    const view = new DataView(fileData);
    return parseHeaderFromView(view);
}

export function parse(imagePath: string): [Nifti1Header, ImageDataTypedArray] {
    const fileData = volumeapi.readNiftiFile(imagePath);
    const view = new DataView(fileData);

    const header = parseHeaderFromView(view);

    // Only allow 3D images
    // dim[0] stores the number of dimensions
    if (header.dim[0] !== 3) throw new Error(`Only 3D Nifti images are supported: found ${header.dim[0]} dims`);

    // Compute the byte length of the image voxel data
    // We divide bitPix (number of bits per voxel) by 8 to get bytes per voxel
    // Math.floor is used for integer division (JS has no integers)
    const imageVoxelsByteLength = header.dim[1] * header.dim[2] * header.dim[3] * Math.floor(header.bitPix / 8);

    // Slice voxel data buffer from file data
    const imageDataBuf = fileData.slice(header.voxOffset, header.voxOffset + imageVoxelsByteLength);
    const imageDataView = getTypedView(imageDataBuf, header.dataType);

    return [header, imageDataView];
}
