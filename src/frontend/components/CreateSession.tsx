import React, {useEffect, useState} from 'react';
import {Switch, Route, useParams} from 'react-router-dom';
import {StepContainer} from './StepContainer';
import {StepHeader} from './StepHeader';
import {StepNavigation} from './StepNavigation';
import {CheckCircleIcon, CollectionIcon, ScaleIcon} from '@heroicons/react/outline';

type SessionType = 'classification' | 'comparison';

function TypeOption({text, highlight, onClick, children}: {text: string, highlight: boolean, onClick: Function, children?: any}) {
    const borderColor = highlight ? 'border-gray-300' : 'border-gray-500';
    const circleColor = highlight ? 'bg-gray-300' : 'bg-gray-400';
    const textColor = highlight ? 'text-gray-100' : 'text-gray-400';

    return (
        <div className="flex flex-col items-center">
            <button onClick={onClick} className={`pt-2 w-48 h-48 border-2 ${borderColor} rounded flex flex-col justify-center items-center`}>
                <span className={`w-20 h-20 ${circleColor} rounded-full flex justify-center items-center`}>
                    {children}
                </span>
                <span className={`mt-4 px-4 text-lg ${textColor} text-center`}>{text}</span>
            </button>
            {highlight && <CheckCircleIcon className="mt-3 text-gray-300 w-8 h-8" />}
        </div>
    )
}

function ChooseTypeStep({sessionType, setSessionType}: {sessionType: SessionType | null, setSessionType: Function}) {
    return (
        <div className="mt-24 flex justify-center items-start space-x-6">
            <TypeOption text="Classification Session" highlight={sessionType === 'classification'} onClick={() => setSessionType('classification')}>
                <CollectionIcon className="text-gray-800 w-8 h-8" />
            </TypeOption>
            <TypeOption text="Comparison Session" highlight={sessionType === 'comparison'} onClick={() => setSessionType('comparison')}>
                <ScaleIcon className="text-gray-800 w-8 h-8" />
            </TypeOption>
        </div>
    )
}

function CreateSession() {
    const {datasetId} = useParams();
    const [dataset, setDataset] = useState(null);

    const [sessionType, setSessionType] = useState<SessionType | null>(null);

    useEffect(() => {
        setDataset((window as any).dbapi.selectDataset(datasetId));
    }, [datasetId])

    return (
        <StepContainer>
            <Switch>
                <Route path="/create-session/:datasetId/choose-type">
                    <div>
                        <StepHeader title="Create Labeling Session" stepDescription="Choose Session Type" curStep={0} stepCount={3} />
                        <ChooseTypeStep sessionType={sessionType} setSessionType={setSessionType} />
                    </div>
                    <StepNavigation cancelTo="/" backTo={null} nextTo={null} />
                </Route>
            </Switch>
        </StepContainer>
    )
}

export {CreateSession};
