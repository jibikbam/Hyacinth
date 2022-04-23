import * as React from 'react';
import {useEffect, useMemo, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {Comparison, dbapi, ElementLabel, LabelingSession, SessionElement, Slice} from '../../backend';
import {useTimer} from '../../hooks/useTimer';
import {InputRange} from '../Inputs';
import {Button} from '../Buttons';
import {Modal} from '../Modal';
import {RenderedImage} from '../RenderedImage';
import {ChevronLeftIcon, ChevronRightIcon, XIcon} from '@heroicons/react/outline';
import {
    ArrowLeftIcon,
    ChatAltIcon,
    CollectionIcon,
    ColorSwatchIcon,
    QuestionMarkCircleIcon,
    RefreshIcon, SunIcon
} from '@heroicons/react/solid';
import * as Utils from '../../utils';
import * as Session from '../../sessions/session';

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
                <div className="px-3 py-2 bg-gray-700 rounded-t flex justify-between items-center">
                    <div className="text-gray-400 font-medium">Label History</div>
                    <button className="rounded text-gray-400 hover:text-gray-100 focus:ring-2 ring-gray-400 transition focus:outline-none" onClick={() => closeModal()}>
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="mt-3 px-3 overflow-y-scroll">
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
                                <tr key={label.id}>
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

interface LabelSliceProps {
    datasetRootPath: string;
    imageRelPath: string;
    sliceDim: number;
    sliceIndex: number;
    bindKey: string | null;
    selected: boolean;
    onImageClick: (() => void) | null;
}

const DEFAULT_BRIGHTNESS = 99.5;
const [MIN_BRIGHTNESS, MAX_BRIGHTNESS] = [90, 100];
const KEYBOARD_BRIGHTNESS_STEP = 0.5;

function LabelSlice({datasetRootPath, imageRelPath, sliceDim, sliceIndex, bindKey, selected, onImageClick}: LabelSliceProps) {
    const [brightness, setBrightness] = useState<number>(DEFAULT_BRIGHTNESS);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [brightness]);

    function handleKeyDown(event: KeyboardEvent) {
        if (event.code === 'ArrowDown' || event.code === 'KeyS') {
            // Increase brightness value (dims image)
            if (event.getModifierState('Shift')) {
                setBrightness(MAX_BRIGHTNESS);
            }
            else {
                setBrightness(Math.min(brightness + KEYBOARD_BRIGHTNESS_STEP, MAX_BRIGHTNESS));
            }
        }
        else if (event.code === 'ArrowUp' || event.code === 'KeyW') {
            // Decrease brightness value (brightens image)
            if (event.getModifierState('Shift')) {
                setBrightness(MIN_BRIGHTNESS);
            }
            else {
                setBrightness(Math.max(brightness - KEYBOARD_BRIGHTNESS_STEP, MIN_BRIGHTNESS));
            }
        }
        else if (event.code === 'KeyR') {
            // Reset brightness
            setBrightness(DEFAULT_BRIGHTNESS);
        }
    }

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
                <RenderedImage imagePath={datasetRootPath + '/' + imageRelPath} sliceDim={sliceDim} sliceIndex={sliceIndex} brightness={brightness} />
            </div>
            <div className="mt-3 px-2 py-1 bg-gray-800 rounded flex items-center">
                <SunIcon className="mr-2 w-6 h-6 text-gray-400" />
                <InputRange min={MIN_BRIGHTNESS} max={MAX_BRIGHTNESS} step={0.01} value={brightness} setValue={setBrightness} />
                <button
                    className="ml-3 rounded text-gray-500 hover:text-gray-400 active:text-gray-100 focus:outline-none focus:ring-2 ring-gray-600 transition"
                    onClick={() => setBrightness(DEFAULT_BRIGHTNESS)}
                >
                    <RefreshIcon className="w-5 h-5" />
                </button>
                <div className="ml-3 py-0.5 w-20 bg-gray-700 rounded text-sm text-gray-400 text-center font-mono">{brightness.toFixed(1)}</div>
            </div>
            <div className="mt-2 p-2 bg-gray-800 rounded text-gray-400 text-center">
                <div className="flex justify-center items-center">
                    <div className="max-w-lg ml-2 text-xl break-words">{imageRelPath} {sliceDim} {sliceIndex}</div>
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
                            key={i}
                            size="lg"
                            color={labelOption === curLabelValue ? 'darkPink' : 'darkGray'}
                            onClick={() => addLabel(labelOption)}
                        >
                            <span>{labelOption} ({i + bindStart + 1})</span>
                        </Button>
                    )
                })}
                {skeletonLabels.map(i => <div key={i} className="bg-gray-800 rounded h-10" />)}
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
                <LabelControls additional={true} labelOptions={Utils.splitLabelOptions(session.labelOptions)} labels={labels} addLabel={addLabel} bindStart={2} />
            </div>
        </div>
    )
}

