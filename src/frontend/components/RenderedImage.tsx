import * as React from 'react';
import {useEffect, useRef, useState} from 'react';
import {clearCanvas, loadAndRender} from '../rendering';
import {fileapi} from '../backend';
import {Button} from './Buttons';

interface RenderedImageProps {
    imagePath: string;
    sliceDim: number;
    sliceIndex: number;
    brightness: number;
    hFlip?: boolean;
    vFlip?: boolean;
    transpose?: boolean;

    allowSave?: boolean;
    imageId?: number;
}

export function RenderedImage({imagePath, sliceDim, sliceIndex, brightness, hFlip = false, vFlip = false, transpose = false, allowSave = false, imageId = null}: RenderedImageProps) {
    const canvasRef = useRef(null);
    const [curImagePath, setCurImagePath] = useState<string | null>(null);

    function draw() {
        loadAndRender(imagePath, sliceDim, sliceIndex, canvasRef.current, brightness, hFlip, vFlip, transpose);
    }

    async function saveThumbnail() {
        // TODO: possibly remove this
        if (allowSave && imageId) {
            const canvas = canvasRef.current as HTMLCanvasElement;
            fileapi.writeThumbnail(canvas, `${imageId}_${sliceDim}_${sliceIndex}`);
        }
    }

    useEffect(() => {
        // If we are loading a different image, clear the canvas to act as a simple loading indicator
        if (curImagePath !== imagePath) {
            clearCanvas(canvasRef.current);
            setTimeout(draw, 100); // Timeout required so empty canvas is rendered
        }
        else {
            draw();
        }
        setCurImagePath(imagePath);
    }, [imagePath, sliceDim, sliceIndex, brightness, hFlip, vFlip, transpose]);

    return (
        <div className="w-full h-full bg-black">
            <canvas className="w-full h-full" ref={canvasRef} width={0} height={0} />
            {allowSave && imageId && <div className="p-2 flex justify-center">
                <Button color="fuchsia" onClick={() => saveThumbnail()}>Save Thumbnail</Button>
            </div>}
        </div>
    )
}
