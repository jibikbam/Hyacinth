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
}

export function RenderedImage({imagePath, sliceDim, sliceIndex, brightness, hFlip = false, vFlip = false, transpose = false}: RenderedImageProps) {
    const canvasRef = useRef(null);
    const [curImagePath, setCurImagePath] = useState<string | null>(null);

    function draw() {
        loadAndRender(imagePath, sliceDim, sliceIndex, canvasRef.current, brightness, hFlip, vFlip, transpose);
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
        <div className="w-full h-full bg-black flex justify-center items-center">
            <canvas className="h-full" ref={canvasRef} width={0} height={0} />
        </div>
    )
}
