import {LabelingSession, SessionType} from '../backend';
import {SessionBase} from './base';
import {ClassificationSession} from './types/classification';
import {ComparisonRandomSession} from './types/comparison_random';
import {ComparisonActiveSortSession} from './types/comparison_active';

export function getSessionClass(sessionOrType: LabelingSession | SessionType): typeof SessionBase {
    const sessionType: SessionType = (typeof sessionOrType === 'string')
        ? sessionOrType as SessionType
        : (sessionOrType as LabelingSession).sessionType;

    switch (sessionType) {
        case 'Classification': return ClassificationSession;
        case 'ComparisonRandom': return ComparisonRandomSession;
        case 'ComparisonActiveSort': return ComparisonActiveSortSession;
    }
    throw new Error(`No session class found for type ${sessionType}`);
}
