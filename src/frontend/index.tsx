import React from 'react';
import ReactDOM from 'react-dom';
import {App} from './components/App';

(window as any).dbapi.connect();
(window as any).dbapi.createTables();

ReactDOM.render(
    <App />,
    document.getElementById('react-root')
);
