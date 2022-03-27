import * as React from 'react';
import {useMemo, useState} from 'react';
import {Routes, Route, useParams, useNavigate} from 'react-router-dom';
import {SessionCategory, SessionType, SamplingType, dbapi} from '../backend';
import {StepContainer} from './StepContainer';
import {StepHeader} from './StepHeader';
import {StepNavigation} from './StepNavigation';
import {InputNumber, InputText, Select} from './Inputs';
import {CheckCircleIcon, CollectionIcon, ScaleIcon} from '@heroicons/react/outline';
import {ChartBarIcon, ChartPieIcon} from '@heroicons/react/solid';
import {
    InputValidator, useNumberBoundsValidator,
    useSessionLabelOptionsValidator,
    useSessionNameValidator,
    useStringLengthValidator
} from '../hooks/validators';
import {getSessionClass} from '../sessions/session';
import {SliceSampleOpts} from '../sampling';

function TypeOption({text, highlight, onClick, children}: {text: string, highlight: boolean, onClick: Function, children?: any}) {
    const borderColor = highlight ? 'border-gray-300' : 'border-gray-500 hover:border-gray-400';
    const iconColor = highlight ? 'text-gray-800' : 'text-gray-700';
    const circleColor = highlight ? 'bg-gray-300' : 'bg-gray-400';
    const textColor = highlight ? 'text-gray-100' : 'text-gray-400';

    return (
        <div className="flex flex-col items-center">
            <button onClick={() => onClick()} className={`pt-2 w-48 h-48 border-2 ${borderColor} rounded flex flex-col justify-center items-center transition`}>
                <span className={`w-20 h-20 ${iconColor} ${circleColor} rounded-full flex justify-center items-center`}>
                    {children}
                </span>
                <span className={`mt-4 px-4 text-lg ${textColor} text-center`}>{text}</span>
            </button>
            {highlight && <CheckCircleIcon className="mt-3 text-gray-300 w-8 h-8" />}
        </div>
    )
}

interface ChooseTypeStepProps {
    sessionCategory: SessionCategory | null;
    setSessionCategory: React.Dispatch<React.SetStateAction<SessionCategory | null>>;
}

function ChooseTypeStep({sessionCategory, setSessionCategory}: ChooseTypeStepProps) {
    return (
        <div className="mt-24 flex justify-center items-start space-x-6">
            <TypeOption text="Classification Session" highlight={sessionCategory === 'Classification'} onClick={() => setSessionCategory('Classification')}>
                <CollectionIcon className="w-8 h-8" />
            </TypeOption>
            <TypeOption text="Comparison Session" highlight={sessionCategory === 'Comparison'} onClick={() => setSessionCategory('Comparison')}>
                <ScaleIcon className="w-8 h-8" />
            </TypeOption>
        </div>
    )
}

interface SessionInfoStepProps {
    sessionName: InputValidator<string>;
    prompt: InputValidator<string>;
    labelOptions: InputValidator<string>;
    sessionCategory: SessionCategory;
}

function SessionInfoStep({sessionName, prompt, labelOptions, sessionCategory}: SessionInfoStepProps) {
    const isCompare = sessionCategory === 'Comparison';
    return (
        <div className="mx-auto mt-10 w-2/3 flex flex-col space-y-8">
            <div>
                <InputText id="session-name" label="Session Name *" placeholder="My Session" validator={sessionName} />
                <div className="mt-2 text-xs text-gray-400">Choose a name for this {sessionCategory.toLowerCase()} session. Session names must be unique per dataset.</div>
            </div>
            <div>
                <InputText id="prompt" label="Session Prompt" placeholder={isCompare ? 'Which of these slices is better?' : 'What do you think of this slice?'} validator={prompt} />
                <div className="mt-2 text-xs text-gray-400">The session prompt tells the labeler what criteria to use when choosing a label.</div>
            </div>
            <div>
                <InputText id="label-options" label={isCompare ? 'Additional Labels' : 'Labels *'} placeholder="Label 1, Label 2, Label 3" validator={labelOptions} />
                <div className="mt-2 text-xs text-gray-400">Comma-separated list of {isCompare && 'additional'} labels for this {sessionCategory.toLowerCase()} session.</div>
            </div>
        </div>
    )
}

