import * as React from 'react';
import {useEffect, useState} from 'react';
import {Link, useParams, useNavigate} from 'react-router-dom';
import {Dataset, LabelingSession, dbapi, fileapi} from '../backend';
import {Button, LinkButton} from './Buttons';
import {
    ArrowLeftIcon,
    ChevronDownIcon,
    CogIcon, ColorSwatchIcon,
    DocumentDownloadIcon,
    PencilAltIcon,
    PlusCircleIcon, PlusIcon,
} from '@heroicons/react/solid';
import {BeakerIcon, FolderOpenIcon} from '@heroicons/react/outline';
import {SessionOverview} from './SessionOverview';
import {Modal} from './Modal';
import {InputText} from './Inputs';
import {useSessionNameValidator} from '../hooks/validators';
import * as Session from '../sessions/session';

interface ImportSessionModalProps {
    filePath: string;
    datasetId: number | string;
    sessionJson: object;
    finishImport: (newSessionName: string) => void;
    cancelImport: () => void;
}

function ImportSessionModal({filePath, datasetId, sessionJson, finishImport, cancelImport}: ImportSessionModalProps) {
    const sessionName = useSessionNameValidator('', datasetId);

    // TODO: Fix InputText color
    return (
        <Modal closeModal={cancelImport}>
            <div className="mt-48 p-4 w-full max-w-xl bg-gray-800 rounded flex flex-col justify-start">
                <div className="pb-2 border-b border-white border-opacity-10">
                    <h1 className="text-xl text-white font-medium">Import Session</h1>
                    <h2 className="mt-0.5 text-xs text-gray-400 break-all">{filePath}</h2>
                </div>
                <div className="mt-2">
                    <InputText id="import-session-name" label="Session Name" placeholder="My imported session" dark={true} validator={sessionName} />
                    <div className="mt-2 text-xs text-gray-400">
                        <span>Choose a name for the imported session. Session names must be unique per dataset.</span>
                    </div>
                </div>
                <div className="pt-4 mt-6 border-t border-white border-opacity-10 flex justify-end items-center space-x-3">
                    <Button onClick={cancelImport} color="gray">Cancel</Button>
                    <Button onClick={() => finishImport(sessionName.value)} color="fuchsia" disabled={!sessionName.valid}>Import</Button>
                </div>
            </div>
        </Modal>
    )
}

function NoSessionsMessage() {
    return (
        <div className="mt-48 w-full flex justify-center items-center">
            <div className="px-10 pt-4 pb-6 max-w-lg rounded border border-gray-700 flex flex-col items-center">
                <div className="p-6 bg-gray-800 rounded-full border-2 border-gray-700">
                    <ColorSwatchIcon className="text-gray-300 w-8 h-8" />
                </div>
                <div className="mt-4 text-center">
                    <div className="text-3xl text-gray-200 font-medium">No sessions</div>
                    <div className="mt-2 text-sm text-gray-400">
                        Labeling Sessions are used to label the images in your dataset.
                        Once you have created a session, you can export it to share it with others who have the same data.
                    </div>
                </div>
            </div>
        </div>
    )
}

