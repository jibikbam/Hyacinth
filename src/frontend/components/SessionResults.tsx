import * as React from 'react';
import {Link, useParams} from 'react-router-dom';
import {useMemo} from 'react';
import {dbapi, fileapi, Slice} from '../backend';
import {buildSortMatrix, sortSlices} from '../sort';
import {ArrowLeftIcon} from '@heroicons/react/solid';
import {ExclamationIcon} from '@heroicons/react/outline';

function GridSlice({index, slice}: {index: number, slice: Slice}) {
    return (
        <div className="flex flex-col justify-center items-center">
            <div className="relative">
                <img className="rounded" src={'file://' + fileapi.getThumbnailsDir() + `/${slice.id}_${slice.sliceDim}_${slice.sliceIndex}.png`} />
                <div className="absolute top-0 right-0 px-1.5 py-1 text-gray-400 bg-gray-800 rounded-bl">#{index+1}</div>
            </div>
            <div className="mt-1 text-center">
                <div className="text-gray-400">{slice.imageRelPath} {slice.sliceDim} {slice.sliceIndex}</div>
            </div>
        </div>
    )
}

function SessionResults() {
    const {sessionId} = useParams();
    const session = useMemo(() => dbapi.selectLabelingSession(sessionId), [sessionId]);

    const [sortingComplete, slices] = useMemo(() => {
        const slices = dbapi.selectSessionSlices(sessionId);
        const comparisons = dbapi.selectSessionComparisons(sessionId);
        const comparisonLabels = dbapi.selectSessionLatestComparisonLabels(sessionId);

        const sortResult = sortSlices(
            buildSortMatrix(comparisons, comparisonLabels),
            slices
        );

        if (Array.isArray(sortResult)) {
            return [true, sortResult as Slice[]];
        }
        else {
            return [false, slices];
        }
    }, [sessionId]);

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
                    {!sortingComplete &&
                        <div className="px-2 text-yellow-300 font-medium border border-yellow-300 rounded flex items-center">
                            <ExclamationIcon className="w-5 h-5" />
                            <span className="ml-2">Labeling is not complete.</span>
                        </div>
                    }
                </div>
            </div>
            <div className="mt-6 grid grid-cols-6 gap-8">
                {slices.map((s, i) => <GridSlice key={s.id} index={i} slice={s} />)}
            </div>
        </div>
    )
}

export {SessionResults};