type LabelModal = 'pastLabels';

function LabelView() {
    const navigate = useNavigate();
    let {sessionId, elementIndex} = useParams();
    const elementIndexInt = parseInt(elementIndex);

    const session = useMemo(() => dbapi.selectLabelingSession(sessionId), []);
    const [elements, setElements] = useState<SessionElement[] | null>(null);
    const [curElement, setCurElement] = useState<{element: SessionElement, labels: ElementLabel[]} | null>(null);

    const [modal, setModal] = useState<LabelModal | null>(null);

    const [startTimestamp, timerSeconds, resetTimer] = useTimer();

    useEffect(() => {
        const sessClass = Session.getClass(session);
        const _elements = sessClass.selectElementsToLabel(session);
        setElements(_elements);

        const _curElement = _elements[parseInt(elementIndex)];
        setCurElement({
            element: _curElement,
            labels: dbapi.selectElementLabels(_curElement.id),
        });

        resetTimer();
    }, [session, elementIndex]);

    useEffect(() => {
        if (elements && curElement) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [elements, curElement]);

    function handleKeyDown(event: KeyboardEvent) {
        if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
            // Go to previous element
            const newIndex = Math.max(curElement.element.elementIndex - 1, 0);
            navigate(`/label/${sessionId}/${newIndex}`);
        }
        else if (event.code === 'ArrowRight' || event.code === 'KeyD') {
            // Go to next element
            const newIndex = Math.min(curElement.element.elementIndex + 1, elements.length - 1);
            navigate(`/label/${sessionId}/${newIndex}`);
        }
        else if (event.code.startsWith('Digit') || event.code.startsWith('Numpad')) {
            // Add label based on number key pressed
            let keyNum;
            if (event.code.startsWith('Digit')) keyNum = parseInt(event.code.substring('Digit'.length));
            else keyNum = parseInt(event.code.substring('Numpad'.length));

            let labelOpts = Utils.splitLabelOptions(session.labelOptions);
            if (Session.getClass(session).isComparison()) labelOpts = ['First', 'Second'].concat(labelOpts);

            const labelIndex = keyNum - 1;
            if (labelIndex >= 0 && labelIndex < labelOpts.length) {
                addLabel(labelOpts[labelIndex]);
            }
        }
    }

    function addLabel(labelValue: string) {
        // If labelValue is already the current label, do nothing
        if (curElement.labels.length > 0 && curElement.labels[0].labelValue === labelValue) return;

        const sessClass = Session.getClass(session);
        // Warn about overwrite if applicable
        if (sessClass.shouldWarnAboutLabelOverwrite(session, curElement.element.elementIndex)) {
            const message = `Adding a label here will overwrite all comparisons and labels that come after it.\n\nAre you sure you want to proceed?`;
            if (!window.confirm(message)) return;
        }
        // Add label
        sessClass.addLabel(session, curElement.element, labelValue, startTimestamp);

        // Update labels for current element
        setCurElement({
            element: curElement.element,
            labels: dbapi.selectElementLabels(curElement.element.id)
        });
        // Refresh elements
        setElements(sessClass.selectElementsToLabel(session));
        // Reset timer
        resetTimer();
    }

    function closeModal() {
        setModal(null);
    }

    if (!curElement) {
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
                {!Session.getClass(session).isComparison()
                    ? <ClassificationControls session={session} slice={curElement.element as Slice} labels={curElement.labels} addLabel={addLabel} />
                    : <ComparisonControls session={session} comparison={curElement.element as Comparison} labels={curElement.labels} addLabel={addLabel} />
                }
            </main>
        </div>
    )
}

export {LabelView};
