import * as React from 'react';
import {useEffect, useState} from 'react';
import {Comparison, dbapi, LabelingSession, SessionElement, Slice} from '../backend';
import {LinkButton} from './Buttons';
import {
    ChevronDownIcon,
    CogIcon,
    DuplicateIcon,
    ExternalLinkIcon,
    PlayIcon,
    TagIcon,
    TrashIcon
} from '@heroicons/react/solid';

function ManageDropdown() {
    const [open, setOpen] = useState<boolean>(false);

    return (
        <div className="relative">
            {open && <div className="fixed top-0 left-0 w-screen h-screen" onClick={() => setOpen(false)} />}
            <button
                className="relative px-3 py-2 bg-gray-300 rounded text-black focus:outline-none focus:ring-4 ring-gray-300 ring-opacity-50 flex items-center"
                onClick={() => setOpen(!open)}
            >
                <CogIcon className="w-5 h-5" />
                <span className="ml-2 font-medium">Manage</span>
                <ChevronDownIcon className="ml-4 w-5 h-5" />
            </button>
            {open && (
                <div className="absolute right-0 mt-2 py-1.5 w-56 bg-gray-300 rounded font-medium overflow-hidden">
                    <button className="w-full px-4 py-1.5 hover:bg-gray-400 focus:bg-gray-400 text-black font-medium flex items-center focus:outline-none">
                        <ExternalLinkIcon className="w-5 h-5" />
                        <span className="ml-2">Export Session</span>
                    </button>
                    <button className="w-full px-4 py-1.5 hover:bg-gray-400 focus:bg-gray-400 text-black font-medium flex items-center focus:outline-none">
                        <ExternalLinkIcon className="w-5 h-5" />
                        <span className="ml-2">Export Labels</span>
                    </button>
                    <div className="mt-1.5 pt-1.5 border-t border-gray-400" />
                    <button className="w-full px-4 py-1.5 hover:bg-gray-400 focus:bg-gray-400 text-black font-medium flex items-center focus:outline-none">
                        <DuplicateIcon className="w-5 h-5" />
                        <span className="ml-2">Duplicate Session</span>
                    </button>
                    <button
                        className="w-full px-4 py-1.5 hover:bg-red-700 focus:bg-red-700 text-red-700 hover:text-gray-200 focus:text-gray-200 font-medium flex items-center focus:outline-none"
                    >
                        <TrashIcon className="w-5 h-5" />
                        <span className="ml-2">Delete Session</span>
                    </button>
                </div>
            )}
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

function SlicesTable({slices}: {slices: Slice[]}) {
    return (
        <div>
            <table className="w-full table-fixed">
                <colgroup>
                    <col className="w-1/12" />
                    <col className="w-2/12" />
                    <col className="w-2/12" />
                    <col className="w-1/12" />
                </colgroup>
                <thead className="text-sm text-gray-400 font-medium">
                    <tr>
                        <td className="pb-1 pr-8" />
                        <td className="pb-1" colSpan={3}>Slice</td>
                        <td className="pb-1 text-center">Label</td>
                        <td className="pb-1 text-center">Last Edited</td>
                    </tr>
                </thead>
                <tbody className="text-gray-400">
                    {slices.map((s, i) => (
                        <tr>
                            <td className="pr-8 text-sm text-gray-500 text-right">#{i + 1}</td>
                            <td className="">{s.imageRelPath}</td>
                            <td>{s.orientation}</td>
                            <td className="">{s.sliceIndex}</td>
                            <td className="text-center">-</td>
                            <td className="text-center">-</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function ComparisonsTable({comparisons}: {comparisons: Comparison[]}) {
    return (
        <div>
            <table className="w-full">
                <colgroup>
                    <col className="w-1/12" />
                    <col className="w-2/12" />
                    <col className="w-1/12" />
                    <col className="w-1/12" />
                    <col className="w-2/12" />
                    <col className="w-1/12" />
                    <col className="w-1/12" />
                </colgroup>
                <thead className="text-sm text-gray-400 font-medium">
                    <tr>
                        <td className="pb-1 pr-8" />
                        <td className="pb-1" colSpan={3}>Slice 1</td>
                        <td className="pb-1" colSpan={3}>Slice 2</td>
                        <td className="pb-1 text-center">Label</td>
                        <td className="pb-1 text-center">Last Edited</td>
                    </tr>
                </thead>
                <tbody className="text-gray-400">
                    {comparisons.map((c, i) => (
                        <tr>
                            <td className="pr-8 text-sm text-gray-500 text-right">#{i + 1}</td>
                            <td>{c.imageRelPath1}</td>
                            <td>{c.orientation1}</td>
                            <td>{c.sliceIndex1}</td>
                            <td>{c.imageRelPath2}</td>
                            <td>{c.orientation2}</td>
                            <td>{c.sliceIndex2}</td>
                            <td className="text-center">-</td>
                            <td className="text-center">-</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function SessionOverview({sessionId}: {sessionId: number}) {
    const [session, setSession] = useState<LabelingSession | null>(null);
    const [elements, setElements] = useState<SessionElement[] | null>(null);

    useEffect(() => {
        const _session = dbapi.selectLabelingSession(sessionId);
        setSession(_session);
        if (_session.sessionType === 'Classification') setElements(dbapi.selectSessionSlices(_session.id));
        else setElements(dbapi.selectSessionComparisons(_session.id));
    }, [sessionId]);

    if (!session || !elements) {
        return <div>Loading</div>
    }

    return (
        <div className="px-16 pt-12 pb-8 h-screen flex flex-col">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-5xl font-medium">{session.sessionName}</h1>
                    <div className="mt-3 flex">
                        <SessionTag>{session.sessionType} Session</SessionTag>
                    </div>
                </div>
                <div>
                    <ManageDropdown />
                </div>
            </div>
            <div className="mt-6 self-start">
                <LinkButton to={`/label/${sessionId}/0`} color="pink">
                    <PlayIcon className="w-5 h-5" />
                    <span className="mx-1 font-medium">Start Labeling</span>
                </LinkButton>
            </div>
            <div className="mt-2">
                <span>0 / {elements.length}</span>
                <span className="text-gray-400"> {session.sessionType === 'Classification' ? 'slices' : 'comparisons'} labeled</span>
            </div>
            <div className="mt-1 p-2 bg-gray-800 rounded overflow-y-scroll">
                {session.sessionType === 'Classification'
                    ? <SlicesTable slices={elements as Slice[]} />
                    : <ComparisonsTable comparisons={elements as Comparison[]} />
                }
            </div>
        </div>
    )
}

export {SessionOverview};