function SamplingButtonGroup({sampling, setSampling}: {sampling: SamplingType, setSampling: Function}) {
    return (
        <div className="text-gray-400 font-medium border border-gray-600 rounded overflow-hidden inline-flex items-center">
            <button
                className={'px-3 py-1.5 transition flex items-center ' + (sampling === 'Random' ? 'bg-gray-800' : 'hover:bg-gray-800')}
                onClick={() => setSampling('Random')}
            >
                <ChartPieIcon className="w-5 h-5" />
                <span className="ml-1">Random</span>
            </button>
            <button
                className={'px-3 py-1.5 transition flex items-center ' + (sampling === 'Sort' ? 'bg-gray-800' : 'hover:bg-gray-800')}
                onClick={() => setSampling('Sort')}
            >
                <ChartBarIcon className="w-5 h-5" />
                <span className="ml-1">Sort</span>
            </button>
        </div>
    )
}

interface SamplingOptionsStepProps {
    slicesFrom: string;
    setSlicesFrom: Function;
    imageCount: InputValidator<number>;
    sliceCount: InputValidator<number>;
    sliceDim: number;
    setSliceDim: Function;
    sliceMinPct: InputValidator<number>;
    sliceMaxPct: InputValidator<number>;
    sampling: SamplingType;
    setSampling: Function;
    comparisonCount: InputValidator<number>;

    sessionCategory: SessionCategory;
    maxImageCount: number;
}

