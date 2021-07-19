import * as React from 'react';
import {useEffect, useState} from 'react';
import {dbapi, LabelingSession, Slice} from '../backend';
import {LinkButton} from './Buttons';
import {ChevronDownIcon, CogIcon, PlayIcon, TagIcon} from '@heroicons/react/solid';

function ManageDropdown() {
    return (
        <button className="px-3 py-2 bg-gray-300 rounded text-black focus:outline-none focus:ring-4 ring-gray-300 ring-opacity-50 flex items-center">
            <CogIcon className="w-5 h-5" />
            <span className="ml-2 font-medium">Manage</span>
            <ChevronDownIcon className="ml-4 w-5 h-5" />
        </button>
    )
}

function SessionTag({children}: {children?: any}) {
    return (
        <div className="px-3 py-1 bg-gray-800 rounded text-gray-400 flex items-center">
            <TagIcon className="w-5 h-5" />
            <span className="ml-1.5">{children}</span>
        </div>
    )
}

function SlicesTable({slices}: {slices: Slice[]}) {
    return (
        <div className="p-2 bg-gray-800 rounded">
            <table className="w-1/2">
                <thead className="text-sm text-gray-400 font-medium">
                    <tr>
                        <td className="pb-1 pr-8" />
                        <td className="pb-1">Slice</td>
                        <td className="pb-1" />
                        <td className="pb-1" />
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
                            <td className="text-center">{s.sliceIndex}</td>
                            <td className="text-center">-</td>
                            <td className="text-center">2 hours ago</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function SessionOverview({sessionId}: {sessionId: number}) {
    const [session, setSession] = useState<LabelingSession | null>(null);
    const [slices, setSlices] = useState<Slice[] | null>(null);

    useEffect(() => {
        setSession(dbapi.selectLabelingSession(sessionId));
        setSlices(dbapi.selectSessionSlices(sessionId));
    }, [sessionId]);

    if (!session || !slices) {
        return <div>Loading</div>
    }

    return (
        <div className="px-16 pt-12 pb-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-4xl font-medium">{session.sessionName}</h1>
                    <div className="mt-1 flex">
                        <SessionTag>Classification Session</SessionTag>
                    </div>
                </div>
                <div>
                    <ManageDropdown />
                </div>
            </div>
            <div className="mt-6 inline-block">
                <LinkButton to={`/label/${sessionId}/0`} color="pink">
                    <PlayIcon className="w-5 h-5" />
                    <span className="ml-1 font-medium">Start Labeling</span>
                </LinkButton>
            </div>
            <div className="mt-4">
                <div>
                    <div>
                        <span>0 / {slices.length}</span>
                        <span className="text-gray-400"> slices labeled</span>
                    </div>
                </div>
                <div className="mt-1">
                    <SlicesTable slices={slices} />
                </div>
            </div>
        </div>
    )
}

export {SessionOverview};
