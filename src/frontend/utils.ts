export function splitLabelOptions(labelOptionsString: string): string[] {
    if (labelOptionsString.length === 0) return [];
    return labelOptionsString.split(',');
}

export function truncateStart(value: string, maxLength: number): string {
    if (value.length <= maxLength) return value;
    return value.substring(value.length - maxLength, value.length);
}
