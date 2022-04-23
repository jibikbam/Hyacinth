import * as React from 'react';
import {useEffect, useState} from 'react';
import {RenderedImage} from '../RenderedImage';
import {RefreshIcon, SunIcon} from '@heroicons/react/solid';
import {InputRange} from '../Inputs';

interface LabelSliceProps {
    datasetRootPath: string;
    imageRelPath: string;
    sliceDim: number;
    sliceIndex: number;
    bindKey: string | null;
    selected: boolean;
    onImageClick: (() => void) | null;
}

const DEFAULT_BRIGHTNESS = 99.5;
const [MIN_BRIGHTNESS, MAX_BRIGHTNESS] = [90, 100];
const KEYBOARD_BRIGHTNESS_STEP = 0.5;

export function LabelSlice({datasetRootPath, imageRelPath, sliceDim, sliceIndex, bindKey, selected, onImageClick}: LabelSliceProps) {
    const [brightness, setBrightness] = useState<number>(DEFAULT_BRIGHTNESS);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [brightness]);

    function handleKeyDown(event: KeyboardEvent) {
        if (event.code === 'ArrowDown' || event.code === 'KeyS') {
            // Increase brightness value (dims image)
            if (event.getModifierState('Shift')) {
                setBrightness(MAX_BRIGHTNESS);
            }
            else {
                setBrightness(Math.min(brightness + KEYBOARD_BRIGHTNESS_STEP, MAX_BRIGHTNESS));
            }
        }
        else if (event.code === 'ArrowUp' || event.code === 'KeyW') {
            // Decrease brightness value (brightens image)
            if (event.getModifierState('Shift')) {
                setBrightness(MIN_BRIGHTNESS);
            }
            else {
                setBrightness(Math.max(brightness - KEYBOARD_BRIGHTNESS_STEP, MIN_BRIGHTNESS));
            }
        }
        else if (event.code === 'KeyR') {
            // Reset brightness
            setBrightness(DEFAULT_BRIGHTNESS);
        }
    }

    function handleClick() {
        if (onImageClick) onImageClick();
    }

    return (
        <div>
            <div
                className={`bg-black rounded ${selected ? 'border-2' : ''} border-pink-900 overflow-hidden flex justify-center items-center ${bindKey ? 'cursor-pointer' : ''}`}
                style={{width: '65vh', height: '65vh'}}
                onClick={handleClick}
            >
                <RenderedImage imagePath={datasetRootPath + '/' + imageRelPath} sliceDim={sliceDim} sliceIndex={sliceIndex} brightness={brightness} />
            </div>
            <div className="mt-3 px-2 py-1 bg-gray-800 rounded flex items-center">
                <SunIcon className="mr-2 w-6 h-6 text-gray-400" />
                <InputRange min={MIN_BRIGHTNESS} max={MAX_BRIGHTNESS} step={0.01} value={brightness} setValue={setBrightness} />
                <button
                    className="ml-3 rounded text-gray-500 hover:text-gray-400 active:text-gray-100 focus:outline-none focus:ring-2 ring-gray-600 transition"
                    onClick={() => setBrightness(DEFAULT_BRIGHTNESS)}
                >
                    <RefreshIcon className="w-5 h-5" />
                </button>
                <div className="ml-3 py-0.5 w-20 bg-gray-700 rounded text-sm text-gray-400 text-center font-mono">{brightness.toFixed(1)}</div>
            </div>
            <div className="mt-2 p-2 bg-gray-800 rounded text-gray-400 text-center">
                <div className="flex justify-center items-center">
                    <div className="max-w-lg ml-2 text-xl break-words">{imageRelPath} {sliceDim} {sliceIndex}</div>
                </div>
                {bindKey && <div className="text-sm">Click or press "{bindKey}".</div>}
            </div>
        </div>
    )
}
