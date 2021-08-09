export function splitLabelOptions(labelOptionsString: string): string[] {
    if (labelOptionsString.length === 0) return [];
    return labelOptionsString.split(',');
}
