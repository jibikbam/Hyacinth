import * as React from 'react';
import {useEffect, useState} from 'react';
import {Link, useParams, useHistory} from 'react-router-dom';
import {Dataset, LabelingSession, dbapi, fileapi} from '../backend';
import {Button, LinkButton} from './Buttons';
import {
    ArrowLeftIcon,
    ChevronDownIcon,
    CogIcon,
    DocumentDownloadIcon,
    PencilAltIcon,
    PlusCircleIcon,
} from '@heroicons/react/solid';
import {BeakerIcon} from '@heroicons/react/outline';
import {SessionOverview} from './SessionOverview';
import {Modal} from './Modal';
import {InputText} from './Inputs';
import {importSessionFromJson} from '../collaboration';

interface ImportSessionModalProps {
    filePath: string;
    sessionJson: object;
    finishImport: (newSessionName: string) => void;
    cancelImport: () => void;
}

function ImportSessionModal({filePath, sessionJson, finishImport, cancelImport}: ImportSessionModalProps) {
    const [sessionName, setSessionName] = useState('');

    return (
        <Modal closeModal={cancelImport}>
            <div className="mt-48 p-4 w-full max-w-lg bg-gray-800 rounded flex flex-col justify-start">
                <div className="pb-2 border-b border-white border-opacity-10">
                    <h1 className="text-xl text-white font-medium">Import Session</h1>
                    <h2 className="text-sm text-gray-400">{filePath}</h2>
                </div>
                <div className="mt-6">
                    <InputText id="import-session-name" label="Session Name" placeholder="My Session" value={sessionName} setValue={setSessionName} />
                    <div className="mt-2 text-xs text-gray-400">
                        <span>Choose a name for the imported session. Session names must be unique per dataset.</span>
                    </div>
                </div>
                <div className="pt-6 mt-20 border-t border-white border-opacity-10 flex justify-end items-center space-x-3">
                    <Button onClick={cancelImport} color="darkGray">Cancel</Button>
                    <Button onClick={() => finishImport(sessionName)} color="pink" disabled={sessionName.length === 0}>Import</Button>
                </div>
            </div>
        </Modal>
    )
}

