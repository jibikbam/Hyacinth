import * as React from 'react';
import {Link, useParams} from 'react-router-dom';
import {useMemo, useState} from 'react';
import {dbapi, fileapi} from '../backend';
import {ArrowLeftIcon, ExternalLinkIcon, PlusIcon, RefreshIcon} from '@heroicons/react/solid';
import {ExclamationIcon} from '@heroicons/react/outline';
import {Button} from './Buttons';
import {SliceResult} from '../results';
import {sessionResultsToCsv} from '../collaboration';
import * as Session from '../sessions/session';

function GridSliceContent({index, sliceResult, isLastMoved}: {index: number, sliceResult: SliceResult, isLastMoved: boolean}) {
    const slice = sliceResult.slice;
    return (
        <div className="flex flex-col justify-center items-center">
            <div className="w-full relative">
                <img draggable={false} className="w-full rounded"
                     src={'file://' + fileapi.getThumbnailsDir() + `/${slice.id}_${slice.sliceDim}_${slice.sliceIndex}.png`}
                     alt={`Thumbnail for slice id=${slice.id}`} />
                <div className={`absolute top-0 right-0 px-1.5 py-1 ${isLastMoved ? 'text-black font-medium bg-yellow-300' : 'text-gray-400 bg-gray-800'} rounded-bl`}>#{index+1}</div>
            </div>
            <div className="mt-1 text-center">
                <div className="text-gray-400">{slice.imageRelPath} {slice.sliceDim} {slice.sliceIndex}</div>
                {sliceResult.latestLabelValue && <div className="mt-1 text-sm text-gray-400">Label: "{sliceResult.latestLabelValue}"</div>}
                {sliceResult.score !== undefined &&
                    <div className="mt-1 text-gray-400">
                        <div className="text-sm">Score: {sliceResult.score.toFixed(3)}</div>
                        <div className="text-xs">WLD: {sliceResult.win}&bull;{sliceResult.loss}&bull;{sliceResult.draw}</div>
                    </div>
                }
            </div>
        </div>
    )
}

interface GridSliceProps {
    index: number;
    sliceResult: SliceResult;
    moveSlice: (startIndex: number, endIndex: number) => void;
    isLastMoved: boolean;
}

const DRAG_DATA_FORMAT = 'text/hyacinth-result-index';
type HighlightSide = 'left' | 'right' | 'none';

function GridSlice({index, sliceResult, moveSlice, isLastMoved}: GridSliceProps) {
    const [highlight, setHighlight] = useState<HighlightSide>('none');

    function isValidDragEvent(ev: React.DragEvent) {
        return ev.dataTransfer.types.includes(DRAG_DATA_FORMAT);
    }

    function getHighlightSide(ev: React.DragEvent): HighlightSide {
        const rect = ev.currentTarget.getBoundingClientRect();
        const relX = ev.pageX - rect.x;
        return relX < (rect.width / 2) ? 'left' : 'right';
    }

    function handleDragStart(ev: React.DragEvent<HTMLDivElement>) {
        ev.dataTransfer.setData(DRAG_DATA_FORMAT, index.toString());
        ev.dataTransfer.effectAllowed = "move";
    }

    function handleDragEnter(ev: React.DragEvent<HTMLDivElement>) {
        if (isValidDragEvent(ev)) {
            setHighlight(getHighlightSide(ev));
            ev.preventDefault();
        }
    }

    function handleDragOver(ev: React.DragEvent<HTMLDivElement>) {
        if (isValidDragEvent(ev)) {
            setHighlight(getHighlightSide(ev));
            ev.preventDefault();
        }
    }

    function handleDragLeave(ev: React.DragEvent<HTMLDivElement>) {
        if (isValidDragEvent(ev)) setHighlight('none');
    }

    function handleDrop(ev: React.DragEvent<HTMLDivElement>) {
        if (isValidDragEvent(ev)) {
            setHighlight('none');
            const adjustedIndex = (getHighlightSide(ev) === 'left') ? index : index + 1;
            moveSlice(parseInt(ev.dataTransfer.getData(DRAG_DATA_FORMAT)), adjustedIndex);
        }
    }

    return (
        <div draggable={true} onDragStart={handleDragStart} onDragEnter={handleDragEnter} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
             className="drop-container relative p-4 cursor-pointer">
            <div className="pointer-events-none">
                <GridSliceContent index={index} sliceResult={sliceResult} isLastMoved={isLastMoved} />
            </div>
            {(highlight !== 'none') &&
                <div className={`pointer-events-none absolute top-0 ${highlight === 'left' ? 'right-full -mr-2' : 'left-full -ml-2'} py-4 h-full flex`}>
                    <div className="w-4 bg-gray-300 bg-opacity-80 rounded flex justify-center items-center">
                        <PlusIcon className="text-black w-6 h-6" />
                    </div>
                </div>}
        </div>
    )
}

