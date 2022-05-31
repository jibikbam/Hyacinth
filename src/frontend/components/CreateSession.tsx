import * as React from 'react';
import {useMemo, useState} from 'react';
import {Routes, Route, useParams, useNavigate} from 'react-router-dom';
import {SessionCategory, SessionType, dbapi} from '../backend';
import {StepContainer} from './StepContainer';
import {StepHeader} from './StepHeader';
import {StepNavigation} from './StepNavigation';
import {InputNumber, InputText, Select} from './Inputs';
import {CheckCircleIcon, CollectionIcon, ScaleIcon} from '@heroicons/react/outline';
import {BookOpenIcon, ChartBarIcon, ChartPieIcon} from '@heroicons/react/solid';
import {
    InputValidator, useNumberBoundsValidator,
    useSessionLabelOptionsValidator,
    useSessionNameValidator,
    useStringLengthValidator
} from '../hooks/validators';
import {SliceSampleOpts} from '../sampling';
import * as Session from '../sessions/session';

type SamplingType = 'Exhaustive' | 'Random' | 'Sort';

function TypeOption({text, highlight, onClick, children}: {text: string, highlight: boolean, onClick: Function, children?: any}) {
    const borderColor = highlight ? 'border-gray-300' : 'border-gray-700 hover:border-gray-400';
    const iconColor = highlight ? 'text-gray-800' : 'text-gray-400';
    const circleColor = highlight ? 'bg-gray-300' : 'bg-black bg-opacity-20 border-2 border-gray-700';
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
    function buttonClasses(highlight: boolean): string {
        const hClass = (highlight)
            ? 'bg-black bg-opacity-50'
            : 'hover:bg-black hover:bg-opacity-50';
        return 'px-3 py-1.5 transition flex items-center ' + hClass;
    }
    return (
        <div className="text-gray-400 font-medium rounded border border-gray-600 divide-x divide-gray-600 overflow-hidden inline-flex items-center">
            <button className={buttonClasses(sampling == 'Exhaustive')} onClick={() => setSampling('Exhaustive')}>
                <BookOpenIcon className="w-5 h-5" />
                <span className="ml-1">Exhaustive</span>
            </button>
            <button className={buttonClasses(sampling == 'Random')} onClick={() => setSampling('Random')}>
                <ChartPieIcon className="w-5 h-5" />
                <span className="ml-1">Random</span>
            </button>
            <button className={buttonClasses(sampling == 'Sort')} onClick={() => setSampling('Sort')}>
                <ChartBarIcon className="w-5 h-5" />
                <span className="ml-1">Active (Sort)</span>
            </button>
        </div>
    )
}

interface SamplingOptionsStepProps {
    slicesFrom: string;
    setSlicesFrom: Function;
    imageCount: InputValidator<number>;
    sliceCount: InputValidator<number>;
    orientation: Orientation;
    setOrientation: React.Dispatch<React.SetStateAction<Orientation>>;
    sliceMinPct: InputValidator<number>;
    sliceMaxPct: InputValidator<number>;
    sampling: SamplingType;
    setSampling: Function;
    comparisonCount: InputValidator<number>;

    sessionCategory: SessionCategory;
    maxImageCount: number;
    sessionNames: string[];
}

