import * as React from 'react';
import {useEffect, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {Comparison, dbapi, ElementLabel, LabelingSession, SessionElement, Slice} from '../backend';
import {useTimer} from '../hooks/useTimer';
import {InputRange} from './Inputs';
import {Button} from './Buttons';
import {Modal} from './Modal';
import {VolumeSlice} from './VolumeSlice';
import {buildSortMatrix, sortSlices} from '../sort';
import {splitLabelOptions} from '../utils';
import {ChevronLeftIcon, ChevronRightIcon, XIcon} from '@heroicons/react/outline';
import {
    ArrowLeftIcon,
    ChatAltIcon,
    CollectionIcon,
    ColorSwatchIcon,
    QuestionMarkCircleIcon,
    RefreshIcon, SunIcon
} from '@heroicons/react/solid';

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
            <button
                className="px-3 py-1.5 bg-gray-400 hover:bg-gray-500 rounded-r focus:outline-none focus:ring-4 ring-gray-400 hover:ring-gray-500 ring-opacity-50 hover:ring-opacity-50 transition"
                onClick={handleResetClick}
            >
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
                    <button className="rounded text-gray-400 hover:text-gray-100 focus:ring-2 ring-gray-400 transition focus:outline-none" onClick={() => closeModal()}>
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="mt-2 px-3 overflow-y-scroll">
                    <table className="w-full">
                        <thead className="text-xs text-gray-400 font-medium">
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

const DEFAULT_BRIGHTNESS = 50;

interface LabelSliceProps {
    datasetRootPath: string;
    imageRelPath: string;
    sliceDim: number;
    sliceIndex: number;
    bindKey: string | null;
    selected: boolean;
    onImageClick: (() => void) | null;
}

function LabelSlice({datasetRootPath, imageRelPath, sliceDim, sliceIndex, bindKey, selected, onImageClick}: LabelSliceProps) {
    const [brightness, setBrightness] = useState<number>(DEFAULT_BRIGHTNESS);

    function handleClick() {
        if (onImageClick) onImageClick();
    }

    return (
        <div>
            <div
                className={`bg-black rounded ${selected ? 'border-2' : ''} border-pink-900 overflow-hidden flex justify-center items-center ${bindKey ? 'cursor-pointer' : ''}`}
                style={{width: '65vh', height: '65vh'}}
                onClick={handleClick}
            >
                <VolumeSlice imagePath={datasetRootPath + '/' + imageRelPath} sliceDim={sliceDim} sliceIndex={sliceIndex} brightness={brightness} />
            </div>
            <div className="mt-3 px-2 py-1 bg-gray-800 rounded flex items-center">
                <SunIcon className="mr-2 w-6 h-6 text-gray-400" />
                <InputRange min={0} max={100} step={0.01} value={brightness} setValue={setBrightness} />
                <button
                    className="ml-3 rounded text-gray-500 hover:text-gray-400 active:text-gray-100 focus:outline-none focus:ring-2 ring-gray-600 transition"
                    onClick={() => setBrightness(DEFAULT_BRIGHTNESS)}
                >
                    <RefreshIcon className="w-5 h-5" />
                </button>
                <div className="ml-3 py-0.5 w-12 bg-gray-700 rounded text-gray-400 text-center">{Math.round(brightness)}</div>
            </div>
            <div className="mt-2 p-2 bg-gray-800 rounded text-gray-400 text-center">
                <div className="flex justify-center items-center">
                    <div className="ml-2 text-xl">{imageRelPath} {sliceDim} {sliceIndex}</div>
                </div>
                {bindKey && <div className="text-sm">Click or press "{bindKey}".</div>}
            </div>
        </div>
    )
}

interface LabelControlsProps {
    additional: boolean;
    labelOptions: string[];
    labels: ElementLabel[];
    addLabel: (string) => void;
    bindStart: number;
}

function LabelControls({additional, labelOptions, labels, addLabel, bindStart}: LabelControlsProps) {
    const curLabelValue = labels.length > 0 ? labels[0].labelValue : null;
    const skeletonLabels = Array.from(Array(Math.max(3 - labelOptions.length, 0)).keys());

    return (
        <div>
            <div className="text-gray-400 flex items-center">
                <ColorSwatchIcon className="w-5 h-5" />
                <span className="ml-1">{additional && 'Additional '}Labels</span>
            </div>
            <div className="mt-3 flex flex-col space-y-3">
                {labelOptions.map((labelOption, i) => {
                    return (
                        <Button
                            size="lg"
                            color={labelOption === curLabelValue ? 'darkPink' : 'darkGray'}
                            onClick={() => addLabel(labelOption)}
                        >
                            <span>{labelOption} ({i + bindStart + 1})</span>
                        </Button>
                    )
                })}
                {skeletonLabels.map(i => <div className="bg-gray-800 rounded h-10" />)}
            </div>
        </div>
    )
}

interface ClassificationControlsProps {
    session: LabelingSession;
    slice: Slice;
    labels: ElementLabel[];
    addLabel: (labelValue: string) => void;
}

function ClassificationControls({session, slice, labels, addLabel}: ClassificationControlsProps) {
    return (
        <div className="flex justify-center items-start">
            <div>
                <LabelSlice
                    datasetRootPath={slice.datasetRootPath}
                    imageRelPath={slice.imageRelPath}
                    sliceDim={slice.sliceDim}
                    sliceIndex={slice.sliceIndex}
                    bindKey={null}
                    selected={false}
                    onImageClick={null}
                />
            </div>
            <div className="ml-6 w-56">
                <LabelControls additional={false} labelOptions={session.labelOptions.split(',')} labels={labels} addLabel={addLabel} bindStart={0} />
            </div>
        </div>
    )
}

interface ComparisonControlsProps {
    session: LabelingSession;
    comparison: Comparison;
    labels: ElementLabel[];
    addLabel: (labelValue: string) => void;
}

function ComparisonControls({session, comparison, labels, addLabel}: ComparisonControlsProps) {
    const curLabelValue = labels.length > 0 ? labels[0].labelValue : null;
    return (
        <div className="flex justify-center items-start">
            <div className="flex items-center space-x-4">
                <LabelSlice
                    datasetRootPath={comparison.datasetRootPath}
                    imageRelPath={comparison.imageRelPath1}
                    sliceDim={comparison.sliceDim1}
                    sliceIndex={comparison.sliceIndex1}
                    bindKey="1"
                    selected={curLabelValue === 'First'}
                    onImageClick={() => addLabel('First')}
                />
                <LabelSlice
                    datasetRootPath={comparison.datasetRootPath}
                    imageRelPath={comparison.imageRelPath2}
                    sliceDim={comparison.sliceDim2}
                    sliceIndex={comparison.sliceIndex2}
                    bindKey="2"
                    selected={curLabelValue === 'Second'}
                    onImageClick={() => addLabel('Second')}
                />
            </div>
            <div className="ml-6 w-48">
                <LabelControls additional={true} labelOptions={splitLabelOptions(session.labelOptions)} labels={labels} addLabel={addLabel} bindStart={2} />
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
            const _elements = (session.sessionType === 'Classification')
                ? dbapi.selectSessionSlices(session.id)
                : dbapi.selectSessionComparisons(session.id);

            setElements(_elements);

            const _curElement = _elements[parseInt(elementIndex)];
            const _labels = dbapi.selectElementLabels(_curElement.id);
            setCurElement({
                element: _curElement,
                labels: _labels,
            });
        }
    }, [elementIndex, session]);

    function addLabel(labelValue: string) {
        if (curElement.labels.length > 0 && curElement.labels[0].labelValue === labelValue) return;
        if (session.comparisonSampling === 'Sort' && parseInt(elementIndex) < elements.length - 1) return; //TODO: allow changing past labels
        const element = curElement.element;
        const finishTimestamp = Date.now();
        dbapi.insertElementLabel(element.id, labelValue, startTimestamp, finishTimestamp);

        const newLabels = dbapi.selectElementLabels(element.id);
        setCurElement({
            element: element,
            labels: newLabels,
        });
        resetTimer();

        if (session.comparisonSampling === 'Sort') {
            const comparisonLabels = dbapi.selectSessionLatestComparisonLabels(session.id);
            const matrix = buildSortMatrix(elements as Comparison[], comparisonLabels);
            const slices = dbapi.selectSessionSlices(session.id);

            const sortResult = sortSlices(matrix, slices);
            if (!Array.isArray(sortResult)) {
                dbapi.insertComparison(session.id, elements.length, sortResult.slice1, sortResult.slice2);
                setElements(dbapi.selectSessionComparisons(session.id));
            }
            else {
                console.log('Sort Results:', sortResult.map(r => r.elementIndex));
            }
        }
    }

    function closeModal() {
        setModal(null);
    }

    if (!session || !curElement) {
        return <div className="w-screen h-screen text-2xl text-gray-400 font-medium flex justify-center items-center">Loading...</div>
    }

    let modalEl = null;
    if (modal === 'pastLabels') modalEl = <PastLabelsModal labels={curElement.labels} closeModal={closeModal} />

    return (
        <div>
            {modalEl}
            <header className="py-2 pl-4 pr-2 bg-gray-800 flex justify-between items-center">
                <div className="w-1/4">
                    <Link to={`/dataset/${session.datasetId}/session/${session.id}`} className="text-gray-400 hover:text-fuchsia-300 transition inline-flex items-center">
                        <ArrowLeftIcon className="w-5 h-5" />
                        <span className="ml-1.5 text-lg font-medium">{session.sessionName}</span>
                    </Link>
                </div>
                <div>
                    <div className="flex items-center">
                        <Link to={elementIndexInt > 0 && `/label/${sessionId}/${elementIndexInt - 1}`} className="p-4 text-gray-500 hover:text-white transition">
                            <ChevronLeftIcon className="w-6 h-6" />
                        </Link>
                        <div className="mx-16">
                            <h1 className="w-48 text-xl font-medium text-center">{curElement.element.elementType} {elementIndexInt + 1}</h1>
                            <div className="mt-0.5 text-sm text-gray-400 font-medium text-center">{session.prompt}</div>
                        </div>
                        <Link to={elementIndexInt < (elements.length - 1) && `/label/${sessionId}/${elementIndexInt + 1}`} className="p-4 text-gray-500 hover:text-white transition">
                            <ChevronRightIcon className="w-6 h-6" />
                        </Link>
                    </div>
                </div>
                <div className="w-1/4 flex justify-end items-center">
                    <button className="text-gray-400 flex items-center">
                        <QuestionMarkCircleIcon className="w-5 h-5" />
                        <span className="ml-1 font-medium">Keymap</span>
                    </button>
                    <div className="ml-8 space-x-3">
                        <button
                            className="bg-gray-400 hover:bg-gray-500 rounded p-1.5 focus:outline-none focus:ring-4 ring-gray-400 hover:ring-gray-500 ring-opacity-50 hover:ring-opacity-50 transition"
                        >
                            <ChatAltIcon className="text-gray-800 w-5 h-5" />
                        </button>
                        <button
                            className="bg-gray-400 hover:bg-gray-500 rounded p-1.5 focus:outline-none focus:ring-4 ring-gray-400 hover:ring-gray-500 ring-opacity-50 hover:ring-opacity-50 transition"
                            onClick={() => setModal('pastLabels')}
                        >
                            <CollectionIcon className="text-gray-800 w-5 h-5" />
                        </button>
                    </div>
                    <div className="ml-6">
                        <LabelTimer timerSeconds={timerSeconds} resetTimer={resetTimer} />
                    </div>
                </div>
            </header>
            <main className="mt-6">
                {session.sessionType === 'Classification'
                    ? <ClassificationControls session={session} slice={curElement.element as Slice} labels={curElement.labels} addLabel={addLabel} />
                    : <ComparisonControls session={session} comparison={curElement.element as Comparison} labels={curElement.labels} addLabel={addLabel} />
                }
            </main>
        </div>
    )
}

export {LabelView};
