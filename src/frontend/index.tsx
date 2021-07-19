import * as React from 'react';
import ReactDOM from 'react-dom';
import {dbapi, fileapi} from './backend';
import {App} from './components/App';

dbapi.connect();
dbapi.createTables();

ReactDOM.render(
    <App />,
    document.getElementById('react-root')
);
