import React, {useEffect, useState} from 'react';
import {Link, Switch, Route, useHistory} from 'react-router-dom';
import {Steps} from './Steps';
import {CheckCircleIcon, FolderOpenIcon} from '@heroicons/react/solid';

function StepLinkButton({text, to = null, enabled = true, highlight = false}) {
    if (!enabled) {
        return <span className="inline-block px-4 py-1.5 bg-gray-600 rounded text-gray-400 cursor-not-allowed">{text}</span>
    }

    if (highlight) {
        return <Link to={to} className="inline-block px-4 py-1.5 bg-pink-200 rounded shadow text-black focus:outline-none focus:ring-4 ring-pink-200 ring-opacity-50">{text}</Link>
    }

    return <Link to={to} className="inline-block px-4 py-1.5 bg-gray-500 rounded shadow text-white focus:outline-none focus:ring-4 ring-gray-500 ring-opacity-50">{text}</Link>
}

function StepNavigation({cancelTo, backTo, nextTo, altNextText = null, altNextClicked = null, altNextEnabled=false}) {
    let next;
    if (altNextText) {
        if (altNextEnabled) {
            next = (
                <button
                    className="px-4 py-1.5 bg-pink-200 rounded shadow text-black focus:outline-none focus:ring-4 ring-pink-200 ring-opacity-50"
                    onClick={() => altNextClicked()}
                >{altNextText}</button>
            )
        }
        else {
            next = <StepLinkButton text={altNextText} enabled={false} />
        }
    }
    else {
        next = <StepLinkButton text="Next" to={nextTo} enabled={nextTo !== null} highlight={true} />
    }

    return (
        <div className="flex justify-between items-center">
            <div>
                <StepLinkButton text="Cancel" to={cancelTo} />
            </div>
            <div className="flex items-center space-x-3">
                <div>
                    <StepLinkButton text="Back" to={backTo} enabled={backTo !== null} />
                </div>
                <div>
                    {next}
                </div>
            </div>
        </div>
    )
}

function ChooseDirectoryStep({datasetRoot, handleDatasetRoot}) {
    let content;
    if (datasetRoot) {
        content = (
            <div className="w-96 flex items-center">
                <div className="flex-1 px-3 py-1.5 bg-gray-600 rounded-l text-gray-400">{datasetRoot}</div>
                <button className="px-3 py-1.5 bg-pink-200 rounded-r text-black focus:outline-none focus:ring-4 ring-pink-200 ring-opacity-50">Edit</button>
            </div>
        )
    }
    else {
        content = (
            <button
                onClick={() => handleDatasetRoot()}
                className="px-4 py-1.5 bg-pink-200 rounded flex items-center focus:outline-none focus:ring-4 ring-pink-200 ring-opacity-50"
            >
                <FolderOpenIcon className="text-black w-6 h-6" />
                <span className="ml-2 text-lg text-black font-medium">Choose Directory</span>
            </button>
        )
    }

    return (
        <div className="mt-32 flex flex-col items-center">
            {content}
            <div className="mt-4 w-96 text-sm text-gray-400 text-center">
                <div>The chosen directory will be scanned for nifti files to be added to this dataset. Any collaborators will have to use the same directory structure.</div>
            </div>
        </div>
    )
}

function FilePreviewStep({datasetRoot, filePaths}) {
    return (
        <div className="mt-6">
            <div className="text-lg text-gray-400">
                <span>Found</span>
                <span className="text-white"> {filePaths.length}</span>
                <span> nifti files under</span>
                <span className="text-white"> {datasetRoot}</span>
            </div>
            <div className="mt-1 px-4 py-3 h-96 bg-gray-800 rounded text-gray-400">
                {filePaths.map(p => <div key={p}>{p}</div>)}
            </div>
        </div>
    )
}

