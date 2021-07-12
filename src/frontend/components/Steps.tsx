import React from 'react';

function Steps({title, numSteps, curStep}) {
    return (
        <div>{title} - {curStep + 1} / {numSteps}</div>
    )
}

export {Steps};
