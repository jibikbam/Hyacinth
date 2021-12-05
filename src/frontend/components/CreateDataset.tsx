import * as React from 'react';
import {useEffect, useState} from 'react';
import {Routes, Route, useNavigate} from 'react-router-dom';
import {dbapi, fileapi} from '../backend';
import {Button} from './Buttons';
import {StepHeader} from './StepHeader';
import {StepNavigation} from './StepNavigation';
import {FolderOpenIcon} from '@heroicons/react/solid';
import {InputText} from './Inputs';
import {CheckCircleIcon, InformationCircleIcon} from '@heroicons/react/outline';

function ChooseDirectoryButton({onClick}: {onClick: Function}) {
    return (
        <Button onClick={onClick} color="fuchsia">
            <FolderOpenIcon className="w-6 h-6" />
            <span className="ml-2 text-lg font-medium">Choose Directory</span>
        </Button>
    )
}

function DirectoryStatus({datasetRoot, chooseDatasetRoot}: {datasetRoot: string, chooseDatasetRoot: Function}) {
    return (
        <div className="flex items-center">
            <div className="flex-1 pl-4 pr-6 py-1.5 bg-gray-800 rounded-l text-gray-400" title={datasetRoot}>{datasetRoot}</div>
            <button
                className="px-3 py-1.5 rounded-r text-black transition
                bg-fuchsia-300 hover:bg-fuchsia-400
                focus:ring-4 ring-fuchsia-300 hover:ring-fuchsia-400 ring-opacity-50 hover:ring-opacity-50
                focus:outline-none"
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
            <div className="mt-4 w-3/4 text-sm text-gray-400 text-center">
                <div>The chosen directory will be scanned for nifti files to be added to this dataset. Any collaborators will have to use the same directory structure.</div>
            </div>
        </div>
    )
}

function FilePreviewStep({datasetRoot, filePaths}: {datasetRoot: string, filePaths: string[]}) {
    return (
        <div className="mt-4">
            <div className="text-sm text-gray-300">
                <div>Found {filePaths.length} nifti files under {datasetRoot}</div>
            </div>
            <div className="mt-2 px-4 py-3 h-96 bg-gray-800 rounded text-xs leading-relaxed text-gray-400 font-mono overflow-y-scroll">
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
        <div className="mt-16">
            <div className="mx-auto w-3/4">
                <div>
                    <InputText id="dataset-name" label="Dataset Name" placeholder="My Dataset" value={datasetName} setValue={setDatasetName} />
                </div>
                <div className="mt-2 text-xs text-gray-400">Choose a name for this dataset. Dataset names must be unique.</div>
                <div className="mt-12 px-3 py-2 text-xs text-gray-400 rounded border border-gray-500 flex items-center">
                    <InformationCircleIcon className="w-6 h-6 text-gray-400 opacity-80" />
                    <div className="ml-3">
                        <div>{datasetName ? `"${datasetName}"` : 'Dataset'} will be created with {numFiles} files at</div>
                        <div>{datasetRoot}</div>
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

    const navigate = useNavigate();

    useEffect(() => {
        if (datasetRoot) setFilePaths(fileapi.getDatasetImages(datasetRoot));
    }, [datasetRoot]);

    function chooseDatasetRoot() {
        const chosenPaths = fileapi.showFolderDialog();
        if (chosenPaths) setDatasetRoot(chosenPaths[0]);
    }

    function createDataset() {
        dbapi.insertDataset(datasetName, datasetRoot, filePaths);
        navigate('/');
    }

    return (
        <main className="mx-auto max-w-screen-md">
            <div className="mt-32 p-4 pt-3 h-144 bg-gray-700 rounded flex flex-col justify-between">
                <Routes>
                    <Route path="/choose-directory" element={
                        <>
                            <div>
                                <StepHeader title="Create Dataset" stepDescription="Choose Directory" curStep={0} stepCount={3}/>
                                <ChooseDirectoryStep datasetRoot={datasetRoot} chooseDatasetRoot={chooseDatasetRoot}/>
                            </div>
                            <StepNavigation cancelTo="/" backTo={null} nextTo={datasetRoot && '/create-dataset/file-preview'} />
                        </>
                    } />
                    <Route path="/file-preview" element={
                        <>
                            <div>
                                <StepHeader title="Create Dataset" stepDescription="Review Files" curStep={1} stepCount={3}/>
                                <FilePreviewStep datasetRoot={datasetRoot} filePaths={filePaths}/>
                            </div>
                            <StepNavigation cancelTo="/" backTo="/create-dataset/choose-directory" nextTo={filePaths.length > 0 && "/create-dataset/choose-name"} />
                        </>
                    } />
                    <Route path="/choose-name" element={
                        <>
                            <div>
                                <StepHeader title="Create Dataset" stepDescription="Choose Name" curStep={2} stepCount={3}/>
                                <ChooseNameStep datasetName={datasetName} setDatasetName={setDatasetName} datasetRoot={datasetRoot} numFiles={filePaths.length}/>
                            </div>
                            <StepNavigation cancelTo="/" backTo="/create-dataset/file-preview" nextTo={null} finishText="Create" finishClicked={createDataset} finishDisabled={datasetName.length === 0} />
                        </>
                    } />
                </Routes>
            </div>
        </main>
    )
}

export {CreateDataset};
