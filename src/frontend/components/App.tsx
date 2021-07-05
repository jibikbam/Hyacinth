import React, {useState} from 'react';
import {VolumeSlice} from './VolumeSlice';

function App() {
    const [index1, setIndex1] = useState(Math.floor(Math.random() * 200));
    const [index2, setIndex2] = useState(Math.floor(Math.random() * 200));

    function handleRefreshClick() {
        setIndex1(Math.floor(Math.random() * 200));
        setIndex2(Math.floor(Math.random() * 200));
    }

    return (
        <div>
            <button onClick={handleRefreshClick}>Refresh</button>
            <div>
                <VolumeSlice imagePath="data/datasets/dataset1/img1.nii.gz" sliceIndex={index1} />
                <VolumeSlice imagePath="data/datasets/dataset1/img2.nii.gz" sliceIndex={index2} />
            </div>
        </div>
    )
}

export {App};
