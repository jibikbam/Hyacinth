import {dbapi} from '../../frontend/backend';
import * as Session from '../../frontend/sessions/session';

import * as assert from 'assert';
import * as Fixtures from '../fixtures';

export function testClassificationCollab() {
    const session = Fixtures.sessionFixture('Classification');
    const dataset = dbapi.selectDataset(session.datasetId);

    const sessClass = Session.getSessionClass('Classification');
    const exported = sessClass.exportToJsonString(session);
    const importedId = sessClass.importFromJson(JSON.parse(exported), 'Imported session', dataset.id);
    const imported = dbapi.selectLabelingSession(importedId);

    const [s1, s2] = [session, imported];
    assert.deepStrictEqual(
        [s1.sessionType, s1.prompt, s1.labelOptions],
        [s2.sessionType, s2.prompt, s2.labelOptions]
    );
    assert.strictEqual(dbapi.selectSessionSlices(s1.id).length, dbapi.selectSessionSlices(s2.id).length);
    assert.strictEqual(dbapi.selectSessionComparisons(s2.id).length, 0);
}

export function testComparisonRandomCollab() {
    const session = Fixtures.sessionFixture('ComparisonRandom');
    const dataset = dbapi.selectDataset(session.datasetId);

    const sessClass = Session.getSessionClass('ComparisonRandom');
    const exported = sessClass.exportToJsonString(session);
    const importedId = sessClass.importFromJson(JSON.parse(exported), 'Imported session', dataset.id);
    const imported = dbapi.selectLabelingSession(importedId);

    const [s1, s2] = [session, imported];
    assert.deepStrictEqual(
        [s1.sessionType, s1.prompt, s1.labelOptions],
        [s2.sessionType, s2.prompt, s2.labelOptions]
    );
    assert.strictEqual(dbapi.selectSessionSlices(s1.id).length, dbapi.selectSessionSlices(s2.id).length);
    assert.strictEqual(dbapi.selectSessionComparisons(s1.id).length, dbapi.selectSessionComparisons(s2.id).length);
}

export function testComparisonActiveSortCollab() {
    const session = Fixtures.sessionFixture('ComparisonActiveSort');
    const dataset = dbapi.selectDataset(session.datasetId);

    const sessClass = Session.getSessionClass('ComparisonActiveSort');
    const exported = sessClass.exportToJsonString(session);
    const importedId = sessClass.importFromJson(JSON.parse(exported), 'Imported session', dataset.id);
    const imported = dbapi.selectLabelingSession(importedId);

    const [s1, s2] = [session, imported];
    assert.deepStrictEqual(
        [s1.sessionType, s1.prompt, s1.labelOptions],
        [s2.sessionType, s2.prompt, s2.labelOptions]
    );
    assert.strictEqual(dbapi.selectSessionSlices(s1.id).length, dbapi.selectSessionSlices(s2.id).length);
    assert.strictEqual(dbapi.selectSessionComparisons(s2.id).length, 1);
}
