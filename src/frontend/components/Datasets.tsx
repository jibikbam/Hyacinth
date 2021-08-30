import * as React from 'react';
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {Dataset, dbapi} from '../backend';
import {PlusIcon} from '@heroicons/react/solid';
import {ChevronRightIcon} from '@heroicons/react/outline';
import {LinkButton} from './Buttons';

function Datasets() {
    const [datasets, setDatasets] = useState<Dataset[]>(dbapi.selectAllDatasets());

    return (
        <main className="mt-32 mx-auto max-w-screen-md">
            <div className="flex justify-between items-end">
                <div className="text-3xl">Datasets</div>
                <LinkButton
                    to="/create-dataset/choose-directory"
                    color="pink"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span className="ml-1.5 font-medium">Create</span>
                </LinkButton>
            </div>
            <div className="mt-2 space-y-3">
                {datasets.length === 0 && (
                    <div className="text-gray-400 font-medium">You have not created any datasets yet.</div>
                )}
                {datasets.map(d => {
                    return (
                        <Link className="block focus:outline-none group" to={`/dataset/${d.id}`}>
                            <div
                                className="px-3 py-2 rounded transition-all flex justify-between items-center
                                bg-gray-700 hover:bg-gray-800 group-focus:bg-gray-800
                                border border-gray-700 hover:border-gray-500 group-focus:border-gray-500"
                            >
                                <div>
                                    <div className="text-xl">{d.datasetName}</div>
                                    <div className="text-gray-400">{d.imageCount} volumes &bull; {d.sessionCount} labeling sessions</div>
                                </div>
                                <ChevronRightIcon className="text-gray-500 w-6 h-6" />
                            </div>
                        </Link>
                    )
                })}
            </div>
        </main>
    )
}

export {Datasets};
