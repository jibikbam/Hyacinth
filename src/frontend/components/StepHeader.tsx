import React from 'react';

interface StepStatusProps {
    stepDescription: string;
    curStep: number;
    stepCount: number;
}

function StepStatus({stepDescription, curStep, stepCount}: StepStatusProps) {
    return <div>{stepDescription} - {curStep + 1} / {stepCount}</div>
}

interface StepHeaderProps {
    title: string;
    stepDescription: string;
    curStep: number;
    stepCount: number;
}

function StepHeader({title, stepDescription, curStep, stepCount}: StepHeaderProps) {
    return (
        <div className="flex justify-between items-center">
            <h1>{title}</h1>
            <StepStatus stepDescription={stepDescription} curStep={curStep} stepCount={stepCount} />
        </div>
    )
}

export {StepHeader};
