import * as React from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';

import {Datasets} from './Datasets';
import {CreateDataset} from './CreateDataset';
import {DatasetOverview} from './DatasetOverview';
import {CreateSession} from './CreateSession';
import {LabelView} from './label/LabelView';
import {DebugSliceViewer} from './DebugSliceViewer';
import {ThumbnailGenerator} from './ThumbnailGenerator';
import {SessionResults} from './SessionResults';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/create-dataset/*" element={<CreateDataset />} />
                <Route path="/create-session/:datasetId/*" element={<CreateSession />} />
                <Route path="/dataset/:datasetId/session/:sessionId" element={<DatasetOverview />} />
                <Route path="/dataset/:datasetId" element={<DatasetOverview />} />
                <Route path="/session-results/:sessionId" element={<SessionResults />} />
                <Route path="/label/:sessionId/:elementIndex" element={<LabelView />} />
                <Route path="/generate-thumbnails/:sessionId" element={<ThumbnailGenerator />} />
                <Route path="/debug-slice-viewer/:datasetId" element={<DebugSliceViewer />} />
                <Route path="/*" element={<Datasets />} />
            </Routes>
        </Router>
    )
}

export {App};
