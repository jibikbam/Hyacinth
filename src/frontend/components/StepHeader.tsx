import * as React from 'react';
import {useEffect, useRef} from 'react';

interface StepStatusProps {
    stepDescription: string;
    curStep: number;
    stepCount: number;
}

function StepStatus({stepDescription, curStep, stepCount}: StepStatusProps) {
    return (
        <div className="px-3 pt-2 pb-1.5 bg-black bg-opacity-30 border border-gray-700 rounded flex flex-col items-center">
            <div className="w-40 flex items-center">
                {Array.from(Array(stepCount - 1).keys()).map((i) => {
                    const circleColor = (i < curStep)
                        ? 'bg-fuchsia-300'
                        : (i === curStep)
                            ? 'bg-gray-800 border-2 border-fuchsia-300'
                            : 'bg-gray-800 border-2 border-gray-500';

                    const lineColor = (i < curStep)
                        ? 'bg-fuchsia-300'
                        : 'bg-gray-500';

                    return (
                        <React.Fragment key={i}>
                            <div className={'z-10 w-3 h-3 rounded-full ' + circleColor} />
                            <div className={'-mx-1 flex-1 h-0.5 ' + lineColor} />
                        </React.Fragment>
                    )
                })}
                <div className={'z-10 w-3 h-3 rounded-full ' + (curStep === stepCount - 1 ? 'bg-gray-800 border-2 border-fuchsia-300' : 'bg-gray-800 border-2 border-gray-500')} />
            </div>
            <div className="mt-2 text-xs text-gray-400 font-medium">{stepDescription}</div>
        </div>
    )
}

interface StepHeaderProps {
    title: string;
    stepDescription: string;
    curStep: number;
    stepCount: number;
}

function StepHeader({title, stepDescription, curStep, stepCount}: StepHeaderProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Force focus on step header when curStep changes
        // so that tab always selects the first input field of the step
        containerRef.current.focus();
    }, [curStep]);

    return (
        <div ref={containerRef} tabIndex={-1} className="pb-4 border-b-2 border-gray-700 flex justify-between items-center focus:outline-none">
            <h1 className="text-3xl text-white font-semibold">{title}</h1>
            <StepStatus stepDescription={stepDescription} curStep={curStep} stepCount={stepCount} />
        </div>
    )
}

export {StepHeader};
