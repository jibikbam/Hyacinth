import * as React from 'react';
import {ElementLabel} from '../../backend';
import {Button} from '../Buttons';
import {ColorSwatchIcon} from '@heroicons/react/solid';

interface LabelControlsProps {
    additional: boolean;
    labelOptions: string[];
    labels: ElementLabel[];
    addLabel: (string) => void;
    bindStart: number;
}

export function LabelControls({additional, labelOptions, labels, addLabel, bindStart}: LabelControlsProps) {
    const curLabelValue = labels.length > 0 ? labels[0].labelValue : null;
    const skeletonLabels = Array.from(Array(Math.max(3 - labelOptions.length, 0)).keys());

    return (
        <div>
            <div className="text-gray-400 flex items-center">
                <ColorSwatchIcon className="w-5 h-5" />
                <span className="ml-1">{additional && 'Additional '}Labels</span>
            </div>
            <div className="mt-3 flex flex-col space-y-3">
                {labelOptions.map((labelOption, i) => {
                    return (
                        <Button
                            key={i}
                            size="lg"
                            color={labelOption === curLabelValue ? 'darkPink' : 'darkGray'}
                            onClick={() => addLabel(labelOption)}
                        >
                            <span>{labelOption} ({i + bindStart + 1})</span>
                        </Button>
                    )
                })}
                {skeletonLabels.map(i => <div key={i} className="bg-gray-800 rounded h-10" />)}
            </div>
        </div>
    )
}
