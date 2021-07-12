import React, {useState} from 'react';
import {BrowserRouter as Router, Link, Switch, Route} from 'react-router-dom';

import {VolumeSlice} from './VolumeSlice';
import {Datasets} from './Datasets';

function App() {
    return (
        <Router>
            <Switch>
                <Route path="/">
                    <Datasets />
                </Route>
            </Switch>
        </Router>
    )
}

export {App};
