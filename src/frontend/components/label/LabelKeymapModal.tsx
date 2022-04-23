import * as React from 'react';
import {Modal} from '../Modal';
import {XIcon} from '@heroicons/react/outline';

function KeymapRow({keyText, funcText}: {keyText: string, funcText: string}) {
    return (
        <tr className="hover:bg-gray-100 hover:text-black transition">
            <td className="font-medium font-mono">{keyText}</td>
            <td>{funcText}</td>
        </tr>
    )
}

function SpacerRow() {
    return <tr><td className="pt-4" /></tr>;
}

export function LabelKeymapModal({closeModal}: {closeModal: () => void}) {
    return (
        <Modal closeModal={closeModal}>
            <div className="mt-32 w-1/3 h-144 p-4 rounded border border-gray-400 border-opacity-40 flex flex-col">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-medium">Keymap</h2>
                    <button className="rounded text-white hover:text-gray-400 focus:ring-2 ring-gray-400 transition focus:outline-none" onClick={() => closeModal()}>
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <table className="mt-4 text-gray-400 border-separate" style={{borderSpacing: '0 0.25rem'}}>
                    <thead>
                        <tr className="text-sm text-gray-500 font-medium">
                            <td>Key</td>
                            <td>Function</td>
                        </tr>
                    </thead>
                    <tbody>
                        <KeymapRow keyText="&rarr; / D" funcText="Next slice or comparison" />
                        <KeymapRow keyText="&larr; / A" funcText="Previous slice or comparison" />
                        <SpacerRow />
                        <KeymapRow keyText="&uarr; / W" funcText="Increase brightness" />
                        <KeymapRow keyText="&darr; / S" funcText="Decrease brightness" />
                        <KeymapRow keyText="Shift + (&uarr; / W)" funcText="Max brightness" />
                        <KeymapRow keyText="Shift + (&darr; / S)" funcText="Min brightness" />
                        <KeymapRow keyText="R" funcText="Reset brightness" />
                    </tbody>
                </table>
            </div>
        </Modal>
    )
}
