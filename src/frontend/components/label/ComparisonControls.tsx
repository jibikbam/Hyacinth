import * as React from 'react';
import {Comparison, ElementLabel, LabelingSession} from '../../backend';
import {LabelSlice} from './LabelSlice';
import {LabelControls} from './LabelControls';
import * as Utils from '../../utils';

interface ComparisonControlsProps {
    session: LabelingSession;
    comparison: Comparison;
    labels: ElementLabel[];
    addLabel: (labelValue: string) => void;
    nextOnLabel: boolean;
    setNextOnLabel: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ComparisonControls({session, comparison, labels, addLabel, nextOnLabel, setNextOnLabel}: ComparisonControlsProps) {
    const curLabelValue = labels.length > 0 ? labels[0].labelValue : null;
    return (
        <div className="flex justify-center items-start">
            <div className="flex items-center space-x-4">
                <LabelSlice
                    datasetRootPath={comparison.datasetRootPath}
                    imageRelPath={comparison.imageRelPath1}
                    sliceDim={comparison.sliceDim1}
                    sliceIndex={comparison.sliceIndex1}
                    bindKey="1"
                    selected={curLabelValue === 'First'}
                    onImageClick={() => addLabel('First')}
                />
                <LabelSlice
                    datasetRootPath={comparison.datasetRootPath}
                    imageRelPath={comparison.imageRelPath2}
                    sliceDim={comparison.sliceDim2}
                    sliceIndex={comparison.sliceIndex2}
                    bindKey="2"
                    selected={curLabelValue === 'Second'}
                    onImageClick={() => addLabel('Second')}
                />
            </div>
            <div className="ml-6 w-48">
                <LabelControls
                    additional={true}
                    labelOptions={Utils.splitLabelOptions(session.labelOptions)}
                    labels={labels}
                    addLabel={addLabel}
                    nextOnLabel={nextOnLabel}
                    setNextOnLabel={setNextOnLabel}
                    bindStart={2}
                />
            </div>
        </div>
    )
}