function ChooseNameStep({datasetName, setDatasetName, datasetRoot, numFiles}) {
    return (
        <div className="mt-32">
            <div className="flex flex-col items-center">
                <div className="flex flex-col">
                    <label className="text-xs text-gray-400 font-medium">Dataset Name</label>
                    <input
                        className="mt-0.5 px-3 py-1 w-96 bg-gray-400 rounded text-lg text-black placeholder-gray-600 focus:outline-none focus:ring-2 ring-gray-300"
                        type="text"
                        placeholder="My Dataset"
                        value={datasetName || ''}
                        onInput={ev => setDatasetName(ev.target.value)}
                    />
                </div>
                <div className="mt-2 text-sm text-gray-400">Choose a name for this dataset. Dataset names must be unique.</div>
                <div className="mt-8 flex items-center text-gray-400">
                    <CheckCircleIcon className="w-5 h-5 text-gray-400" />
                    <div className="ml-1">
                        <span className="text-white">{datasetName ? datasetName : 'Dataset'}</span>
                        <span> will be created with</span>
                        <span className="text-white"> {numFiles}</span>
                        <span> files at</span>
                        <span className="text-white"> {datasetRoot}</span>
                        <span>.</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

function CreateDataset() {
    const [datasetRoot, setDatasetRoot] = useState(null);
    const [datasetName, setDatasetName] = useState(null);
    const [filePaths, setFilePaths] = useState([]);

    const history = useHistory();

    useEffect(() => {
        if (datasetRoot) {
            setFilePaths((window as any).fileapi.getDatasetImages(datasetRoot));
        }
    }, [datasetRoot]);

    function handleDatasetRoot() {
        //TODO: actually set
        setDatasetRoot('data/datasets/dataset1');
    }

    function createDataset() {
        (window as any).dbapi.insertDataset(datasetName, datasetRoot, filePaths);
        history.push('/');
    }

    return (
        <main className="mx-auto max-w-screen-md">
            <div className="mt-32 p-4 pt-3 h-144 bg-gray-700 rounded flex flex-col justify-between">
                <div>
                    <div className="flex justify-between">
                        <div className="text-3xl">Create Dataset</div>
                        <Switch>
                            <Route path="/create-dataset/choose-directory">
                                <Steps title="Choose Directory" numSteps={3} curStep={0} />
                            </Route>
                            <Route path="/create-dataset/file-preview">
                                <Steps title="Review Files" numSteps={3} curStep={1} />
                            </Route>
                            <Route path="/create-dataset/choose-name">
                                <Steps title="Name Dataset" numSteps={3} curStep={2} />
                            </Route>
                        </Switch>
                    </div>
                    <div>
                        <Switch>
                            <Route path="/create-dataset/choose-directory">
                                <ChooseDirectoryStep datasetRoot={datasetRoot} handleDatasetRoot={handleDatasetRoot} />
                            </Route>
                            <Route path="/create-dataset/file-preview">
                                <FilePreviewStep datasetRoot={datasetRoot} filePaths={filePaths} />
                            </Route>
                            <Route path="/create-dataset/choose-name">
                                <ChooseNameStep datasetName={datasetName} setDatasetName={setDatasetName} datasetRoot={datasetRoot} numFiles={filePaths.length} />
                            </Route>
                        </Switch>
                    </div>
                </div>
                <div>
                    <Switch>
                        <Route path="/create-dataset/choose-directory">
                            <StepNavigation cancelTo="/" backTo={null} nextTo={datasetRoot ? '/create-dataset/file-preview' : null} />
                        </Route>
                        <Route path="/create-dataset/file-preview">
                            <StepNavigation cancelTo="/" backTo="/create-dataset/choose-directory" nextTo="/create-dataset/choose-name" />
                        </Route>
                        <Route path="/create-dataset/choose-name">
                            <StepNavigation cancelTo="/" backTo="/create-dataset/file-preview" nextTo={null} altNextText="Create" altNextClicked={createDataset} altNextEnabled={datasetName && datasetName.length > 0} />
                        </Route>
                    </Switch>
                </div>
            </div>
        </main>
    )
}

export {CreateDataset};
