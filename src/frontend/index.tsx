import * as React from 'react';
import ReactDOM from 'react-dom';
import {App} from './components/App';

const dbapi = (window as any).dbapi;
const fileapi = (window as any).fileapi;

dbapi.connect();
dbapi.createTables();

const datasetName = 'Dataset 1';
const datasetPath = 'data/datasets/dataset1';
dbapi.insertDataset(datasetName, datasetPath, fileapi.getDatasetImages(datasetPath));

ReactDOM.render(
    <App />,
    document.getElementById('react-root')
);
