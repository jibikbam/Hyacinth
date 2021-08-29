import * as React from 'react';
import {useState} from 'react';
import {BrowserRouter as Router, Link, Switch, Route} from 'react-router-dom';

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
            <Switch>
                <Route path="/create-dataset">
                    <CreateDataset />
                </Route>
                <Route path="/create-session/:datasetId">
                    <CreateSession />
                </Route>
                <Route path="/dataset/:datasetId/session/:sessionId">
                    <DatasetOverview />
                </Route>
                <Route path="/dataset/:datasetId">
                    <DatasetOverview />
                </Route>
                <Route path="/label/:sessionId/:elementIndex">
                    <LabelView />
                </Route>
                <Route path="/debug-slice-viewer/:datasetId">
                    <DebugSliceViewer />
                </Route>
                <Route path="/">
                    <Datasets />
                </Route>
            </Switch>
        </Router>
    )
}

export {App};
