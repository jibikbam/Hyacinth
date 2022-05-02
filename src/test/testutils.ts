export function getCsvDims(csvString: string): [number, number] {
    return [
        csvString.split('\n').length,
        csvString.split('\n')[0].split(',').length
    ];
}
