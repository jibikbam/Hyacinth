import {LabelingSession, SessionType} from '../backend';
import {SessionBase} from './base';
import {ClassificationSession} from './types/classification';

export function getSessionClass(sessionOrType: LabelingSession | SessionType): typeof SessionBase {
    const sessionType: SessionType = (typeof sessionOrType === 'string')
        ? sessionOrType as SessionType
        : (sessionOrType as LabelingSession).sessionType;

    switch (sessionType) {
        case 'Classification': return ClassificationSession;
    }
    throw new Error(`No session class found for type ${sessionType}`);
}
