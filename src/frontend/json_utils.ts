export function validateJsonWithKeys(jsonObject: object, keyTypes: [string, string][]): boolean {
    let valid = true;

    for (const [k, t] of keyTypes) {
        if (!(k in jsonObject)) {
            valid = false;
            console.log(`JSON is missing key ${k}`);
        }
        else if (typeof jsonObject[k] !== t) {
            valid = false;
            console.log(`JSON value ${k}=${jsonObject[k]} is of invalid type "${typeof jsonObject[k]}" (should be "${t}")`);
        }
    }

    return valid;
}

export function validateJsonValues(jsonObject: object, allowedValueTypes: string[]) {
    let valid = true;

    for (const [k, v] of Object.entries(jsonObject)) {
        if (!allowedValueTypes.includes(typeof v)) {
            valid = false;
            console.log(`JSON value ${k}=${v} is of invalid type ${typeof v}`);
        }
    }

    return valid;
}