type GridColOption = 'Two' | 'Four' | 'Six' | 'Eight';

function getGridColClass(opt: GridColOption) {
    return {
        'Two': 'grid-cols-2',
        'Four': 'grid-cols-4',
        'Six': 'grid-cols-6',
        'Eight': 'grid-cols-8',
    }[opt];
}

interface GridColButtonProps {
    option: GridColOption;
    gridCols: GridColOption;
    setGridCols: React.Dispatch<React.SetStateAction<GridColOption>>;
    children?: any;
}

function GridColButton({option, gridCols, setGridCols, children}: GridColButtonProps) {
    const selected = gridCols === option;
    return (
        <button className={`w-12 h-8 text-lg text-gray-400 font-semibold tracking-wider
                           ${selected ? 'bg-gray-800' : 'bg-gray-700'} hover:bg-gray-800
                           first:rounded-l last:rounded-r border border-gray-600
                           focus:outline-none focus:ring-4 ring-gray-600 ring-opacity-50 focus:z-20
                           transition`}
                onClick={() => setGridCols(option)}>{children}</button>
    )
}

function SessionResults() {
    const {sessionId} = useParams();
    const session = useMemo(() => dbapi.selectLabelingSession(sessionId), [sessionId]);

    const {labelingComplete, sliceResults} = useMemo(() => {
        const sessClass = Session.getClass(session);
        return sessClass.computeResults(session);
    }, [sessionId]);

    const [reorderedResults, setReorderedResults] = useState<SliceResult[] | null>(null);
    const [lastMoved, setLastMoved] = useState<number>(null);

    const [gridCols, setGridCols] = useState<GridColOption>('Six');

    function moveSlice(startIndex: number, endIndex: number) {
        // Cancel move if it has no effect on order
        if (startIndex === endIndex || (startIndex + 1) === endIndex) return;

        // Use initial order if user hasn't moved any slices yet
        const curSlices = (reorderedResults || sliceResults).slice();

        const slice = curSlices.splice(startIndex, 1)[0];
        const newEndIndex = endIndex > startIndex ? endIndex - 1 : endIndex;
        curSlices.splice(newEndIndex, 0, slice);

        setReorderedResults(curSlices);
        setLastMoved(newEndIndex);
    }

    function resetOrder() {
        setReorderedResults(null);
        setLastMoved(null);
    }

    function exportResults() {
        const sessClass = Session.getClass(session);
        const resultsCsvString = sessClass.exportResultsToCsv(reorderedResults || sliceResults);
        const savePath = fileapi.showSaveDialog(session.sessionName + ' results.csv');

        if (savePath) fileapi.writeTextFile(savePath, resultsCsvString);
    }

    const gridColClass = getGridColClass(gridCols);

    return (
        <div>
            <div className="sticky top-0 z-10 px-4 py-2 bg-gray-900 shadow-lg">
                <Link className="text-gray-400 hover:text-gray-300 space-x-1.5 transition flex items-center"
                      to={`/dataset/${session.datasetId}/session/${session.id}`}>
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>Back to {session.sessionName}</span>
                </Link>
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-4xl font-medium">Results for {session.sessionName}</h1>
                        {reorderedResults &&
                            <Button color="gray" onClick={resetOrder}>
                                <RefreshIcon className="w-5 h-5" />
                                <span className="ml-2 font-medium">Reset</span>
                            </Button>
                        }
                        {!labelingComplete &&
                            <div className="px-2 text-yellow-300 font-medium border border-yellow-300 rounded flex items-center">
                                <ExclamationIcon className="w-5 h-5" />
                                <span className="ml-2">Labeling is not complete.</span>
                            </div>
                        }
                    </div>
                    <div className="flex items-center space-x-6">
                        <div className="flex items-center">
                            <GridColButton option="Two" gridCols={gridCols} setGridCols={setGridCols}>II</GridColButton>
                            <GridColButton option="Four" gridCols={gridCols} setGridCols={setGridCols}>IV</GridColButton>
                            <GridColButton option="Six" gridCols={gridCols} setGridCols={setGridCols}>VI</GridColButton>
                            <GridColButton option="Eight" gridCols={gridCols} setGridCols={setGridCols}>VIII</GridColButton>
                        </div>
                        <Button onClick={exportResults}>
                            <ExternalLinkIcon className="w-5 h-5" />
                            <span className="ml-2 font-medium">Export</span>
                        </Button>
                    </div>
                </div>
            </div>
            <div className={`mt-2 px-6 py-4 grid ${gridColClass} gap-0`}>
                {(reorderedResults || sliceResults).map((sr, i) =>
                    <GridSlice key={sr.slice.id} sliceResult={sr} index={i}  moveSlice={moveSlice} isLastMoved={i === lastMoved} />)}
            </div>
        </div>
    )
}

export {SessionResults};
