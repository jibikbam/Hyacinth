import * as React from 'react';
import {useMemo, useState} from 'react';
import {useParams} from 'react-router-dom';
import {dbapi} from '../backend';
import {InputRange, Select} from './Inputs';
import {VolumeSlice} from './VolumeSlice';

function DebugSliceViewer() {
    const {datasetId} = useParams();
    const [sliceIndex, setSliceIndex] = useState(100);
    const [dim, setDim] = useState("0");

    const images = useMemo(() => {
        return dbapi.selectDatasetImages(parseInt(datasetId));
    }, datasetId);

    const imagePath = images[0].datasetRootPath + '/' + images[0].relPath;
    return (
        <div className="mt-4 flex flex-col items-center">
            <VolumeSlice imagePath={imagePath} sliceIndex={Math.round(sliceIndex)} sliceDim={parseInt(dim)} brightness={50} />
            <div className="mt-4 w-96 flex items-center">
                <div className="flex-1 flex items-center">
                    <InputRange min={0} max={256} step={1} value={sliceIndex} setValue={setSliceIndex} />
                    <div className="w-16 text-center">{sliceIndex}</div>
                </div>
                <div className="ml-2 w-16">
                    <Select id="dim-select" label="Dim" options={["0", "1", "2"]} value={dim} setValue={setDim} />
                </div>
            </div>
        </div>
    )
}

export {DebugSliceViewer};
