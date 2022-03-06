import * as React from 'react';
import {Link, useParams} from 'react-router-dom';
import {useMemo, useState} from 'react';
import {dbapi, fileapi, Slice} from '../backend';
import {ArrowLeftIcon, RefreshIcon} from '@heroicons/react/solid';
import {ExclamationIcon} from '@heroicons/react/outline';
import {Button} from './Buttons';
import {computeResults, SliceResult} from '../results';

function GridSliceContent({index, sliceResult}: {index: number, sliceResult: SliceResult}) {
    const slice = sliceResult.slice;
    return (
        <div className="flex flex-col justify-center items-center">
            <div className="relative">
                <img draggable={false} className="rounded"
                     src={'file://' + fileapi.getThumbnailsDir() + `/${slice.id}_${slice.sliceDim}_${slice.sliceIndex}.png`}
                     alt={`Thumbnail for slice id=${slice.id}`} />
                <div className="absolute top-0 right-0 px-1.5 py-1 text-gray-400 bg-gray-800 rounded-bl">#{index+1}</div>
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
}

const DRAG_DATA_FORMAT = 'text/hyacinth-result-index';

function GridSlice({index, sliceResult, moveSlice}: GridSliceProps) {
    const [highlight, setHighlight] = useState<boolean>(false);

    function isValidDragEvent(ev: React.DragEvent) {
        return ev.dataTransfer.types.includes(DRAG_DATA_FORMAT);
    }

    function handleDragStart(ev: React.DragEvent<HTMLDivElement>) {
        ev.dataTransfer.setData(DRAG_DATA_FORMAT, index.toString());
        ev.dataTransfer.effectAllowed = "move";
    }

    function handleDragEnter(ev: React.DragEvent<HTMLDivElement>) {
        if (isValidDragEvent(ev)) {
            setHighlight(true);
            ev.preventDefault();
        }
    }

    function handleDragOver(ev: React.DragEvent<HTMLDivElement>) {
        if (isValidDragEvent(ev)) ev.preventDefault();
    }

    function handleDragLeave(ev: React.DragEvent<HTMLDivElement>) {
        if (isValidDragEvent(ev)) setHighlight(false);
    }

    function handleDrop(ev: React.DragEvent<HTMLDivElement>) {
        if (isValidDragEvent(ev)) {
            setHighlight(false);
            moveSlice(parseInt(ev.dataTransfer.getData(DRAG_DATA_FORMAT)), index);
        }
    }

    return (
        <div draggable={true} onDragStart={handleDragStart} onDragEnter={handleDragEnter} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
             className={`drop-container p-1 ${highlight && 'bg-gray-800'} rounded cursor-pointer`}>
            <div className="pointer-events-none">
                <GridSliceContent index={index} sliceResult={sliceResult} />
            </div>
        </div>
    )
}

function SessionResults() {
    const {sessionId} = useParams();
    const session = useMemo(() => dbapi.selectLabelingSession(sessionId), [sessionId]);

    const {labelingComplete, sliceResults} = useMemo(() => computeResults(session), [sessionId]);

    const [reorderedResults, setReorderedResults] = useState<SliceResult[] | null>(null);

    function moveSlice(startIndex: number, endIndex: number) {
        // Use initial order if user hasn't moved any slices yet
        const curSlices = (reorderedResults || sliceResults).slice();

        curSlices.splice(endIndex, 0, curSlices[startIndex]);
        const newStartIndex = startIndex > endIndex ? startIndex + 1 : startIndex;
        curSlices.splice(newStartIndex, 1);
        setReorderedResults(curSlices);
    }

    function resetOrder() {
        setReorderedResults(null);
    }

    return (
        <div className="p-4">
            <div>
                <Link className="text-gray-400 hover:text-gray-300 space-x-1.5 transition flex items-center"
                      to={`/dataset/${session.datasetId}/session/${session.id}`}>
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>Back to {session.sessionName}</span>
                </Link>
                <div className="flex items-center space-x-4">
                    <h1 className="text-4xl font-medium">Results for {session.sessionName}</h1>
                    {reorderedResults &&
                        <Button color="gray" onClick={resetOrder}>
                            <RefreshIcon className="w-4 h-4" />
                            <span className="ml-1">Reset</span>
                        </Button>
                    }
                    {!labelingComplete &&
                        <div className="px-2 text-yellow-300 font-medium border border-yellow-300 rounded flex items-center">
                            <ExclamationIcon className="w-5 h-5" />
                            <span className="ml-2">Labeling is not complete.</span>
                        </div>
                    }
                </div>
            </div>
            <div className="mt-6 grid grid-cols-6 gap-8">
                {(reorderedResults || sliceResults).map((sr, i) => <GridSlice key={sr.slice.id} sliceResult={sr} index={i}  moveSlice={moveSlice} />)}
            </div>
        </div>
    )
}

export {SessionResults};
