import React, {useState} from 'react';
import {BrowserRouter as Router, Link, Switch, Route} from 'react-router-dom';

import {VolumeSlice} from './VolumeSlice';
import {Datasets} from './Datasets';
import {CreateDataset} from './CreateDataset';
import {DatasetOverview} from './DatasetOverview';
import {CreateSession} from './CreateSession';

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
                <Route path="/dataset/:datasetId">
                    <DatasetOverview />
                </Route>
                <Route path="/">
                    <Datasets />
                </Route>
            </Switch>
        </Router>
    )
}

export {App};
