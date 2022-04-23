import * as React from 'react';
import {RefreshIcon} from '@heroicons/react/solid';

export function LabelTimer({timerSeconds, resetTimer}: {timerSeconds: number, resetTimer: Function}) {
    const minutes = Math.floor(timerSeconds / 60).toString();
    const seconds = Math.floor(timerSeconds % 60).toString().padStart(2, '0');

    function handleResetClick() {
        resetTimer();
    }

    return (
        <div className="flex">
            <div className="px-3 bg-gray-600 rounded-l flex items-center">
                <span className="text-gray-300 font-mono">{minutes}:{seconds}</span>
            </div>
            <button
                className="px-3 py-1.5 bg-gray-400 hover:bg-gray-500 rounded-r focus:outline-none focus:ring-4 ring-gray-400 hover:ring-gray-500 ring-opacity-50 hover:ring-opacity-50 transition"
                onClick={handleResetClick}
            >
                <RefreshIcon className="text-gray-800 w-5 h-5" />
            </button>
        </div>
    )
}
