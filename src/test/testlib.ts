import {dbapi} from '../frontend/backend';

const TEST_FUNCTION_PREFIX = 'test';

type TestModule = {[key: string]: Function};

function runTest(moduleName: string, testName: string, testFunc: Function): boolean {
    // Log dot to show test is in progress
    process.stdout.write('.');

    // Suppress log output while running test
    const _log = console.log;
    console.log = function () {};

    // Run test and catch any errors
    let err;
    try {
        // Run tests within database transaction that always rolls back
        // so that each test is independent
        dbapi.runWithRollback(() => {
            testFunc();
        });
    }
    catch (e) {
        err = e;
    }

    // Restore log output
    console.log = _log;

    // Log if there was an error
    if (err) {
        console.log(`\nFAILURE: ${moduleName}.${testName}`)
        console.log(err.stack);
        return false;
    }
    else {
        return true;
    }
}

function shuffle<T>(arrInitial: T[]): T[] {
    // Simple Fisher-Yates shuffle
    const arr = arrInitial.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export function runAllTests(testModules: {[key: string]: TestModule}) {
    const testsFlat: [string, string, Function][] = [];
    for (const [moduleName, module] of Object.entries(testModules)) {
        for (const [testName, testFunc] of Object.entries(module)) {
            if (testName.startsWith(TEST_FUNCTION_PREFIX)) {
                testsFlat.push([moduleName, testName, testFunc]);
            }
        }
    }

    // Randomize test order
    const testsShuffled = shuffle(testsFlat);
    const testResults = testsShuffled.map(([modName, testName, func]) => runTest(modName, testName, func));

    const successes = testResults.filter(r => r === true).length;
    const failures = testResults.filter(r => r === false).length;

    console.log(`\n\nRan ${testResults.length} tests, ${successes} succeeded, ${failures} failed`);
}
