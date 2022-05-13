import * as React from 'react';
import {ElementLabel} from '../../backend';
import {Modal} from '../Modal';
import {XIcon} from '@heroicons/react/outline';

export function PastLabelsModal({labels, closeModal}: {labels: ElementLabel[], closeModal: () => void}) {
    return (
        <Modal closeModal={closeModal}>
            <div className="mt-32 w-1/3 h-144 bg-gray-800 rounded border border-gray-700 flex flex-col">
                <div className="mx-3 py-2 border-b-2 border-gray-700 flex justify-between items-center">
                    <div className="text-gray-400 font-medium">Label History</div>
                    <button className="rounded text-gray-400 hover:text-gray-100 focus:ring-2 ring-gray-400 transition focus:outline-none" onClick={() => closeModal()}>
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="mt-4 px-3 overflow-y-scroll">
                    <table className="w-full">
                        <thead className="text-xs text-gray-400 font-medium">
                            <tr>
                                <td className="pb-1">Label</td>
                                <td className="pb-1">Date Labeled</td>
                                <td className="pb-1">Timer</td>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-gray-400">
                        {labels.map(label => {
                            const secondsTaken = Math.round((label.finishTimestamp - label.startTimestamp) / 1000);
                            const minutes = Math.floor(secondsTaken / 60);
                            const seconds = (secondsTaken % 60).toString().padStart(2, '0');
                            return (
                                <tr key={label.id}>
                                    <td>{label.labelValue}</td>
                                    <td>{new Date(label.finishTimestamp).toLocaleDateString('en-US', {hour: '2-digit', minute: '2-digit'})}</td>
                                    <td>{minutes}:{seconds}</td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                    {labels.length === 0 && <div className="mt-24 text-gray-400 text-center">No labels yet. Past labels will appear here.</div>}
                </div>
            </div>
        </Modal>
    )
}