function NewSessionDropdown({datasetId, startSessionImport}: {datasetId: number, startSessionImport: () => void}) {
    const [open, setOpen] = useState<boolean>(false);

    function closeAndRun(runFunc: () => any) {
        setOpen(false);
        runFunc();
    }

    return (
        <div className="relative w-full">
            {open && <div className="fixed top-0 left-0 w-screen h-screen" onClick={() => setOpen(false)} />}
            <button
                className="relative w-full px-3 py-2 text-black font-medium rounded transition-all flex justify-between items-center
                bg-pink-200 hover:bg-pink-300
                focus:ring-4 ring-pink-200 hover:ring-pink-300 ring-opacity-50 hover:ring-opacity-50
                focus:outline-none"
                onClick={() => setOpen(!open)}
            >
                <span className="flex items-center">
                    <PlusCircleIcon className="w-5 h-5 opacity-80" />
                    <span className="ml-2">New Session</span>
                </span>
                <ChevronDownIcon className="w-5 h-5" />
            </button>
            <div className={`absolute left-0 right-0 transition-all duration-100 transform origin-top ${!open ? 'invisible scale-75 opacity-0' : 'visible scale-100 opacity-100'}`}>
                <div className="mt-2 py-1.5 w-full text-black font-medium bg-pink-200 rounded font-medium overflow-hidden">
                    <Link className="block px-3 py-1.5 w-full text-black font-medium hover:bg-pink-300 focus:bg-pink-300 focus:outline-none flex items-center"
                          to={`/create-session/${datasetId}/choose-type`}>
                        <PencilAltIcon className="w-5 h-5" />
                        <span className="ml-2">Create Session</span>
                    </Link>
                    <button className="px-3 py-1.5 w-full text-black font-medium hover:bg-pink-300 focus:bg-pink-300 focus:outline-none flex items-center"
                            onClick={() => closeAndRun(startSessionImport)}>
                        <DocumentDownloadIcon className="w-5 h-5 opacity-80" />
                        <span className="ml-2">Import Session</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

function DatasetOverview() {
    let {datasetId, sessionId} = useParams();
    datasetId = parseInt(datasetId);
    if (sessionId) sessionId = parseInt(sessionId);

    const history = useHistory();

    const [dataset, setDataset] = useState<Dataset | null>(null);
    const [sessions, setSessions] = useState<LabelingSession[] | null>(null);

    const [importData, setImportData] = useState<{path: string, json: object} | null>(null);

    // Default to first session if no sessionId is passed via route url
    if (!sessionId && sessions && sessions.length > 0) sessionId = sessions[0].id;

    useEffect(() => {
        setDataset(dbapi.selectDataset(datasetId));
        setSessions(dbapi.selectDatasetSessions(datasetId));
    }, [datasetId]);

    function refreshSessions() {
        setSessions(dbapi.selectDatasetSessions(datasetId));
    }

    function startSessionImport() {
        const dialogResult = fileapi.showOpenJsonDialog();
        if (dialogResult) {
            const sessionJsonPath = dialogResult[0];
            console.log('sessionJsonPath', sessionJsonPath);
            const sessionJsonString = fileapi.readJsonFile(sessionJsonPath);
            const sessionJson = JSON.parse(sessionJsonString);
            setImportData({path: sessionJsonPath, json: sessionJson});
        }
    }

    function cancelSessionImport() {
        setImportData(null);
    }

    function finishSessionImport(newSessionName: string) {
        if (newSessionName.length === 0) return;
        const newSessionId = importSessionFromJson(importData.json, newSessionName, datasetId);

        setImportData(null);
        refreshSessions();
        history.push(`/dataset/${datasetId}/session/${newSessionId}`);
    }

    return (
        <main className="h-screen flex">
            {importData && <ImportSessionModal filePath={importData.path} sessionJson={importData.json} finishImport={finishSessionImport} cancelImport={cancelSessionImport} />}
            <div className="px-4 py-3 w-80 bg-gray-800">
                <div>
                    <Link to="/" className="text-sm text-pink-300 hover:text-pink-500 transition-all inline-flex items-center">
                        <ArrowLeftIcon className="w-4 h-4" />
                        <span className="ml-1.5">Back to datasets</span>
                    </Link>
                    <div className="flex justify-between items-center">
                        <div className="text-3xl">{dataset ? dataset.datasetName : '...'}</div>
                        <div className="flex items-center space-x-3">
                            <Link className="text-gray-500 hover:text-white transition-all" to={`/debug-slice-viewer/${datasetId}`}>
                                <BeakerIcon className="w-6 h-6" />
                            </Link>
                            <Link className="text-gray-500 hover:text-white transition-all">
                                <CogIcon className="w-6 h-6" />
                            </Link>
                        </div>
                    </div>
                    <div className="mt-3">
                        <NewSessionDropdown datasetId={datasetId} startSessionImport={startSessionImport} />
                    </div>
                </div>
                <div className="mt-6">
                    <h2 className="text-sm text-gray-400 font-medium">Labeling Sessions</h2>
                    <div className="mt-2 space-y-1 flex flex-col items-start">
                        {sessions && sessions.map(s => {
                            return (
                                <Link to={`/dataset/${datasetId}/session/${s.id}`} className="text-lg font-medium">
                                    <span className={s.id === sessionId ? 'text-gray-100' : 'text-gray-400 hover:text-white focus:text-white'}>{s.sessionName}</span>
                                </Link>
                            )
                        })}
                        {sessions && sessions.length === 0 && <span className="mt-1 text-xs text-gray-400">No sessions created yet.</span>}
                    </div>
                </div>
            </div>
            <div className="flex-1">
                {sessionId && <SessionOverview sessionId={sessionId} refreshDatasetSessions={refreshSessions} />}
            </div>
        </main>
    )
}

export {DatasetOverview};
