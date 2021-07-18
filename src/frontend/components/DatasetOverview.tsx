import React, {useEffect, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {LinkButton} from './Buttons';
import {ArrowLeftIcon, CogIcon} from '@heroicons/react/solid';
import {PlusIcon} from '@heroicons/react/outline';

function DatasetOverview() {
    const {datasetId} = useParams();
    const [dataset, setDataset] = useState(null);

    useEffect(() => {
        setDataset((window as any).dbapi.selectDataset(datasetId));
    }, [datasetId])

    return (
        <main className="h-screen flex">
            <div className="px-4 py-3 w-80 bg-gray-800">
                <div>
                    <Link to="/" className="text-sm text-pink-200 flex items-center">
                        <ArrowLeftIcon className="w-4 h-4" />
                        <span className="ml-1">Back to datasets</span>
                    </Link>
                    <div className="mt-2 flex justify-between items-center">
                        <div className="text-3xl">{dataset && dataset.name}</div>
                        <Link>
                            <CogIcon className="w-6 h-6 text-gray-500" />
                        </Link>
                    </div>
                    <div className="mt-3">
                        <LinkButton to={`/create-session/${datasetId}/choose-type`} color="pink">
                            <PlusIcon className="w-5 h-5" />
                            <span className="ml-1.5 text-lg font-medium">New Session</span>
                        </LinkButton>
                    </div>
                </div>
            </div>
            <div>
            </div>
        </main>
    )
}

export {DatasetOverview};