function SamplingOptionsStep(props: SamplingOptionsStepProps) {
    return (
        <div className="mt-4 flex items-start space-x-12">
            <div className="w-64">
                <div>
                    <Select id="slices-from" label="Slices From" options={['Create New']} value={props.slicesFrom} setValue={props.setSlicesFrom} />
                </div>
                <div className="mt-3 flex space-x-4">
                    <InputNumber id="image-count" label="Images" help="Number of images to sample slices from." min={1} validator={props.imageCount} />
                    <InputNumber id="slice-count" label="Slices" help="Number of slices to sample." min={2} validator={props.sliceCount} />
                </div>
                <div className="mt-3">
                    <Select id="slice-dim" label="Slice Dimension" options={['0', '1', '2']} value={props.sliceDim.toString()} setValue={(val: string) => props.setSliceDim(parseInt(val))} />
                </div>
                <div className="mt-3 flex space-x-4">
                    <InputNumber id="slice-min-pct" label="Slice Min (%)" help="Min slice index to sample as a percentage of all slices." min={0} validator={props.sliceMinPct} />
                    <InputNumber id="slice-max-pct" label="Slice Max (%)" help="Max slice index to sample as a percentage of all slices." min={0} validator={props.sliceMaxPct} />
                </div>
            </div>
            {props.sessionCategory === 'Comparison' && (
                <div className="w-64">
                    <div>
                        <div className="text-sm text-gray-400">Comparison Sampling</div>
                        <div className="mt-1">
                            <SamplingButtonGroup sampling={props.sampling} setSampling={props.setSampling} />
                        </div>
                    </div>
                    {props.sampling === 'Random' && (
                        <div className="mt-3 w-1/2 pr-2">
                            <InputNumber id="comparison-count" label="Comparisons" help="Number of comparisons to sample." validator={props.comparisonCount} />
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function CreateSession() {
    const {datasetId} = useParams();
    const navigate = useNavigate();

    const [dataset, datasetImages] = useMemo(() => {
        return [dbapi.selectDataset(datasetId), dbapi.selectDatasetImages(datasetId)];
    }, []);

    const [sessionCategory, setSessionCategory] = useState<SessionCategory | null>(null);
    const sessionName = useSessionNameValidator('', datasetId);
    const prompt = useStringLengthValidator('');
    const labelOptions = useSessionLabelOptionsValidator('', sessionCategory);

    const [slicesFrom, setSlicesFrom] = useState<string>('Create New');
    const imageCount = useNumberBoundsValidator(1, 1, datasetImages.length);
    const sliceCount = useNumberBoundsValidator(2, 2);
    const [sliceDim, setSliceDim] = useState<number>(0);
    const sliceMinPct = useNumberBoundsValidator(20, 0, 100);
    const sliceMaxPct = useNumberBoundsValidator(80, 0, 100);

    const [sampling, setSampling] = useState<SamplingType>('Random');
    const comparisonCount = useNumberBoundsValidator(1, 1);

    function createSession() {
        const sessionType: SessionType = (sessionCategory === 'Classification')
            ? 'Classification'
            : (sampling === 'Random') ? 'ComparisonRandom' : 'ComparisonActiveSort';

        const sessClass = getSessionClass(sessionType);
        const sliceOpts: SliceSampleOpts = {
            imageCount: imageCount.value, sliceCount: sliceCount.value, sliceDim: sliceDim,
            sliceMinPct: sliceMinPct.value, sliceMaxPct: sliceMaxPct.value
        };

        const newSessionId = sessClass.createSession(datasetId, sessionName.value, prompt.value, labelOptions.value,
            slicesFrom, sliceOpts, comparisonCount.value);

        navigate(`/dataset/${datasetId}/session/${newSessionId}`);
    }

    const infoValid = sessionName.valid && labelOptions.valid;

    return (
        <StepContainer>
            <Routes>
                <Route path="/choose-type" element={
                    <>
                        <div>
                            <StepHeader title="Create Labeling Session" stepDescription="Choose Session Type" curStep={0} stepCount={3}/>
                            <ChooseTypeStep sessionCategory={sessionCategory} setSessionCategory={setSessionCategory} />
                        </div>
                        <StepNavigation cancelTo={`/dataset/${dataset.id}`} backTo={null} nextTo={sessionCategory && `/create-session/${datasetId}/session-info`} />
                    </>
                } />
                <Route path="/session-info" element={
                    <>
                        <div>
                            <StepHeader title="Create Labeling Session" stepDescription="Session Info" curStep={1} stepCount={3}/>
                            <SessionInfoStep
                                sessionName={sessionName}
                                prompt={prompt}
                                labelOptions={labelOptions}
                                sessionCategory={sessionCategory}
                            />
                        </div>
                        <StepNavigation cancelTo={`/dataset/${dataset.id}`} backTo={`/create-session/${datasetId}/choose-type`} nextTo={infoValid && `/create-session/${datasetId}/sampling-options`} />
                    </>
                } />
                <Route path="/sampling-options" element={
                    <>
                        <div>
                            <StepHeader title="Create Labeling Session" stepDescription="Sampling Options" curStep={2} stepCount={3}/>
                            <SamplingOptionsStep
                                slicesFrom={slicesFrom}
                                setSlicesFrom={setSlicesFrom}
                                imageCount={imageCount}
                                sliceCount={sliceCount}
                                sliceDim={sliceDim}
                                setSliceDim={setSliceDim}
                                sliceMinPct={sliceMinPct}
                                sliceMaxPct={sliceMaxPct}
                                sampling={sampling}
                                setSampling={setSampling}
                                comparisonCount={comparisonCount}
                                sessionCategory={sessionCategory}
                                maxImageCount={dataset.imageCount}
                            />
                        </div>
                        <StepNavigation cancelTo={`/dataset/${dataset.id}`} backTo={`/create-session/${datasetId}/session-info`} nextTo={null} finishText="Create" finishClicked={createSession} finishDisabled={false} />
                    </>
                } />
            </Routes>
        </StepContainer>
    )
}

export {CreateSession};
