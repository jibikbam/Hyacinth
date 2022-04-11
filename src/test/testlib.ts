import {dbapi} from '../frontend/backend';

const TEST_FUNCTION_PREFIX = 'test';

type TestModule = {[key: string]: Function};

function runTest(moduleName: string, funcName: string, testFunc: Function) {
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
        console.log(`\nFAILURE: ${moduleName}.${funcName}`)
        console.log(err.stack);
    }
}

function runModuleTests(moduleName: string, module: TestModule) {
    for (const [funcName, testFunc] of Object.entries(module)) {
        if (funcName.startsWith(TEST_FUNCTION_PREFIX)) {
            process.stdout.write('.');
            runTest(moduleName, funcName, testFunc);
        }
    }
}

export function runAllTests(testModules: {[key: string]: TestModule}) {
    for (const [moduleName, module] of Object.entries(testModules)) {
        runModuleTests(moduleName, module);
    }
    process.stdout.write('\n');
}
