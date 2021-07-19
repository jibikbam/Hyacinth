import * as React from 'react';
import {Link, useParams} from 'react-router-dom';
import {ChevronLeftIcon, ChevronRightIcon} from '@heroicons/react/outline';
import {useEffect, useState} from 'react';
import {dbapi, LabelingSession, Slice} from '../backend';
import {
    ArrowLeftIcon,
    ChatAltIcon,
    CollectionIcon,
    ColorSwatchIcon,
    QuestionMarkCircleIcon,
    RefreshIcon
} from '@heroicons/react/solid';
import {VolumeSlice} from './VolumeSlice';
import {Button} from './Buttons';

function LabelView() {
    let {sessionId, elementIndex} = useParams();
    elementIndex = parseInt(elementIndex);

    const [session, setSession] = useState<LabelingSession | null>(null);
    const [slices, setSlices] = useState<Slice[]>(null);

    const [timerSeconds, setTimerSeconds] = useState<number>(0);

    useEffect(() => {
        setSession(dbapi.selectLabelingSession(sessionId));
        setSlices(dbapi.selectSessionSlices(sessionId));
    }, [sessionId]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setTimerSeconds(s => s + 1);
        }, 1000);

        return () => {
            clearInterval(intervalId);
        }
    }, []);

    if (!session || !slices) {
        return <div>Loading</div>
    }

    const curSlice = slices[elementIndex];

    return (
        <div>
            <header className="pt-3 pb-1 pl-4 pr-2 bg-gray-800 flex justify-between items-center">
                <div className="w-1/4">
                    <Link to={`/dataset/${session.datasetId}/session/${session.id}`} className="text-gray-400 flex items-center">
                        <ArrowLeftIcon className="w-5 h-5" />
                        <span className="ml-1 text-lg font-medium">{session.sessionName}</span>
                    </Link>
                </div>
                <div>
                    <div className="flex items-center">
                        <Link to={elementIndex > 0 && `/label/${sessionId}/${elementIndex - 1}`}>
                            <ChevronLeftIcon className="text-gray-500 w-6 h-6" />
                        </Link>
                        <h1 className="mx-2 w-32 text-xl font-medium text-center">Slice {elementIndex + 1} / {slices.length}</h1>
                        <Link to={elementIndex < (slices.length - 1) && `/label/${sessionId}/${elementIndex + 1}`}>
                            <ChevronRightIcon className="text-gray-500 w-6 h-6" />
                        </Link>
                    </div>
                    <div className="mt-0.5 text-sm text-gray-400 font-medium text-center">{session.prompt}</div>
                </div>
                <div className="w-1/4 flex justify-end items-center">
                    <button className="text-gray-400 flex items-center">
                        <QuestionMarkCircleIcon className="w-5 h-5" />
                        <span className="ml-1 font-medium">Keymap</span>
                    </button>
                    <div className="ml-8 space-x-3">
                        <button className="bg-gray-400 rounded p-1.5 focus:outline-none focus:ring-4 ring-gray-400 ring-opacity-50">
                            <ChatAltIcon className="text-gray-800 w-5 h-5" />
                        </button>
                        <button className="bg-gray-400 rounded p-1.5 focus:outline-none focus:ring-4 ring-gray-400 ring-opacity-50">
                            <CollectionIcon className="text-gray-800 w-5 h-5" />
                        </button>
                    </div>
                    <div className="ml-6 flex">
                        <div className="px-3 bg-gray-600 rounded-l flex items-center">
                            <span className="text-gray-300 font-mono">{Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}</span>
                        </div>
                        <button className="px-3 py-1.5 bg-gray-400 rounded-r focus:outline-none focus:ring-4 ring-gray-400 ring-opacity-50" onClick={() => setTimerSeconds(0)}>
                            <RefreshIcon className="text-gray-800 w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>
            <main className="mt-6 flex justify-center items-start">
                <div>
                    <div className="bg-black rounded overflow-hidden flex justify-center items-center" style={{width: '80vh', height: '80vh'}}>
                        <VolumeSlice imagePath={curSlice.datasetRootPath + '/' + curSlice.imageRelPath} sliceIndex={curSlice.sliceIndex} />
                    </div>
                </div>
                <div className="ml-6 w-56">
                    <div className="text-gray-400 flex items-center">
                        <ColorSwatchIcon className="w-5 h-5" />
                        <span className="ml-1">Other Labels</span>
                    </div>
                    <div className="mt-3 flex flex-col space-y-3">
                        {session.labelOptions.split(',').map((label, i) => {
                            return (
                                <button className="py-2 bg-gray-600 rounded text-lg text-white focus:outline-none focus:ring-4 ring-gray-600 ring-opacity-50 flex justify-center">
                                    <span>{label} ({i + 1})</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </main>
        </div>
    )
}

export {LabelView};
