import * as React from 'react';
import {useMemo} from 'react';
import {Link} from 'react-router-dom';
import {Dataset, dbapi} from '../backend';
import {ColorSwatchIcon, FolderIcon, PhotographIcon, PlusCircleIcon} from '@heroicons/react/solid';
import {ChevronRightIcon, FolderOpenIcon} from '@heroicons/react/outline';
import {LinkButton} from './Buttons';

function NoDatasetsMessage() {
    return (
        <div className="mt-32 w-full flex justify-center items-center">
            <div className="px-10 pt-4 pb-6 max-w-lg rounded border border-gray-700 flex flex-col items-center">
                <div className="p-6 bg-black bg-opacity-20 rounded-full border-2 border-gray-700">
                    <FolderOpenIcon className="text-gray-300 w-8 h-8" />
                </div>
                <div className="mt-4 text-center">
                    <div className="text-3xl text-white font-medium">No datasets</div>
                    <div className="mt-2 text-sm text-gray-400">
                        Datasets represent locations on your computer where image files are stored.
                        Once you have created a dataset, you can create labeling sessions to label the images inside it.
                    </div>
                </div>
                <div className="mt-6">
                    <LinkButton to="/create-dataset/choose-directory" color="purple">
                        <PlusCircleIcon className="w-5 h-5 opacity-80" />
                        <span className="ml-2">Create Dataset</span>
                    </LinkButton>
                </div>
            </div>
        </div>
    )
}

function DatasetEntry({dataset}: {dataset: Dataset}) {
    return (
        <div>
            <Link className="block focus:outline-none group" to={`/dataset/${dataset.id}`}>
                <div className="px-3 py-2 rounded transition-all flex justify-between items-center
                                bg-black bg-opacity-30 hover:bg-opacity-50
                                border border-gray-700 hover:border-gray-500 group-focus:border-gray-300">
                    <div className="flex items-center space-x-4">
                        <div className="p-4 bg-gray-800 rounded-full transition">
                            <FolderIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                            <div className="text-2xl text-gray-200 font-semibold">{dataset.datasetName}</div>
                            <div className="mt-1 text-xs text-gray-400 flex items-center space-x-2">
                                <div className="pl-1 pr-2 py-0.5 bg-gray-800 rounded flex items-center space-x-1.5">
                                    <PhotographIcon className="w-4 h-4 opacity-80" />
                                    <span>{dataset.imageCount} image{dataset.imageCount !== 1 && 's'}</span>
                                </div>
                                <div className="pl-1 pr-2 py-0.5 bg-gray-800 rounded flex items-center space-x-1.5">
                                    <ColorSwatchIcon className="w-4 h-4 opacity-80" />
                                    <span>{dataset.sessionCount} labeling session{dataset.sessionCount !== 1 && 's'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <ChevronRightIcon className="text-gray-400 w-6 h-6" />
                </div>
            </Link>
        </div>
    )
}

function Datasets() {
    const datasets = useMemo(() => dbapi.selectAllDatasets(), []);

    return (
        <main className="w-full h-screen">
            <div className="mt-24 mx-auto flex-1 p-4 w-2/3 h-3/4 bg-gray-800 rounded border border-gray-700">
                <div className="pb-4 mb-4 border-b-2 border-gray-700 flex justify-between items-end">
                    <div className="text-3xl font-semibold">Datasets</div>
                    <LinkButton to="/create-dataset/choose-directory" color="purple">
                        <PlusCircleIcon className="w-5 h-5 opacity-80" />
                        <span className="ml-1.5">Create</span>
                    </LinkButton>
                </div>
                <div className="space-y-3">
                    {datasets.length === 0 && <NoDatasetsMessage />}
                    {datasets.map(d => <DatasetEntry key={d.id} dataset={d} />)}
                </div>
            </div>
        </main>
    )
}

export {Datasets};
