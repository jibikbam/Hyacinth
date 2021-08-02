import * as React from 'react';
import {Button, LinkButton} from './Buttons';

interface StepNavigationProps {
    cancelTo?: string;
    backTo?: string;
    nextTo?: string;
    finishText?: string;
    finishClicked?: Function;
    finishDisabled?: boolean;
}

function StepNavigation({cancelTo, backTo, nextTo, finishText, finishClicked, finishDisabled}: StepNavigationProps) {
    return (
        <div className="flex justify-between items-center">
            <LinkButton to={cancelTo} disabled={!cancelTo}>Cancel</LinkButton>
            <div className="flex items-center space-x-3">
                <LinkButton to={backTo} disabled={!backTo}>Back</LinkButton>
                {!finishText
                    ? <LinkButton to={nextTo} color="pink" disabled={!nextTo}>Next</LinkButton>
                    : <Button onClick={finishClicked} color="pink" disabled={finishDisabled}>{finishText}</Button>
                }
            </div>
        </div>
    )
}

export {StepNavigation};
