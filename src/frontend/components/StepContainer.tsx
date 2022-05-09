import * as React from 'react';

function StepContainer({children}: {children?: any}) {
    return (
        <main className="mx-auto max-w-screen-md">
            <div className="mt-32 p-4 pt-3 h-144 bg-gray-800 border border-gray-700 rounded flex flex-col justify-between">
                {children}
            </div>
        </main>
    )
}

export {StepContainer};
