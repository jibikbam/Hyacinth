import * as TimSort from 'timsort';
import {Comparison, Orientation, Slice, SliceAttributes} from './backend';

type SliceAny = Slice | SliceAttributes;

function makeSliceString(imageId: number, sliceIndex: number, orientation: Orientation) {
    return imageId.toString() + '-' + sliceIndex.toString() + '-' + orientation;
}

export function sliceToString(slice: SliceAny): string {
    return makeSliceString(slice.imageId, slice.sliceIndex, slice.orientation);
}

function comparisonToSliceStrings(comparison: Comparison): [string, string] {
    return [
        makeSliceString(comparison.imageId1, comparison.sliceIndex1, comparison.orientation1),
        makeSliceString(comparison.imageId2, comparison.sliceIndex2, comparison.orientation2),
    ]
}

type SortMatrix = {[key: string]: {[key: string]: string}};

export function buildSortMatrix(comparisons: Comparison[], comparisonLabels: (string | null)[]) {
    const matrix: SortMatrix = {};
    for (let i = 0; i < comparisons.length; i++) {
        const [sl1, sl2] = comparisonToSliceStrings(comparisons[i]);
        const label = comparisonLabels[i];

        if (label !== null) {
            if (!(sl1 in matrix)) matrix[sl1] = {};
            matrix[sl1][sl2] = label;
        }
    }

    return matrix;
}

export function sortSlices<Type extends SliceAny>(matrix: SortMatrix, slices: Type[]): Type[] | {slice1: Type, slice2: Type} {
    let newSlice1: Type, newSlice2: Type;
    function sortKey(slice1: Type, slice2: Type): number {
        const sl1 = sliceToString(slice1);
        const sl2 = sliceToString(slice2);

        if ((sl1 in matrix) && (sl2 in matrix[sl1])) {
            const label = matrix[sl1][sl2];
            if (label === 'First') return 1;
            else if (label === 'Second') return -1;
            else return 0;
        }
        else if ((sl2 in matrix) && (sl1 in matrix[sl2])) {
            const label = matrix[sl2][sl1];
            if (label === 'First') return -1;
            else if (label === 'Second') return 1;
            else return 0;
        }
        else {
            newSlice1 = slice1;
            newSlice2 = slice2;
            throw 'Comparison not found';
        }
    }

    try {
        const slicesCopy = slices.slice();
        TimSort.sort(slicesCopy, sortKey);
        return slicesCopy;
    }
    catch (e) {
        if (e === 'Comparison not found') return {slice1: newSlice1, slice2: newSlice2};
        else throw e;
    }
}

export function getInitialComparison(slices: SliceAttributes[]): [number, number] {
    if (slices.length < 2) throw new Error(`Can't get first comparison from less than two slices`);
    const result = sortSlices({}, slices) as {slice1: SliceAttributes, slice2: SliceAttributes};
    return [
        slices.indexOf(result.slice1),
        slices.indexOf(result.slice2),
    ]
}
