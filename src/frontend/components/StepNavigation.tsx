import React from 'react';
import {Link} from 'react-router-dom';

function StepLinkButton({text, to = null, enabled = true, highlight = false}) {
    if (!enabled) {
        return <span className="inline-block px-4 py-1.5 bg-gray-600 rounded text-gray-400 cursor-not-allowed">{text}</span>
    }

    if (highlight) {
        return <Link to={to} className="inline-block px-4 py-1.5 bg-pink-200 rounded shadow text-black focus:outline-none focus:ring-4 ring-pink-200 ring-opacity-50">{text}</Link>
    }

    return <Link to={to} className="inline-block px-4 py-1.5 bg-gray-500 rounded shadow text-white focus:outline-none focus:ring-4 ring-gray-500 ring-opacity-50">{text}</Link>
}

function StepNavigation({cancelTo, backTo, nextTo, altNextText = null, altNextClicked = null, altNextEnabled=false}) {
    let next;
    if (altNextText) {
        if (altNextEnabled) {
            next = (
                <button
                    className="px-4 py-1.5 bg-pink-200 rounded shadow text-black focus:outline-none focus:ring-4 ring-pink-200 ring-opacity-50"
                    onClick={() => altNextClicked()}
                >{altNextText}</button>
            )
        }
        else {
            next = <StepLinkButton text={altNextText} enabled={false} />
        }
    }
    else {
        next = <StepLinkButton text="Next" to={nextTo} enabled={nextTo !== null} highlight={true} />
    }

    return (
        <div className="flex justify-between items-center">
            <div>
                <StepLinkButton text="Cancel" to={cancelTo} />
            </div>
            <div className="flex items-center space-x-3">
                <div>
                    <StepLinkButton text="Back" to={backTo} enabled={backTo !== null} />
                </div>
                <div>
                    {next}
                </div>
            </div>
        </div>
    )
}

export {StepNavigation};
