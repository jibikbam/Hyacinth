import * as React from 'react';
import ReactDOM from 'react-dom';
import {setupRenderer, dbapi, fileapi} from './backend';
import {App} from './components/App';

setupRenderer();
dbapi.connect(fileapi.getDatabaseFilePath());
dbapi.createTables();

ReactDOM.render(
    <App />,
    document.getElementById('react-root')
);