function SamplingOptionsStep(props: SamplingOptionsStepProps) {
    return (
        <div className="mt-4 flex items-start space-x-12">
            <div className="w-64">
                <div>
                    <Select
                        id="slices-from"
                        label="Slices From"
                        options={['Create New'].concat(props.sessionNames)}
                        value={props.slicesFrom}
                        setValue={props.setSlicesFrom}
                    />
                </div>
                {(props.slicesFrom === 'Create New') && (
                    <div>
                        <div className="mt-3 flex space-x-4">
                            <InputNumber id="image-count" label="Images" help="Number of images (volumes) to sample slices from." min={1} validator={props.imageCount}/>
                            <InputNumber id="slice-count" label="Slices" help="Number of slices to be labeled in this session." min={2} validator={props.sliceCount}/>
                        </div>
                        <div className="mt-3">
                            <Select id="slice-dim" label="Orientation" options={ORIENTATIONS} value={props.orientation} setValue={(val: string) => props.setOrientation(val as Orientation)} />
                        </div>
                        <div className="mt-3 flex space-x-4">
                            <InputNumber id="slice-min-pct" label="Slice Min (%)" help="Lowest slice to sample in this orientation (0% to 100%)." min={0} validator={props.sliceMinPct} />
                            <InputNumber id="slice-max-pct" label="Slice Max (%)" help="Highest slice to be sampled in this orientation (0% to 100%)." min={0} validator={props.sliceMaxPct} />
                        </div>
                    </div>
                )}
            </div>
            {(props.sessionCategory === 'Comparison') && (
                <div>
                    <div>
                        <div className="text-sm text-gray-400">Comparison Sampling</div>
                        <div className="mt-1">
                            <SamplingButtonGroup sampling={props.sampling} setSampling={props.setSampling} />
                        </div>
                    </div>
                    {props.sampling === 'Random' && (
                        <div className="mt-3 w-1/2 pr-2">
                            <InputNumber id="comparison-count" label="Comparisons" help="Number of comparisons to be labeled in this session." validator={props.comparisonCount} />
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

type Orientation = 'Sagittal' | 'Coronal' | 'Axial';
const ORIENTATIONS = ['Sagittal', 'Coronal', 'Axial'];

function CreateSession() {
    const {datasetId} = useParams();
    const navigate = useNavigate();

    const [dataset, datasetImages, datasetSessions] = useMemo(() => {
        return [
            dbapi.selectDataset(datasetId),
            dbapi.selectDatasetImages(datasetId),
            dbapi.selectDatasetSessions(datasetId)
        ];
    }, []);

    const [sessionCategory, setSessionCategory] = useState<SessionCategory | null>(null);
    const sessionName = useSessionNameValidator('', datasetId);
    const prompt = useStringLengthValidator('');
    const labelOptions = useSessionLabelOptionsValidator('', sessionCategory);

    const [slicesFrom, setSlicesFrom] = useState<string>('Create New');
    const imageCount = useNumberBoundsValidator(1, 1, datasetImages.length);
    const sliceCount = useNumberBoundsValidator(2, 2);
    const [orientation, setOrientation] = useState<Orientation>('Sagittal');
    const sliceMinPct = useNumberBoundsValidator(20, 0, 100);
    const sliceMaxPct = useNumberBoundsValidator(80, 0, 100);

    const [sampling, setSampling] = useState<SamplingType>('Random');
    const comparisonCount = useNumberBoundsValidator(1, 1);

    function createSession() {
        const sessionType: SessionType = (sessionCategory === 'Classification')
            ? 'Classification'
            : (sampling === 'Sort') ? 'ComparisonActiveSort' : 'ComparisonRandom';

        const sessClass = Session.getClass(sessionType);
        const slicesFromSession = (slicesFrom === 'Create New')
            ? null
            : datasetSessions.find(s => s.sessionName === slicesFrom);

        const sliceOpts: SliceSampleOpts = {
            imageCount: imageCount.value, sliceCount: sliceCount.value, sliceDim: ORIENTATIONS.indexOf(orientation),
            sliceMinPct: sliceMinPct.value, sliceMaxPct: sliceMaxPct.value
        };

        const comparisonCountVal = (sampling === 'Exhaustive') ? -1 : comparisonCount.value;
        const newSessionId = sessClass.createSession(datasetId, sessionName.value, prompt.value, labelOptions.value,
            slicesFromSession, sliceOpts, comparisonCountVal);

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
                                orientation={orientation}
                                setOrientation={setOrientation}
                                sliceMinPct={sliceMinPct}
                                sliceMaxPct={sliceMaxPct}
                                sampling={sampling}
                                setSampling={setSampling}
                                comparisonCount={comparisonCount}
                                sessionCategory={sessionCategory}
                                maxImageCount={dataset.imageCount}
                                sessionNames={datasetSessions.map(s => s.sessionName)}
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
