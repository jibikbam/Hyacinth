import * as React from 'react';
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {Dataset, dbapi} from '../backend';
import {PlusIcon} from '@heroicons/react/solid';
import {ChevronRightIcon} from '@heroicons/react/outline';

function Datasets() {
    const [datasets, setDatasets] = useState<Dataset[]>(dbapi.selectAllDatasets());

    return (
        <main className="mt-32 mx-auto max-w-screen-sm">
            <div className="flex justify-between items-end">
                <div className="text-3xl">Datasets</div>
                <Link
                    to="/create-dataset/choose-directory"
                    className="px-3 py-1.5 bg-pink-200 rounded text-black font-medium flex items-center focus:outline-none focus:ring-4 ring-pink-200 ring-opacity-50"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span className="ml-1">New</span>
                </Link>
            </div>
            <div className="mt-2 space-y-3">
                {datasets.map(d => {
                    return (
                        <Link className="block" to={`/dataset/${d.id}`}>
                            <div className="px-3 py-2 bg-gray-700 rounded flex justify-between items-center">
                                <div>
                                    <div className="text-2xl">{d.datasetName}</div>
                                    <div className="text-gray-400 font-medium">{d.imageCount} volumes &bull; {d.sessionCount} labeling sessions</div>
                                </div>
                                <ChevronRightIcon className="text-gray-400 w-6 h-6" />
                            </div>
                        </Link>
                    )
                })}
            </div>
        </main>
    )
}

export {Datasets};
