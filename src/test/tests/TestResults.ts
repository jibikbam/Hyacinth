import * as assert from 'assert';
import * as Fixtures from '../fixtures';
import * as TestUtils from '../testutils';
import * as Session from '../../frontend/sessions/session';

export function testClassificationResults() {
    const sessClass = Session.getClass('Classification');
    const session = Fixtures.sessionFixture('Classification', 3);

    let elements = sessClass.selectElementsToLabel(session);
    sessClass.addLabel(session, elements[0], 'Label 1', Date.now() - 1000);
    sessClass.addLabel(session, elements[1], 'Label 1', Date.now() - 1000);
    sessClass.addLabel(session, elements[1], 'Label 3', Date.now() - 1000);

    const results = sessClass.computeResults(session);
    assert.strictEqual(results.labelingComplete, false);
    assert.strictEqual(results.sliceResults.length, 3);

    assert.strictEqual(results.sliceResults[0].latestLabelValue, 'Label 3');
    assert.strictEqual(results.sliceResults[1].latestLabelValue, 'Label 1');

    elements = sessClass.selectElementsToLabel(session);
    assert.deepStrictEqual(results.sliceResults[0].slice, elements[1]);
    assert.deepStrictEqual(results.sliceResults[1].slice, elements[0]);

    sessClass.addLabel(session, elements[2], 'Label 1', Date.now() - 1000);
    assert.strictEqual(sessClass.computeResults(session).labelingComplete, true);

    const resultCsv = sessClass.exportResultsToCsv(results.sliceResults);
    const [numRows, numCols] = TestUtils.getCsvDims(resultCsv);
    assert.strictEqual(numRows, 4);
    assert.strictEqual(numCols, 6);
}

export function testComparisonRandomResults() {
    const sessClass = Session.getClass('ComparisonRandom');
    const session = Fixtures.sessionFixture('ComparisonRandom', 10, 3);

    let elements = sessClass.selectElementsToLabel(session);
    sessClass.addLabel(session, elements[0], 'First', Date.now() - 1000);
    sessClass.addLabel(session, elements[1], 'First', Date.now() - 1000);
    sessClass.addLabel(session, elements[1], 'Second', Date.now() - 1000);

    const results = sessClass.computeResults(session);
    assert.strictEqual(results.labelingComplete, false);
    assert.strictEqual(results.sliceResults.length, 10);

    assert.strictEqual(results.sliceResults[0].latestLabelValue, undefined);
    assert.notStrictEqual(results.sliceResults[0].score, undefined);

    sessClass.addLabel(session, elements[2], 'Label 1', Date.now() - 1000);
    assert.strictEqual(sessClass.computeResults(session).labelingComplete, true);

    const resultCsv = sessClass.exportResultsToCsv(results.sliceResults);
    const [numRows, numCols] = TestUtils.getCsvDims(resultCsv);
    assert.strictEqual(numRows, 11);
    assert.strictEqual(numCols, 9);
}

export function testComparisonActiveSortResults() {
    const sessClass = Session.getClass('ComparisonActiveSort');
    const session = Fixtures.sessionFixture('ComparisonActiveSort');

    let elements = sessClass.selectElementsToLabel(session);
    sessClass.addLabel(session, elements[0], 'First', Date.now() - 1000);

    elements = sessClass.selectElementsToLabel(session);
    sessClass.addLabel(session, elements[1], 'First', Date.now() - 1000);
    sessClass.addLabel(session, elements[1], 'Second', Date.now() - 1000);

    const results = sessClass.computeResults(session);
    assert.strictEqual(results.labelingComplete, false);
    assert.strictEqual(results.sliceResults.length, 10);

    assert.strictEqual(results.sliceResults[0].latestLabelValue, undefined);
    assert.strictEqual(results.sliceResults[0].score, undefined);

    const resultCsv = sessClass.exportResultsToCsv(results.sliceResults);
    const [numRows, numCols] = TestUtils.getCsvDims(resultCsv);
    assert.strictEqual(numRows, 11);
    assert.strictEqual(numCols, 5);
}

export function testComparisonActiveSortResultsTerminates() {
    const sessClass = Session.getClass('ComparisonActiveSort');
    const session = Fixtures.sessionFixture('ComparisonActiveSort', 2);

    let results = sessClass.computeResults(session);
    assert.strictEqual(results.labelingComplete, false);

    const elements = sessClass.selectElementsToLabel(session);
    sessClass.addLabel(session, elements[0], 'First', Date.now() - 1000);

    results = sessClass.computeResults(session);
    assert.strictEqual(results.labelingComplete, true);
    assert.strictEqual(results.sliceResults.length, 2);

    const resultCsv = sessClass.exportResultsToCsv(results.sliceResults);
    const [numRows, numCols] = TestUtils.getCsvDims(resultCsv);
    assert.strictEqual(numRows, 3);
    assert.strictEqual(numCols, 5);
}
