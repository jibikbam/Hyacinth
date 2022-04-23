import * as React from 'react';
import {ElementLabel, LabelingSession, Slice} from '../../backend';
import {LabelSlice} from './LabelSlice';
import {LabelControls} from './LabelControls';

interface ClassificationControlsProps {
    session: LabelingSession;
    slice: Slice;
    labels: ElementLabel[];
    addLabel: (labelValue: string) => void;
}

export function ClassificationControls({session, slice, labels, addLabel}: ClassificationControlsProps) {
    return (
        <div className="flex justify-center items-start">
            <div>
                <LabelSlice
                    datasetRootPath={slice.datasetRootPath}
                    imageRelPath={slice.imageRelPath}
                    sliceDim={slice.sliceDim}
                    sliceIndex={slice.sliceIndex}
                    bindKey={null}
                    selected={false}
                    onImageClick={null}
                />
            </div>
            <div className="ml-6 w-56">
                <LabelControls additional={false} labelOptions={session.labelOptions.split(',')} labels={labels} addLabel={addLabel} bindStart={0} />
            </div>
        </div>
    )
}
