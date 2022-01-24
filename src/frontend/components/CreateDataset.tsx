import * as React from 'react';
import {useEffect, useMemo, useState} from 'react';
import {Routes, Route, useNavigate} from 'react-router-dom';
import {dbapi, fileapi} from '../backend';
import {Button} from './Buttons';
import {StepHeader} from './StepHeader';
import {StepNavigation} from './StepNavigation';
import {FolderOpenIcon} from '@heroicons/react/solid';
import {InputText} from './Inputs';
import {CheckCircleIcon, InformationCircleIcon} from '@heroicons/react/outline';
import {InputValidator, useDatasetNameValidator} from '../hooks/validators';

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
                <div>The chosen directory will be scanned for image files to be added to this dataset. Any collaborators will have to use the same directory structure.</div>
            </div>
        </div>
    )
}

interface FilePreviewStepProps {
    datasetRoot: string;
    filePathsMatched: [string, boolean][];
    filterRegex: string;
    setFilterRegex: React.Dispatch<React.SetStateAction<string>>;
    dicomAsSeries: boolean;
    setDicomAsSeries: React.Dispatch<React.SetStateAction<boolean>>;
}

function FilePreviewStep({datasetRoot, filePathsMatched, filterRegex, setFilterRegex, dicomAsSeries, setDicomAsSeries}: FilePreviewStepProps) {
    return (
        <div className="mt-4 min-h-0 flex flex-col">
            <div className="flex items-center space-x-3">
                <div className="flex-1">
                    <InputText id="file-path-regex-text" label={null} placeholder="Filter regex" value={filterRegex} setValue={setFilterRegex} />
                </div>
                <div className="px-3 py-1 bg-gray-800 rounded border border-gray-500">
                    <label className="text-gray-300 flex items-center space-x-2">
                        <span>DICOM Series Mode</span>
                        <input type="checkbox" checked={dicomAsSeries} onChange={() => setDicomAsSeries(!dicomAsSeries)} />
                    </label>
                </div>
            </div>
            <div className="ml-1 mt-3 text-sm text-gray-400">
                {(filterRegex.length === 0)
                    ? <div>Found {filePathsMatched.filter(t => t[1]).length} images under {datasetRoot}</div>
                    : <div>Filtered {filePathsMatched.filter(t => t[1]).length} / {filePathsMatched.length} images under {datasetRoot}</div>}
            </div>
            <div className="flex-1 mt-1 px-4 py-3 bg-gray-800 rounded text-xs leading-relaxed font-mono break-words overflow-y-scroll">
                {filePathsMatched.map(([p, m]) => <div key={p} className={m ? 'text-gray-200' : 'text-gray-500'}>{p}</div>)}
            </div>
        </div>
    )
}

interface ChooseNameStepProps {
    datasetName: InputValidator<string>;
    datasetRoot: string;
    numFiles: number;
}

function ChooseNameStep({datasetName, datasetRoot, numFiles}: ChooseNameStepProps) {
    return (
        <div className="mt-16">
            <div className="mx-auto w-3/4">
                <div>
                    <InputText id="dataset-name" label="Dataset Name" placeholder="My Dataset" validator={datasetName} />
                </div>
                <div className="mt-2 text-xs text-gray-400">Choose a name for this dataset. Dataset names must be unique.</div>
                <div className="mt-12 px-3 py-2 text-xs text-gray-400 rounded border border-gray-500 flex items-center">
                    <InformationCircleIcon className="w-6 h-6 text-gray-400 opacity-80" />
                    <div className="ml-3">
                        <div>{datasetName.value ? `"${datasetName.value}"` : 'Dataset'} will be created with {numFiles} files at</div>
                        <div>{datasetRoot}</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function CreateDataset() {
    const [datasetRoot, setDatasetRoot] = useState<string | null>(null);
    const [filterRegex, setFilterRegex] = useState<string>('');
    const [dicomAsSeries, setDicomAsSeries] = useState<boolean>(false);
    const datasetName = useDatasetNameValidator('');
    const [filePaths, setFilePaths] = useState<string[]>([]);

    const navigate = useNavigate();

    const filePathsMatched: [string, boolean][] = useMemo(() => {
        if (filterRegex.length > 0) {
            const filterRegexCompiled = new RegExp(filterRegex);
            return filePaths.map(p => [p, filterRegexCompiled.test(p)])
        }
        else {
            return filePaths.map(p => [p, true]);
        }
    }, [filePaths, filterRegex]);

    useEffect(() => {
        if (datasetRoot) setFilePaths(fileapi.getDatasetImages(datasetRoot, dicomAsSeries));
    }, [datasetRoot, dicomAsSeries]);

    function chooseDatasetRoot() {
        const chosenPaths = fileapi.showFolderDialog();
        if (chosenPaths) setDatasetRoot(chosenPaths[0]);
    }

    function createDataset() {
        const filePathsFiltered = filePathsMatched.filter(([p, m]) => m).map(([p, m]) => p);
        dbapi.insertDataset(datasetName.value, datasetRoot, filePathsFiltered);
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
                            <div className="min-h-0 flex flex-col">
                                <StepHeader title="Create Dataset" stepDescription="Review Files" curStep={1} stepCount={3}/>
                                <FilePreviewStep datasetRoot={datasetRoot} filePathsMatched={filePathsMatched} filterRegex={filterRegex} setFilterRegex={setFilterRegex}
                                                 dicomAsSeries={dicomAsSeries} setDicomAsSeries={setDicomAsSeries} />
                            </div>
                            <StepNavigation cancelTo="/" backTo="/create-dataset/choose-directory" nextTo={filePaths.length > 0 && "/create-dataset/choose-name"} />
                        </>
                    } />
                    <Route path="/choose-name" element={
                        <>
                            <div>
                                <StepHeader title="Create Dataset" stepDescription="Choose Name" curStep={2} stepCount={3}/>
                                <ChooseNameStep datasetName={datasetName} datasetRoot={datasetRoot} numFiles={filePathsMatched.filter(([p, m]) => m).length}/>
                            </div>
                            <StepNavigation cancelTo="/" backTo="/create-dataset/file-preview" nextTo={null} finishText="Create" finishClicked={createDataset} finishDisabled={!datasetName.valid} />
                        </>
                    } />
                </Routes>
            </div>
        </main>
    )
}

export {CreateDataset};
