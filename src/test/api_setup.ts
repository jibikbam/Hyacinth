import * as _dbapi from '../backend/apis/dbapi';
import * as _fileapi from './fake/fakefileapi';
import * as _volumeapi from './fake/fakevolumeapi';

import {FileApiType, VolumeApiType} from '../frontend/backend';
import * as Backend from '../frontend/backend';

// This is kept in a separate module (file) to avoid polluting the imports
// of test.ts with multiple versions of the apis
export function setupApis() {
    Backend.setupTestInject(_dbapi, _fileapi as FileApiType, _volumeapi as VolumeApiType);
}
