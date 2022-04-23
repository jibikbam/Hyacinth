import * as React from 'react';
import {useEffect} from 'react';

function Modal({closeModal, children}: {closeModal: () => void, children?: any}) {
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.code === 'Escape') closeModal();
        }

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    });

    return (
        <div
            className="z-20 fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-90 flex justify-center items-start"
            onClick={ev => {
                if (ev.currentTarget === ev.target) closeModal();
            }}
        >{children}</div>
    )
}

export {Modal};
