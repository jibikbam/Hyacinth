export function readNiftiFileHeaderBytes(imagePath: string): ArrayBufferLike {
    // This function creates a fake nifti file with all zeros except for
    // sizeOfHeader (needed to determine littleEndian) and dim[8]

    // Create fileData buffer (1000 bytes)
    // Size does not matter as long as larger than 348 bytes (nifti header size)
    const fileData = new ArrayBuffer(1000);
    const view = new DataView(fileData);

    // Nifti header data to set
    const littleEndian = true;
    const sizeOfHeader = 348;
    const dim = [3, 176, 256, 256, 1, 0, 0, 0];

    // Set sizeOfHeader at byte 0 (used to determine littleEndian in parser)
    view.setInt32(0, sizeOfHeader, true);
    // Set 8 dim values at byte 40
    dim.map((val, i) => view.setInt16(40 + (i * 2), val, littleEndian));

    // Return buffer
    return view.buffer;
}
