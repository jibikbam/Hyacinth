import React from 'react';
import {VolumeSlice} from './VolumeSlice';

function App() {
    return (
        <VolumeSlice imagePath="data/datasets/dataset1/img1.nii.gz" sliceIndex={100} />
    )
}

export {App};
