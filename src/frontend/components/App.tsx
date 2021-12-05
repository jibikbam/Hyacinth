import * as React from 'react';
import {useState} from 'react';
import {BrowserRouter as Router, Link, Routes, Route, useLocation} from 'react-router-dom';

import {VolumeSlice} from './VolumeSlice';
import {Datasets} from './Datasets';
import {CreateDataset} from './CreateDataset';
import {DatasetOverview} from './DatasetOverview';
import {CreateSession} from './CreateSession';
import {LabelView} from './LabelView';
import {DebugSliceViewer} from './DebugSliceViewer';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/create-dataset/*" element={<CreateDataset />} />
                <Route path="/create-session/:datasetId/*" element={<CreateSession />} />
                <Route path="/dataset/:datasetId/session/:sessionId" element={<DatasetOverview />} />
                <Route path="/dataset/:datasetId" element={<DatasetOverview />} />
                <Route path="/label/:sessionId/:elementIndex" element={<LabelView />} />
                <Route path="/debug-slice-viewer/:datasetId" element={<DebugSliceViewer />} />
                <Route path="/*" element={<Datasets />} />
            </Routes>
        </Router>
    )
}

export {App};
