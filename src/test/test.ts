import {dbapi} from '../frontend/backend';
import {setupApis} from './api_setup';
import * as Registry from './registry';
import * as TestLib from './testlib';

function main() {
    // Setup
    console.log('Preparing test environment');
    setupApis();
    dbapi.connect(':memory:');
    dbapi.createTables();

    // Run tests
    console.log('\nRunning tests');

    const allSucceeded = TestLib.runAllTests(Registry.TEST_MODULES);

    console.log('Finished running tests.');
    if (!allSucceeded) process.exit(1);
}

main();
