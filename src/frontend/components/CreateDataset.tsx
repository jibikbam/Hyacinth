import * as React from 'react';
import {useEffect, useState} from 'react';
import {Switch, Route, useHistory} from 'react-router-dom';
import {dbapi, fileapi} from '../backend';
import {Button} from './Buttons';
import {StepHeader} from './StepHeader';
import {StepNavigation} from './StepNavigation';
import {CheckCircleIcon, FolderOpenIcon} from '@heroicons/react/solid';

function ChooseDirectoryButton({onClick}: {onClick: Function}) {
    return (
        <Button onClick={onClick} color="pink">
            <FolderOpenIcon className="w-6 h-6" />
            <span className="ml-2 text-lg font-medium">Choose Directory</span>
        </Button>
    )
}

function DirectoryStatus({datasetRoot, chooseDatasetRoot}: {datasetRoot: string, chooseDatasetRoot: Function}) {
    return (
        <div className="flex items-center">
            <div className="flex-1 px-3 py-1.5 bg-gray-600 rounded-l text-gray-400" title={datasetRoot}>{datasetRoot}</div>
            <button
                className="px-3 py-1.5 bg-pink-200 rounded-r text-black focus:outline-none focus:ring-4 ring-pink-200 ring-opacity-50"
                onClick={() => chooseDatasetRoot()}
            >Edit</button>
        </div>
    )
}

function ChooseDirectoryStep({datasetRoot, chooseDatasetRoot}: {datasetRoot: string, chooseDatasetRoot: Function}) {
    return (
        <div className="mt-32 flex flex-col items-center">
            {!datasetRoot
                ? <ChooseDirectoryButton onClick={chooseDatasetRoot} />
                : <DirectoryStatus datasetRoot={datasetRoot} chooseDatasetRoot={chooseDatasetRoot} />
            }
            <div className="mt-4 w-96 text-sm text-gray-400 text-center">
                <div>The chosen directory will be scanned for nifti files to be added to this dataset. Any collaborators will have to use the same directory structure.</div>
            </div>
        </div>
    )
}

function FilePreviewStep({datasetRoot, filePaths}: {datasetRoot: string, filePaths: string[]}) {
    return (
        <div className="mt-6">
            <div className="text-lg text-gray-400">
                <span>Found</span>
                <span className="text-white"> {filePaths.length}</span>
                <span> nifti files under</span>
                <span className="text-white"> {datasetRoot}</span>
            </div>
            <div className="mt-1 px-4 py-3 h-96 bg-gray-800 rounded text-gray-400 overflow-y-scroll">
                {filePaths.map(p => <div key={p}>{p}</div>)}
            </div>
        </div>
    )
}

interface ChooseNameStepProps {
    datasetName: string;
    setDatasetName: Function;
    datasetRoot: string;
    numFiles: number;
}

function ChooseNameStep({datasetName, setDatasetName, datasetRoot, numFiles}: ChooseNameStepProps) {
    return (
        <div className="mt-32">
            <div className="flex flex-col items-center">
                <div className="flex flex-col">
                    <label className="text-xs text-gray-400 font-medium">Dataset Name</label>
                    <input
                        className="mt-0.5 px-3 py-1 w-96 bg-gray-400 rounded text-lg text-black placeholder-gray-600 focus:outline-none focus:ring-2 ring-gray-300"
                        type="text"
                        placeholder="My Dataset"
                        value={datasetName}
                        onInput={ev => setDatasetName(ev.currentTarget.value)}
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
    const [datasetRoot, setDatasetRoot] = useState<string | null>(null);
    const [datasetName, setDatasetName] = useState<string>('');
    const [filePaths, setFilePaths] = useState<string[]>([]);

    const history = useHistory();

    useEffect(() => {
        if (datasetRoot) setFilePaths(fileapi.getDatasetImages(datasetRoot));
    }, [datasetRoot]);

    function chooseDatasetRoot() {
        const chosenPaths = fileapi.showFolderDialog();
        if (chosenPaths) setDatasetRoot(chosenPaths[0]);
    }

    function createDataset() {
        dbapi.insertDataset(datasetName, datasetRoot, filePaths);
        history.push('/');
    }

    return (
        <main className="mx-auto max-w-screen-md">
            <div className="mt-32 p-4 pt-3 h-144 bg-gray-700 rounded flex flex-col justify-between">
                <Switch>
                    <Route path="/create-dataset/choose-directory">
                        <div>
                            <StepHeader title="Create Dataset" stepDescription="Choose Directory" curStep={0} stepCount={3} />
                            <ChooseDirectoryStep datasetRoot={datasetRoot} chooseDatasetRoot={chooseDatasetRoot} />
                        </div>
                        <StepNavigation cancelTo="/" backTo={null} nextTo={datasetRoot ? '/create-dataset/file-preview' : null} />
                    </Route>
                    <Route path="/create-dataset/file-preview">
                        <div>
                            <StepHeader title="Create Dataset" stepDescription="Review Files" curStep={1} stepCount={3} />
                            <FilePreviewStep datasetRoot={datasetRoot} filePaths={filePaths} />
                        </div>
                        <StepNavigation cancelTo="/" backTo="/create-dataset/choose-directory" nextTo="/create-dataset/choose-name" />
                    </Route>
                    <Route path="/create-dataset/choose-name">
                        <div>
                            <StepHeader title="Create Dataset" stepDescription="Choose Name" curStep={2} stepCount={3} />
                            <ChooseNameStep datasetName={datasetName} setDatasetName={setDatasetName} datasetRoot={datasetRoot} numFiles={filePaths.length} />
                        </div>
                        <StepNavigation cancelTo="/" backTo="/create-dataset/file-preview" nextTo={null} finishText="Create" finishClicked={createDataset} finishDisabled={datasetName.length === 0} />
                    </Route>
                </Switch>
            </div>
        </main>
    )
}

export {CreateDataset};
