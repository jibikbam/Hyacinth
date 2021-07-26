import * as React from 'react';
import {useEffect, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {dbapi, ElementLabel, LabelingSession, SessionElement, Slice} from '../backend';
import {useTimer} from '../hooks/useTimer';
import {InputRange} from './Inputs';
import {VolumeSlice} from './VolumeSlice';
import {ChevronLeftIcon, ChevronRightIcon, XIcon} from '@heroicons/react/outline';
import {
    ArrowLeftIcon,
    ChatAltIcon,
    CollectionIcon,
    ColorSwatchIcon,
    QuestionMarkCircleIcon,
    RefreshIcon, SunIcon
} from '@heroicons/react/solid';
import {Button} from './Buttons';
import {Modal} from './Modal';

function LabelTimer({timerSeconds, resetTimer}: {timerSeconds: number, resetTimer: Function}) {
    const minutes = Math.floor(timerSeconds / 60).toString();
    const seconds = Math.floor(timerSeconds % 60).toString().padStart(2, '0');

    function handleResetClick() {
        resetTimer();
    }

    return (
        <div className="flex">
            <div className="px-3 bg-gray-600 rounded-l flex items-center">
                <span className="text-gray-300 font-mono">{minutes}:{seconds}</span>
            </div>
            <button className="px-3 py-1.5 bg-gray-400 rounded-r focus:outline-none focus:ring-4 ring-gray-400 ring-opacity-50" onClick={handleResetClick}>
                <RefreshIcon className="text-gray-800 w-5 h-5" />
            </button>
        </div>
    )
}

function PastLabelsModal({labels, closeModal}: {labels: ElementLabel[], closeModal: () => void}) {
    return (
        <Modal closeModal={closeModal}>
            <div className="mt-32 w-1/3 h-144 bg-gray-800 rounded flex flex-col">
                <div className="px-3 py-1 bg-gray-700 rounded-t flex justify-between items-center">
                    <div className="text-lg text-gray-200 font-medium">Label History</div>
                    <button className="rounded text-gray-400 hover:text-gray-100 focus:ring-2 ring-gray-400" onClick={() => closeModal()}>
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="mt-2 px-3 overflow-y-scroll">
                    <table className="w-full">
                        <thead className="text-sm text-gray-400 font-medium">
                            <tr>
                                <td className="pb-1">Label</td>
                                <td className="pb-1">Date Labeled</td>
                                <td className="pb-1">Timer</td>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-gray-400">
                        {labels.map(label => {
                            const secondsTaken = Math.round((label.finishTimestamp - label.startTimestamp) / 1000);
                            const minutes = Math.floor(secondsTaken / 60);
                            const seconds = (secondsTaken % 60).toString().padStart(2, '0');
                            return (
                                <tr>
                                    <td>{label.labelValue}</td>
                                    <td>{new Date(label.finishTimestamp).toLocaleDateString('en-US', {hour: '2-digit', minute: '2-digit'})}</td>
                                    <td>{minutes}:{seconds}</td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                    {labels.length === 0 && <div className="mt-12 text-lg text-gray-400 font-medium text-center">No labels yet.</div>}
                </div>
            </div>
        </Modal>
    )
}

const DEFAULT_BRIGHTNESS = 80;

function LabelSlice({slice}: {slice: Slice}) {
    const [brightness, setBrightness] = useState<number>(DEFAULT_BRIGHTNESS);

    return (
        <div>
            <div className="bg-black rounded overflow-hidden flex justify-center items-center" style={{width: '70vh', height: '70vh'}}>
                <VolumeSlice imagePath={slice.datasetRootPath + '/' + slice.imageRelPath} sliceIndex={slice.sliceIndex} />
            </div>
            <div className="mt-3 px-2 py-1 bg-gray-800 rounded flex items-center">
                <SunIcon className="mr-2 w-6 h-6 text-gray-400" />
                <InputRange min={0} max={100} step={0.01} value={brightness} setValue={setBrightness} />
                <button
                    className="ml-3 rounded text-gray-500 hover:text-gray-400 active:text-gray-100 focus:outline-none focus:ring-2 ring-gray-600"
                    onClick={() => setBrightness(DEFAULT_BRIGHTNESS)}
                >
                    <RefreshIcon className="w-5 h-5" />
                </button>
                <div className="ml-3 py-0.5 w-12 bg-gray-700 rounded text-gray-400 text-center">{Math.round(brightness)}</div>
            </div>
            <div className="mt-2 p-2 bg-gray-800 rounded text-gray-400 text-center">
                <div className="text-xl">{slice.imageRelPath} {slice.orientation} {slice.sliceIndex}</div>
            </div>
        </div>
    )
}

interface LabelControlsProps {
    labelOptions: string[];
    labels: ElementLabel[];
    addLabel: (string) => void;
}

function LabelControls({labelOptions, labels, addLabel}: LabelControlsProps) {
    const curLabelValue = labels.length > 0 ? labels[0].labelValue : null;

    function handleLabelButtonClick(labelOption: string) {
        if (labelOption !== curLabelValue) addLabel(labelOption);
    }

    return (
        <div>
            <div className="text-gray-400 flex items-center">
                <ColorSwatchIcon className="w-5 h-5" />
                <span className="ml-1">Other Labels</span>
            </div>
            <div className="mt-3 flex flex-col space-y-3">
                {labelOptions.map((labelOption, i) => {
                    return (
                        <Button
                            color={labelOption === curLabelValue ? 'pink' : 'gray'}
                            onClick={() => handleLabelButtonClick(labelOption)}
                        >
                            <span>{labelOption} ({i + 1})</span>
                        </Button>
                    )
                })}
            </div>
        </div>
    )
}

interface ClassificationControlsProps {
    session: LabelingSession;
    curSlice: Slice;
    labels: ElementLabel[];
    addLabel: (labelValue: string) => void;
}

function ClassificationControls({session, curSlice, labels, addLabel}: ClassificationControlsProps) {
    return (
        <div className="flex justify-center items-start">
            <div>
                <LabelSlice slice={curSlice} />
            </div>
            <div className="ml-6 w-56">
                <LabelControls labelOptions={session.labelOptions.split(',')} labels={labels} addLabel={addLabel} />
            </div>
        </div>
    )
}

type LabelModal = 'pastLabels';

function LabelView() {
    let {sessionId, elementIndex} = useParams();
    const elementIndexInt = parseInt(elementIndex);

    const [session, setSession] = useState<LabelingSession | null>(null);
    const [elements, setElements] = useState<SessionElement[] | null>(null);
    const [curElement, setCurElement] = useState<{element: SessionElement, labels: ElementLabel[]} | null>(null);

    const [modal, setModal] = useState<LabelModal | null>(null);

    const [startTimestamp, timerSeconds, resetTimer] = useTimer();

    useEffect(() => {
        setSession(dbapi.selectLabelingSession(sessionId));
    }, [sessionId]);

    useEffect(() => {
        if (session) {
            if (session.sessionType === 'Classification') {
                const _elements = dbapi.selectSessionSlices(session.id);
                setElements(_elements);

                const _curElement = _elements[parseInt(elementIndex)];
                const _labels = dbapi.selectElementLabels(_curElement.id);
                setCurElement({
                    element: _curElement,
                    labels: _labels,
                });
            }
        }
    }, [elementIndex, session]);

    function addLabel(labelValue: string) {
        const element = curElement.element;
        const finishTimestamp = Date.now();
        dbapi.insertElementLabel(element.id, labelValue, startTimestamp, finishTimestamp);

        const newLabels = dbapi.selectElementLabels(element.id);
        setCurElement({
            element: element,
            labels: newLabels,
        })
    }

    function closeModal() {
        setModal(null);
    }

    if (!session || !curElement) {
        return <div>Loading</div>
    }

    let modalEl = null;
    if (modal === 'pastLabels') modalEl = <PastLabelsModal labels={curElement.labels} closeModal={closeModal} />

    return (
        <div>
            {modalEl}
            <header className="pt-3 pb-1 pl-4 pr-2 bg-gray-800 flex justify-between items-center">
                <div className="w-1/4">
                    <Link to={`/dataset/${session.datasetId}/session/${session.id}`} className="text-gray-400 flex items-center">
                        <ArrowLeftIcon className="w-5 h-5" />
                        <span className="ml-1 text-lg font-medium">{session.sessionName}</span>
                    </Link>
                </div>
                <div>
                    <div className="flex items-center">
                        <Link to={elementIndexInt > 0 && `/label/${sessionId}/${elementIndexInt - 1}`}>
                            <ChevronLeftIcon className="text-gray-500 w-6 h-6" />
                        </Link>
                        <h1 className="mx-2 w-32 text-xl font-medium text-center">Slice {elementIndexInt + 1}</h1>
                        <Link to={elementIndexInt < (elements.length - 1) && `/label/${sessionId}/${elementIndexInt + 1}`}>
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
                        <button className="bg-gray-400 rounded p-1.5 focus:outline-none focus:ring-4 ring-gray-400 ring-opacity-50" onClick={() => setModal('pastLabels')}>
                            <CollectionIcon className="text-gray-800 w-5 h-5" />
                        </button>
                    </div>
                    <div className="ml-6">
                        <LabelTimer timerSeconds={timerSeconds} resetTimer={resetTimer} />
                    </div>
                </div>
            </header>
            <main className="mt-6">
                <ClassificationControls session={session} curSlice={curElement.element as Slice} labels={curElement.labels} addLabel={addLabel} />
            </main>
        </div>
    )
}

export {LabelView};
