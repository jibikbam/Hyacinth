import {Slice} from './backend';

export function splitLabelOptions(labelOptionsString: string): string[] {
    if (labelOptionsString.length === 0) return [];
    return labelOptionsString.split(',');
}

export function truncateStart(value: string, maxLength: number): string {
    if (value.length <= maxLength) return value;
    return value.substring(value.length - maxLength, value.length);
}

export function getThumbnailName(slice: Slice): string {
    return `${slice.id}_${slice.sliceDim}_${slice.sliceIndex}`;
}

export function zip<T1, T2>(a: T1[], b: T2[]): [T1, T2][] {
    return a.map((av, i) => [av, b[i]]);
}
