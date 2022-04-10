import {dbapi} from '../frontend/backend';
import {setupApis} from './api_setup';

function main() {
    // Setup
    console.log('Preparing test environment...');
    setupApis();
    dbapi.connect(':memory:');

    // Run tests
    console.log('Running tests...');

    // TODO: run tests here

    console.log('Finished running tests.');
}

main();