function NewSessionDropdown({datasetId, startSessionImport}: {datasetId: string, startSessionImport: () => void}) {
    const [open, setOpen] = useState<boolean>(false);

    function closeAndRun(runFunc: () => any) {
        setOpen(false);
        runFunc();
    }

    return (
        <div className="relative w-full">
            {open && <div className="fixed top-0 left-0 w-screen h-screen" onClick={() => setOpen(false)} />}
            <button
                className="relative w-full px-3 py-1.5 text-black font-medium rounded transition-all flex justify-between items-center
                bg-gray-300 hover:bg-gray-400
                focus:ring-4 ring-gray-300 hover:ring-gray-400 ring-opacity-50 hover:ring-opacity-50
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
                <div className="mt-2 px-2 py-1.5 w-full text-black font-medium bg-gray-300 rounded font-medium overflow-hidden">
                    <Link className="block px-2 py-1.5 w-full text-black font-medium hover:bg-gray-400 focus:bg-gray-400 rounded focus:outline-none flex items-center"
                          to={`/create-session/${datasetId}/choose-type`}>
                        <PencilAltIcon className="w-5 h-5" />
                        <span className="ml-2">Create Session</span>
                    </Link>
                    <button className="px-2 py-1.5 w-full text-black font-medium hover:bg-gray-400 focus:bg-gray-400 rounded focus:outline-none flex items-center"
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
    const navigate = useNavigate();

    const [dataset, setDataset] = useState<Dataset | null>(null);
    const [sessions, setSessions] = useState<LabelingSession[] | null>(null);

    const [importData, setImportData] = useState<{path: string, json: object} | null>(null);

    // Default to first session if no sessionId is passed via route url
    if (!sessionId && sessions && sessions.length > 0) sessionId = sessions[0].id.toString();

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
        const sessClass = Session.getClass(importData.json['sessionType']);
        const newSessionId = sessClass.importFromJson(importData.json, newSessionName, datasetId);

        setImportData(null);
        refreshSessions();
        navigate(`/dataset/${datasetId}/session/${newSessionId}`);
    }

    return (
        <main className="h-screen flex">
            {importData && <ImportSessionModal filePath={importData.path} datasetId={dataset.id} sessionJson={importData.json} finishImport={finishSessionImport} cancelImport={cancelSessionImport} />}
            <div className="px-4 py-2 w-80 bg-gray-800 border-r border-gray-700">
                <div>
                    <Link to="/" className="text-sm text-gray-400 hover:text-gray-200 transition inline-flex items-center">
                        <ArrowLeftIcon className="w-4 h-4" />
                        <span className="ml-1.5">Back to datasets</span>
                    </Link>
                    <div className="flex justify-between items-center">
                        <div className="text-3xl font-semibold">{dataset ? dataset.datasetName : '...'}</div>
                        <div className="flex items-center space-x-3">
                            <Link className="text-gray-500 hover:text-white transition-all" to={`/debug-slice-viewer/${datasetId}`}>
                                <BeakerIcon className="w-6 h-6" />
                            </Link>
                            <Link to="" className="text-gray-500 hover:text-white transition-all">
                                <CogIcon className="w-6 h-6" />
                            </Link>
                        </div>
                    </div>
                    <div className="mt-3">
                        <NewSessionDropdown datasetId={datasetId} startSessionImport={startSessionImport} />
                    </div>
                </div>
                <div className="-mx-2 mt-6">
                    <h2 className="ml-3 text-sm text-gray-400 font-medium">Labeling Sessions</h2>
                    <div className="mt-1 text-lg space-y-0.5 flex flex-col items-start">
                        {sessions && sessions.map(s => {
                            return (
                                <Link
                                    key={s.id}
                                    to={`/dataset/${datasetId}/session/${s.id}`}
                                    className={
                                        (s.id === parseInt(sessionId))
                                            ? 'w-full px-3 py-1 text-gray-200 bg-gray-900 bg-opacity-70 rounded'
                                            : 'w-full px-3 py-1 text-gray-400 hover:text-gray-200 hover:bg-gray-900 hover:bg-opacity-70 rounded'
                                    }
                                >
                                    <span>{s.sessionName}</span>
                                </Link>
                            )
                        })}
                        {sessions && sessions.length === 0 && <span className="mt-2 ml-3 text-xs text-gray-400">No sessions created yet.</span>}
                    </div>
                </div>
            </div>
            <div className="flex-1">
                {sessionId
                    ? <SessionOverview sessionId={sessionId} refreshDatasetSessions={refreshSessions} />
                    : <NoSessionsMessage />}
            </div>
        </main>
    )
}

export {DatasetOverview};
