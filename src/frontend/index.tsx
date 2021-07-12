import React from 'react';
import ReactDOM from 'react-dom';
import {App} from './components/App';

const dbapi = (window as any).dbapi;
const fileapi = (window as any).fileapi;

dbapi.connect();
dbapi.createTables();

const datasetName = 'dataset1';
dbapi.insertDataset(datasetName, 'data/datasets/' + datasetName, fileapi.getDatasetImages(datasetName));

dbapi.selectDatasets();

ReactDOM.render(
    <App />,
    document.getElementById('react-root')
);
