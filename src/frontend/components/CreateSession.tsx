import * as React from 'react';
import {useEffect, useState} from 'react';
import {Switch, Route, useParams, useHistory} from 'react-router-dom';
import {SessionType, Orientation, SamplingType, dbapi, DatasetImage} from '../backend';
import {StepContainer} from './StepContainer';
import {StepHeader} from './StepHeader';
import {StepNavigation} from './StepNavigation';
import {InputNumber, InputText, Select} from './Inputs';
import {CheckCircleIcon, CollectionIcon, ScaleIcon} from '@heroicons/react/outline';
import {ChartBarIcon, ChartPieIcon} from '@heroicons/react/solid';
import {sampleSlices} from '../sampling';

function TypeOption({text, highlight, onClick, children}: {text: string, highlight: boolean, onClick: Function, children?: any}) {
    const borderColor = highlight ? 'border-gray-300' : 'border-gray-500';
    const circleColor = highlight ? 'bg-gray-300' : 'bg-gray-400';
    const textColor = highlight ? 'text-gray-100' : 'text-gray-400';

    return (
        <div className="flex flex-col items-center">
            <button onClick={() => onClick()} className={`pt-2 w-48 h-48 border-2 ${borderColor} rounded flex flex-col justify-center items-center`}>
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

interface SessionInfoStepProps {
    sessionName: string;
    setSessionName: Function;
    prompt: string;
    setPrompt: Function;
    labelOptions: string;
    setLabelOptions: Function;
    sessionType: SessionType;
}

function SessionInfoStep({sessionName, setSessionName, prompt, setPrompt, labelOptions, setLabelOptions, sessionType}: SessionInfoStepProps) {
    return (
        <div className="mx-auto mt-10 w-2/3 flex flex-col space-y-8">
            <div>
                <InputText id="session-name" label="Session Name" placeholder="My Session" value={sessionName} setValue={setSessionName} />
                <div className="mt-2 text-xs text-gray-400">Choose a name for this labeling session. Session names must be unique per dataset.</div>
            </div>
            <div>
                <InputText id="prompt" label="Session Prompt" placeholder="My Prompt" value={prompt} setValue={setPrompt} />
                <div className="mt-2 text-xs text-gray-400">The session prompt tells the labeler what criteria to use when choosing a label.</div>
            </div>
            <div>
                <InputText id="label-options" label="Labels" placeholder="My Labels" value={labelOptions} setValue={setLabelOptions} />
                <div className="mt-2 text-xs text-gray-400">Comma-separated list of labels for this labeling session.</div>
            </div>
        </div>
    )
}

function SamplingButtonGroup({sampling, setSampling}: {sampling: SamplingType, setSampling: Function}) {
    return (
        <div className="flex items-center">
            <button
                className={'px-3 py-1.5 rounded-l border border-gray-400 text-xl flex items-center ' + (sampling === 'random' ? 'bg-gray-400 text-black' : 'text-gray-400')}
                onClick={() => setSampling('random')}
            >
                <ChartPieIcon className="w-5 h-5" />
                <span className="ml-1">Random</span>
            </button>
            <button
                className={'px-3 py-1.5 rounded-r border border-gray-400 text-xl flex items-center ' + (sampling === 'sort' ? 'bg-gray-400 text-black' : 'text-gray-400')}
                onClick={() => setSampling('sort')}
            >
                <ChartBarIcon className="w-5 h-5" />
                <span className="ml-1">Sort</span>
            </button>
        </div>
    )
}

interface SamplingOptionsStepProps {
    sessionType: SessionType;
    slicesFrom: string;
    setSlicesFrom: Function;
    imageCount: number;
    setImageCount: Function;
    sliceCount: number;
    setSliceCount: Function;
    orientation: Orientation;
    setOrientation: Function;
    sliceMinPct: number;
    setSliceMinPct: Function;
    sliceMaxPct: number;
    setSliceMaxPct: Function;
    sampling: SamplingType;
    setSampling: Function;
    comparisonCount: number;
    setComparisonCount: Function;
}

function SamplingOptionsStep(props: SamplingOptionsStepProps) {
    return (
        <div className="mt-4 flex items-start space-x-12">
            <div className="w-64">
                <div>
                    <Select id="slices-from" label="Slices From" options={['Create New']} value={props.slicesFrom} setValue={props.setSlicesFrom} />
                </div>
                <div className="mt-3 flex space-x-4">
                    <InputNumber id="image-count" label="Images" value={props.imageCount} setValue={props.setImageCount} />
                    <InputNumber id="slice-count" label="Slices" value={props.sliceCount} setValue={props.setSliceCount} />
                </div>
                <div className="mt-3">
                    <Select id="orientation" label="Orientation" options={['Sagittal']} value={props.orientation} setValue={props.setOrientation} />
                </div>
                <div className="mt-3 flex space-x-4">
                    <InputNumber id="slice-min-pct" label="Slice Min (%)" value={props.sliceMinPct} setValue={props.setSliceMinPct} />
                    <InputNumber id="slice-max-pct" label="Slice Max (%)" value={props.sliceMaxPct} setValue={props.setSliceMaxPct} />
                </div>
            </div>
            {props.sessionType === 'comparison' && (
                <div className="w-64">
                    <div>
                        <div className="text-sm text-gray-400 font-medium">Comparison Sampling</div>
                        <div className="mt-1">
                            <SamplingButtonGroup sampling={props.sampling} setSampling={props.setSampling} />
                        </div>
                    </div>
                    <div className="mt-3 w-1/2 pr-2">
                        <InputNumber id="comparison-count" label="Comparisons" value={props.comparisonCount} setValue={props.setComparisonCount} />
                    </div>
                </div>
            )}
        </div>
    )
}

function CreateSession() {
    const {datasetId} = useParams();
    const history = useHistory();
    const [dataset, setDataset] = useState(null);
    const [datasetImages, setDatasetImages] = useState<DatasetImage[] | null>(null);

    const [sessionType, setSessionType] = useState<SessionType | null>(null);
    const [sessionName, setSessionName] = useState<string>('');
    const [prompt, setPrompt] = useState<string>('');
    const [labelOptions, setLabelOptions] = useState<string>('');

    const infoValid = sessionName.length > 0; // TODO: Validate inputs

    const [slicesFrom, setSlicesFrom] = useState<string>('Create New');
    const [imageCount, setImageCount] = useState<number>(0);
    const [sliceCount, setSliceCount] = useState<number>(0);
    const [orientation, setOrientation] = useState<Orientation>('Sagittal');
    const [sliceMinPct, setSliceMinPct] = useState<number>(20);
    const [sliceMaxPct, setSliceMaxPct] = useState<number>(80);

    const [sampling, setSampling] = useState<SamplingType>('random');
    const [comparisonCount, setComparisonCount] = useState<number>(0);

    useEffect(() => {
        setDataset(dbapi.selectDataset(datasetId));
        setDatasetImages(dbapi.selectDatasetImages(datasetId));
    }, [datasetId]);

    function createSession() {
        const slices = sampleSlices(datasetImages, imageCount, sliceCount, orientation, sliceMinPct, sliceMaxPct);
        dbapi.insertLabelingSession(datasetId, sessionType, sessionName, prompt, labelOptions, '');
        history.push(`/dataset/${datasetId}`);
    }

    return (
        <StepContainer>
            <Switch>
                <Route path="/create-session/:datasetId/choose-type">
                    <div>
                        <StepHeader title="Create Labeling Session" stepDescription="Choose Session Type" curStep={0} stepCount={3} />
                        <ChooseTypeStep sessionType={sessionType} setSessionType={setSessionType} />
                    </div>
                    <StepNavigation cancelTo="/" backTo={null} nextTo={sessionType && `/create-session/${datasetId}/session-info`} />
                </Route>
                <Route path="/create-session/:datasetId/session-info">
                    <div>
                        <StepHeader title="Create Labeling Session" stepDescription="Session Info" curStep={1} stepCount={3} />
                        <SessionInfoStep
                            sessionName={sessionName}
                            setSessionName={setSessionName}
                            prompt={prompt}
                            setPrompt={setPrompt}
                            labelOptions={labelOptions}
                            setLabelOptions={setLabelOptions}
                            sessionType={sessionType}
                        />
                    </div>
                    <StepNavigation cancelTo="/" backTo={`/create-session/${datasetId}/choose-type`} nextTo={`/create-session/${datasetId}/sampling-options`} />
                </Route>
                <Route path="/create-session/:datasetId/sampling-options">
                    <div>
                        <StepHeader title="Create Labeling Session" stepDescription="Sampling Options" curStep={2} stepCount={3} />
                        <SamplingOptionsStep
                            sessionType={sessionType}
                            slicesFrom={slicesFrom}
                            setSlicesFrom={setSlicesFrom}
                            imageCount={imageCount}
                            setImageCount={setImageCount}
                            sliceCount={sliceCount}
                            setSliceCount={setSliceCount}
                            orientation={orientation}
                            setOrientation={setOrientation}
                            sliceMinPct={sliceMinPct}
                            setSliceMinPct={setSliceMinPct}
                            sliceMaxPct={sliceMaxPct}
                            setSliceMaxPct={setSliceMaxPct}
                            sampling={sampling}
                            setSampling={setSampling}
                            comparisonCount={comparisonCount}
                            setComparisonCount={setComparisonCount}
                        />
                    </div>
                    <StepNavigation cancelTo="/" backTo={`/create-session/${datasetId}/session-info`} nextTo={null} finishText="Create" finishClicked={createSession} finishDisabled={false} />
                </Route>
            </Switch>
        </StepContainer>
    )
}

export {CreateSession};
