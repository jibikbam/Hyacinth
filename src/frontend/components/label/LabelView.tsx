import * as React from 'react';
import {useEffect, useMemo, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {Comparison, dbapi, ElementLabel, SessionElement, Slice} from '../../backend';
import {LabelTimer} from './LabelTimer';
import {PastLabelsModal} from './PastLabelsModal';
import {LabelKeymapModal} from './LabelKeymapModal';
import {ClassificationControls} from './ClassificationControls';
import {ComparisonControls} from './ComparisonControls';
import {useTimer} from '../../hooks/useTimer';
import {ChevronLeftIcon, ChevronRightIcon} from '@heroicons/react/outline';
import {ArrowLeftIcon, ChatAltIcon, CollectionIcon, QuestionMarkCircleIcon} from '@heroicons/react/solid';
import * as Utils from '../../utils';
import * as Session from '../../sessions/session';

type LabelModal = 'pastLabels' | 'keymap';

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

    let modalEl;
    if (modal === 'pastLabels') modalEl = <PastLabelsModal labels={curElement.labels} closeModal={closeModal} />
    else if (modal === 'keymap') modalEl = <LabelKeymapModal closeModal={closeModal} />
    else modalEl = null;

    return (
        <div>
            {modalEl}
            <header className="py-2 pl-4 pr-2 bg-gray-800 flex justify-between items-center">
                <div className="w-1/4">
                    <Link to={`/dataset/${session.datasetId}/session/${session.id}`} className="text-gray-400 hover:text-purple-300 transition inline-flex items-center">
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
                            <h1 className="w-full text-2xl font-semibold text-center">{curElement.element.elementType} {elementIndexInt + 1}</h1>
                            <div className="mt-0.5 w-full text-gray-400 font-medium text-center">{session.prompt}</div>
                        </div>
                        <Link to={elementIndexInt < (elements.length - 1) && `/label/${sessionId}/${elementIndexInt + 1}`} className="p-4 text-gray-500 hover:text-white transition">
                            <ChevronRightIcon className="w-6 h-6" />
                        </Link>
                    </div>
                </div>
                <div className="w-1/4 flex justify-end items-center">
                    <button
                        className="px-2 text-gray-400 hover:text-gray-500 rounded focus:ring-2 ring-gray-400 focus:outline-none flex items-center transition"
                        onClick={() => setModal('keymap')}
                    >
                        <QuestionMarkCircleIcon className="w-5 h-5 opacity-80" />
                        <span className="ml-1 font-medium">Keymap</span>
                    </button>
                    <div className="ml-6 space-x-3">
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
