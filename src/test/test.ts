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

    TestLib.runAllTests(Registry.TEST_MODULES);

    console.log('Finished running tests.');
    process.exit(1); // TODO: exit with code 1 if any tests are failing
}

main();
