import * as React from 'react';
import {useEffect, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {Comparison, dbapi, fileapi, LabelingSession, SessionElement, Slice} from '../backend';
import {Button, LinkButton} from './Buttons';
import {
    ChevronDownIcon,
    CogIcon,
    DuplicateIcon,
    ExternalLinkIcon,
    PlayIcon,
    TagIcon,
    TrashIcon
} from '@heroicons/react/solid';
import {sessionLabelsToCsv, sessionToJson} from '../collaboration';
import {Modal} from './Modal';

interface DeleteSessionModalProps {
    sessionName: string;
    deleteSession: () => void;
    cancelDelete: () => void;
}

function DeleteSessionModal({sessionName, deleteSession, cancelDelete}: DeleteSessionModalProps) {
    const [confirmText, setConfirmText] = useState<string>('');

    return (
        <Modal closeModal={cancelDelete}>
            <div className="mt-48 p-4 w-full max-w-lg bg-gray-800 rounded">
                <div className="ml-1">
                    <h1 className="text-xl text-gray-300">
                        <span>Really delete "</span>
                        <span className="text-red-400">{sessionName}</span>
                        <span>"?</span>
                    </h1>
                    <h2 className="mt-1 text-sm text-gray-400">All labels and metadata for this session will be permanently deleted. Type the name of the session below to confirm.</h2>
                </div>
                <div>
                    <input
                        className="mt-4 px-3 py-1 w-full bg-gray-900 rounded text-gray-400 placeholder-gray-500 transition
                        border border-gray-900 hover:border-gray-500 focus:border-gray-400
                        focus:outline-none"
                        type="text"
                        placeholder="Type session name here"
                        value={confirmText}
                        onInput={ev => setConfirmText(ev.currentTarget.value)}
                    />
                </div>
                <div className="pt-4 mt-6 border-t border-white border-opacity-10 flex justify-end items-center space-x-3">
                    <Button onClick={cancelDelete}>Cancel</Button>
                    <Button onClick={deleteSession} color="darkRed" disabled={confirmText !== sessionName}>Delete</Button>
                </div>
            </div>
        </Modal>
    )
}

interface ManageDropdownProps {
    exportSession: () => void;
    exportLabels: () => void;
    openDeleteModal: () => void;
}

function ManageDropdown({exportSession, exportLabels, openDeleteModal}: ManageDropdownProps) {
    const [open, setOpen] = useState<boolean>(false);

    function closeAndRun(runFunc: () => any) {
        setOpen(false);
        runFunc();
    }

    return (
        <div className="relative">
            {open && <div className="fixed top-0 left-0 w-screen h-screen" onClick={() => setOpen(false)} />}
            <button
                className="relative px-3 py-2 rounded text-black flex items-center transition-all
                bg-gray-300 hover:bg-gray-400
                focus:ring-4 ring-gray-300 hover:ring-gray-400 ring-opacity-50 hover:ring-opacity-50
                focus:outline-none"
                onClick={() => setOpen(!open)}
            >
                <CogIcon className="w-5 h-5" />
                <span className="ml-2 font-medium">Manage</span>
                <ChevronDownIcon className="ml-4 w-5 h-5" />
            </button>
            <div className={`absolute right-0 transition-all duration-100 transform origin-top ${!open ? 'invisible scale-75 opacity-0' : 'visible scale-100 opacity-100'}`}>
                <div className="mt-2 px-2 py-1.5 w-56 bg-gray-300 rounded font-medium overflow-hidden">
                    <button className="w-full px-2 py-1.5 hover:bg-gray-400 focus:bg-gray-400 rounded text-black font-medium flex items-center focus:outline-none"
                            onClick={() => closeAndRun(exportSession)}>
                        <ExternalLinkIcon className="w-5 h-5" />
                        <span className="ml-2">Export Session</span>
                    </button>
                    <button className="w-full px-2 py-1.5 hover:bg-gray-400 focus:bg-gray-400 rounded text-black font-medium flex items-center focus:outline-none"
                            onClick={() => closeAndRun(exportLabels)}>
                        <ExternalLinkIcon className="w-5 h-5" />
                        <span className="ml-2">Export Labels</span>
                    </button>
                    <div className="mt-1.5 pt-1.5 border-t border-gray-400" />
                    <button className="w-full px-2 py-1.5 hover:bg-gray-400 focus:bg-gray-400 rounded text-black font-medium flex items-center focus:outline-none">
                        <DuplicateIcon className="w-5 h-5" />
                        <span className="ml-2">Duplicate Session</span>
                    </button>
                    <button
                        className="w-full px-2 py-1.5 hover:bg-red-700 focus:bg-red-700 rounded text-red-700 hover:text-gray-200 focus:text-gray-200 font-medium flex items-center focus:outline-none"
                        onClick={() => closeAndRun(openDeleteModal)}
                    >
                        <TrashIcon className="w-5 h-5" />
                        <span className="ml-2">Delete Session</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

function SessionTag({children}: {children?: any}) {
    return (
        <div className="pl-2 pr-3 py-0.5 bg-gray-800 rounded text-gray-400 flex items-center">
            <TagIcon className="w-4 h-4" />
            <span className="ml-1.5 text-sm">{children}</span>
        </div>
    )
}

function SlicesTable({sessionId, slices}: {sessionId: string, slices: Slice[]}) {
    return (
        <div>
            <table className="w-full table-fixed">
                <colgroup>
                    <col className="w-1/12" />
                    <col className="w-1/12" />
                    <col className="w-1/12" />
                    <col className="w-1/12" />
                    <col className="w-2/12" />
                </colgroup>
                <thead className="text-sm text-gray-400 font-medium">
                    <tr>
                        <td className="pb-1 pr-8" />
                        <td className="pb-1" colSpan={3}>Slice</td>
                        <td className="pb-1 text-center">Label</td>
                        <td />
                    </tr>
                </thead>
                <tbody className="text-gray-400">
                    {slices.map((s, i) => (
                        <tr className="group hover:text-white">
                            <td className="pr-8 text-sm text-gray-500 group-hover:text-white text-right">#{i + 1}</td>
                            <td>{s.imageRelPath}</td>
                            <td className="text-center">{s.sliceDim}</td>
                            <td className="text-center">{s.sliceIndex}</td>
                            <td className="text-center">{s.elementLabel || '-'}</td>
                            <td>
                                <Link to={`/label/${sessionId}/${s.elementIndex}`} className="text-fuchsia-300 hover:text-fuchsia-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-colors">Edit</Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function ComparisonsTable({sessionId, comparisons}: {sessionId: string, comparisons: Comparison[]}) {
    return (
        <div>
            <table className="w-full">
                <colgroup>
                    <col className="w-1/12" />
                    <col className="w-1/12" />
                    <col className="w-1/12" />
                    <col className="w-1/12" />
                    <col className="w-1/12" />
                    <col className="w-1/12" />
                    <col className="w-1/12" />
                </colgroup>
                <thead className="text-sm text-gray-400 font-medium">
                    <tr>
                        <td className="pb-1 pr-8" />
                        <td className="pb-1" colSpan={3}>Slice 1</td>
                        <td className="pb-1" colSpan={3}>Slice 2</td>
                        <td className="pb-1 text-center">Label</td>
                        <td />
                    </tr>
                </thead>
                <tbody className="text-gray-400">
                    {comparisons.map((c, i) => (
                        <tr className="group hover:text-white">
                            <td className="pr-8 text-sm text-gray-500 group-hover:text-white text-right">#{i + 1}</td>
                            <td>{c.imageRelPath1}</td>
                            <td className="text-center">{c.sliceDim1}</td>
                            <td>{c.sliceIndex1}</td>
                            <td>{c.imageRelPath2}</td>
                            <td className="text-center">{c.sliceDim2}</td>
                            <td>{c.sliceIndex2}</td>
                            <td className="text-center">{c.elementLabel || '-'}</td>
                            <td>
                                <Link to={`/label/${sessionId}/${c.elementIndex}`} className="text-fuchsia-300 hover:text-fuchsia-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-colors">Edit</Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function SessionOverview({sessionId, refreshDatasetSessions}: {sessionId: string, refreshDatasetSessions: () => void}) {
    const navigate = useNavigate();

    const [session, setSession] = useState<LabelingSession | null>(null);
    const [elements, setElements] = useState<SessionElement[] | null>(null);

    const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);

    useEffect(() => {
        const _session = dbapi.selectLabelingSession(sessionId);
        setSession(_session);
        if (_session.sessionType === 'Classification') setElements(dbapi.selectSessionSlices(_session.id));
        else setElements(dbapi.selectSessionComparisons(_session.id));
    }, [sessionId]);

    if (!session || !elements) {
        return <div>Loading</div>
    }

    function exportSession() {
        const sessionJsonString = sessionToJson(session.id);
        const savePath = fileapi.showSaveDialog(session.sessionName + '.json');
        if (savePath) {
            fileapi.writeTextFile(savePath, sessionJsonString);
        }
    }

    function exportLabels() {
        const labelsCsvString = sessionLabelsToCsv(session.id);
        const savePath = fileapi.showSaveDialog(session.sessionName + ' labels.csv');
        if (savePath) {
            fileapi.writeTextFile(savePath, labelsCsvString);
        }
    }

    function openDeleteModal() {
        setDeleteModalOpen(true);
    }

    function cancelDelete() {
        setDeleteModalOpen(false);
    }

    function deleteSession() {
        const datasetId = session.datasetId;

        dbapi.deleteLabelingSession(session.id);
        setDeleteModalOpen(false);
        refreshDatasetSessions();
        navigate(`/dataset/${datasetId}`);
    }

    return (
        <div className="px-16 py-8 h-screen flex flex-col">
            {deleteModalOpen && <DeleteSessionModal sessionName={session.sessionName} deleteSession={deleteSession} cancelDelete={cancelDelete} />}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-5xl font-medium">{session.sessionName}</h1>
                    <div className="mt-3 flex space-x-2">
                        <SessionTag>{session.sessionType} Session</SessionTag>
                        {session.comparisonSampling && <SessionTag>{session.comparisonSampling} Sampling</SessionTag>}
                    </div>
                </div>
                <div>
                    <ManageDropdown exportSession={exportSession} exportLabels={exportLabels} openDeleteModal={openDeleteModal} />
                </div>
            </div>
            <div className="mt-6 self-start">
                <LinkButton to={`/label/${sessionId}/0`} color="fuchsia">
                    <PlayIcon className="w-5 h-5" />
                    <span className="ml-2 mr-2 font-medium">Start Labeling</span>
                </LinkButton>
            </div>
            <div className="mt-2">
                <span>{elements.map(e => e.elementLabel ? 1 : 0).reduce((a, b) => a + b, 0)} / {elements.length}</span>
                <span className="text-gray-400"> {session.sessionType === 'Classification' ? 'slices' : 'comparisons'} labeled</span>
            </div>
            <div className="mt-1 py-2 bg-gray-800 rounded overflow-y-scroll">
                {session.sessionType === 'Classification'
                    ? <SlicesTable sessionId={sessionId} slices={elements as Slice[]} />
                    : <ComparisonsTable sessionId={sessionId} comparisons={elements as Comparison[]} />
                }
            </div>
        </div>
    )
}

export {SessionOverview};
