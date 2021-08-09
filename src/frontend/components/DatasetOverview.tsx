import * as React from 'react';
import {useEffect, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {Dataset, LabelingSession, dbapi} from '../backend';
import {LinkButton} from './Buttons';
import {ArrowLeftIcon, CogIcon} from '@heroicons/react/solid';
import {PlusIcon} from '@heroicons/react/outline';
import {SessionOverview} from './SessionOverview';

function DatasetOverview() {
    let {datasetId, sessionId} = useParams();
    datasetId = parseInt(datasetId);
    if (sessionId) sessionId = parseInt(sessionId);

    const [dataset, setDataset] = useState<Dataset | null>(null);
    const [sessions, setSessions] = useState<LabelingSession[] | null>(null);

    // Default to first session if no sessionId is passed via route url
    if (!sessionId && sessions && sessions.length > 0) sessionId = sessions[0].id;

    useEffect(() => {
        setDataset(dbapi.selectDataset(datasetId));
        setSessions(dbapi.selectDatasetSessions(datasetId));
    }, [datasetId]);

    return (
        <main className="h-screen flex">
            <div className="px-4 py-3 w-80 bg-gray-800">
                <div>
                    <Link to="/" className="text-sm text-pink-200 hover:text-pink-600 flex items-center">
                        <ArrowLeftIcon className="w-4 h-4" />
                        <span className="ml-1">Back to datasets</span>
                    </Link>
                    <div className="mt-2 flex justify-between items-center">
                        <div className="text-3xl">{dataset && dataset.datasetName}</div>
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
                <div className="mt-6">
                    <h2 className="text-sm text-gray-400 font-medium">Labeling Sessions</h2>
                    <div className="mt-2 space-y-1 flex flex-col items-start">
                        {sessions && sessions.map(s => {
                            return (
                                <Link to={`/dataset/${datasetId}/session/${s.id}`} className="text-lg font-medium">
                                    <span className={s.id === sessionId ? 'text-gray-100' : 'text-gray-400 hover:text-white focus:text-white'}>{s.sessionName}</span>
                                </Link>
                            )
                        })}
                        {sessions && sessions.length === 0 && <span className="mt-1 text-xs text-gray-400">No sessions created yet.</span>}
                    </div>
                </div>
            </div>
            <div className="flex-1">
                {sessionId && <SessionOverview sessionId={sessionId} />}
            </div>
        </main>
    )
}

export {DatasetOverview};
