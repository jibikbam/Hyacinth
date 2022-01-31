import * as React from 'react';
import {useEffect, useRef, useState} from 'react';
import {clearCanvas, loadImageCached, renderToCanvas, sliceVolume} from '../rendering';

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
        const image = loadImageCached(imagePath);
        const imagePixels = image.is3d ? sliceVolume(image, sliceDim, sliceIndex, hFlip, vFlip, transpose) : image.image2d;
        renderToCanvas(canvasRef.current, imagePixels, brightness);
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
        </div>
    )
}
