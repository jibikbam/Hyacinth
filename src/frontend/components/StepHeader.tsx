import * as React from 'react';
import {useEffect, useRef} from 'react';

interface StepStatusProps {
    stepDescription: string;
    curStep: number;
    stepCount: number;
}

function StepStatus({stepDescription, curStep, stepCount}: StepStatusProps) {
    return (
        <div className="flex flex-col items-center">
            <div className="w-40 flex items-center">
                {Array.from(Array(stepCount - 1).keys()).map((i) => {
                    const circleColor = (i < curStep)
                        ? 'bg-fuchsia-300'
                        : (i === curStep)
                            ? 'bg-gray-700 border-2 border-fuchsia-300'
                            : 'bg-gray-700 border-2 border-gray-500';

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
                <div className={'z-10 w-3 h-3 rounded-full ' + (curStep === stepCount - 1 ? 'bg-gray-700 border-2 border-fuchsia-300' : 'bg-gray-700 border-2 border-gray-500')} />
            </div>
            <div className="mt-1 text-sm text-gray-400">{stepDescription}</div>
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
        <div ref={containerRef} tabIndex={-1} className="pb-2 border-b border-gray-600 flex justify-between items-center focus:outline-none">
            <h1 className="text-3xl text-gray-300">{title}</h1>
            <StepStatus stepDescription={stepDescription} curStep={curStep} stepCount={stepCount} />
        </div>
    )
}

export {StepHeader};
