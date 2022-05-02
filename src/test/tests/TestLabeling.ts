import {dbapi} from '../../frontend/backend';
import * as Session from '../../frontend/sessions/session';

import * as assert from 'assert';
import * as Fixtures from '../fixtures';
import * as TestUtils from '../testutils';

export function testClassificationLabel() {
    const sessClass = Session.getClass('Classification');
    const session = Fixtures.sessionFixture('Classification');

    const elements = sessClass.selectElementsToLabel(session);
    assert.strictEqual(elements.length, 10);
    assert.strictEqual(elements[0].elementType, 'Slice');

    sessClass.addLabel(session, elements[0], 'Label 1', Date.now() - 1000);
    sessClass.addLabel(session, elements[1], 'Label 1', Date.now() - 1000);
    sessClass.addLabel(session, elements[1], 'Label 3', Date.now() - 1000);

    assert.strictEqual(dbapi.selectElementLabels(elements[0].id).length, 1);
    assert.strictEqual(dbapi.selectElementLabels(elements[1].id).length, 2);
    assert.strictEqual(dbapi.selectElementLabels(elements[2].id).length, 0);
    assert.deepStrictEqual(
        dbapi.selectElementLabels(elements[1].id).map(l => l.labelValue),
        ['Label 3', 'Label 1']
    );

    const labelsCsv = sessClass.exportLabelsToCsv(session);
    const [numRows, numCols] = TestUtils.getCsvDims(labelsCsv);
    assert.strictEqual(numRows, 4);
    assert.strictEqual(numCols, 7);
}

export function testComparisonRandomLabel() {
    const sessClass = Session.getClass('ComparisonRandom');
    const session = Fixtures.sessionFixture('ComparisonRandom');

    const elements = sessClass.selectElementsToLabel(session);
    assert.strictEqual(elements.length, 12);
    assert.strictEqual(elements[0].elementType, 'Comparison');

    sessClass.addLabel(session, elements[0], 'First', Date.now() - 1000);
    sessClass.addLabel(session, elements[1], 'Second', Date.now() - 1000);
    sessClass.addLabel(session, elements[1], 'Label 3', Date.now() - 1000);

    assert.strictEqual(dbapi.selectElementLabels(elements[0].id).length, 1);
    assert.strictEqual(dbapi.selectElementLabels(elements[1].id).length, 2);
    assert.strictEqual(dbapi.selectElementLabels(elements[2].id).length, 0);
    assert.deepStrictEqual(
        dbapi.selectElementLabels(elements[1].id).map(l => l.labelValue),
        ['Label 3', 'Second']
    );

    const labelsCsv = sessClass.exportLabelsToCsv(session);
    const [numRows, numCols] = TestUtils.getCsvDims(labelsCsv);
    assert.strictEqual(numRows, 4);
    assert.strictEqual(numCols, 10);
}

export function testComparisonActiveSortLabel() {
    const sessClass = Session.getClass('ComparisonActiveSort');
    const session = Fixtures.sessionFixture('ComparisonActiveSort');

    let elements = sessClass.selectElementsToLabel(session);
    assert.strictEqual(elements.length, 1);
    assert.strictEqual(elements[0].elementType, 'Comparison');

    sessClass.addLabel(session, elements[0], 'First', Date.now() - 1000);

    elements = sessClass.selectElementsToLabel(session);
    assert.strictEqual(elements.length, 2);

    sessClass.addLabel(session, elements[1], 'Second', Date.now() - 1000);
    sessClass.addLabel(session, elements[1], 'Label 3', Date.now() - 1000);

    elements = sessClass.selectElementsToLabel(session);
    assert.strictEqual(elements.length, 3);

    assert.strictEqual(dbapi.selectElementLabels(elements[0].id).length, 1);
    assert.strictEqual(dbapi.selectElementLabels(elements[1].id).length, 2);
    assert.strictEqual(dbapi.selectElementLabels(elements[2].id).length, 0);
    assert.deepStrictEqual(
        dbapi.selectElementLabels(elements[1].id).map(l => l.labelValue),
        ['Label 3', 'Second']
    );

    const labelsCsv = sessClass.exportLabelsToCsv(session);
    const [numRows, numCols] = TestUtils.getCsvDims(labelsCsv);
    assert.strictEqual(numRows, 4);
    assert.strictEqual(numCols, 10);
}
