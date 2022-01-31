import * as React from 'react';
import {useMemo, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {dbapi} from '../backend';
import {InputRange, Select} from './Inputs';
import {RenderedImage} from './RenderedImage';
import {Button} from './Buttons';
import {ArrowLeftIcon, SwitchHorizontalIcon, SwitchVerticalIcon} from '@heroicons/react/solid';

function SliceWithControls({imagePath, sliceDim}: {imagePath: string, sliceDim: number}) {
    const [sliceIndex, setSliceIndex] = useState(100);
    const [hFlip, setHFlip] = useState(false);
    const [vFlip, setVFlip] = useState(false);
    const [transpose, setTranspose] = useState(false);

    return (
        <div className="flex-1 flex flex-col">
            <RenderedImage imagePath={imagePath} sliceIndex={Math.round(sliceIndex)} sliceDim={sliceDim} brightness={50} hFlip={hFlip} vFlip={vFlip} transpose={transpose} />
            <div className="mt-4 p-2 bg-gray-800 rounded flex justify-between items-center">
                <div className="ml-1 flex-1 flex items-center">
                    <InputRange min={0} max={255} step={1} value={sliceIndex} setValue={setSliceIndex} />
                    <div className="ml-3 py-0.5 w-16 bg-gray-700 rounded text-gray-400 text-center">{sliceIndex}</div>
                </div>
                <div className="ml-8 flex items-center space-x-2">
                    <Button size="icon" color={hFlip ? 'darkPink' : 'gray'} onClick={() => setHFlip(!hFlip)}>
                        <SwitchHorizontalIcon className="w-5 h-5" />
                    </Button>
                    <Button size="icon" color={vFlip ? 'darkPink' : 'gray'} onClick={() => setVFlip(!vFlip)}>
                        <SwitchVerticalIcon className="w-5 h-5" />
                    </Button>
                    <Button size="icon" color={transpose ? 'darkPink' : 'gray'} onClick={() => setTranspose(!transpose)}>
                        <SwitchVerticalIcon className="w-5 h-5 transform rotate-45" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

function DebugSliceViewer() {
    const {datasetId} = useParams();

    const images = useMemo(() => {
        return dbapi.selectDatasetImages(datasetId);
    }, [datasetId]);

    const [curImage, setCurImage] = useState(images[0]);

    function setCurImageFromPath(newRelPath: string) {
        for (const im of images) {
            if (im.relPath === newRelPath) {
                setCurImage(im);
                return;
            }
        }

        throw new Error(`No image found with relPath ${newRelPath}`);
    }

    const imagePath = curImage.datasetRootPath + '/' + curImage.relPath;
    return (
        <div>
            <header className="py-2 pl-4 pr-2 bg-gray-700 flex justify-between items-center">
                <div className="w-1/3">
                    <Link to={`/dataset/${datasetId}`} className="text-gray-300 hover:text-gray-400 transition flex items-center">
                        <ArrowLeftIcon className="w-4 h-4" />
                        <span className="ml-1.5">Back</span>
                    </Link>
                </div>
                <div className="w-1/3 text-center">
                    <Select id="image-select" label={null} options={images.map(di => di.relPath)} value={curImage.relPath} setValue={setCurImageFromPath} />
                </div>
                <div className="w-1/3" />
            </header>
            <div className="p-8 w-full space-x-8 flex items-end">
                {[0, 1, 2].map(sliceDim => <SliceWithControls key={sliceDim} imagePath={imagePath} sliceDim={sliceDim} />)}
            </div>
        </div>
    )
}

export {DebugSliceViewer};
