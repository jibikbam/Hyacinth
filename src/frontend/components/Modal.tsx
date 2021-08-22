import * as React from 'react';
import {useRef} from 'react';

function Modal({closeModal, children}: {closeModal: () => void, children?: any}) {
    return (
        <div className="z-20 relative">
            <div
                className="absolute top-0 left-0 w-screen h-screen bg-black bg-opacity-90 flex justify-center items-start"
                onClick={ev => {
                    if (ev.currentTarget === ev.target) closeModal();
                }}
            >{children}</div>
        </div>
    )
}

export {Modal};
