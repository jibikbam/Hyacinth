import * as React from 'react';
import {useEffect, useRef} from 'react';
import * as NewRender from '../newrender';

interface RenderedImageProps {
    imagePath: string;
    sliceDim: number;
    sliceIndex: number;
    brightness: number;
    hFlip?: boolean;
    vFlip?: boolean;
    transpose?: boolean;
}

export function RenderedImage({imagePath, sliceDim, sliceIndex, brightness,
                                  hFlip = false, vFlip = false, transpose = false}: RenderedImageProps) {
    const canvasRef = useRef(null);

    useEffect(() => {
        NewRender.loadAndRender(canvasRef.current, imagePath, sliceDim, sliceIndex, brightness);
    }, [imagePath, sliceDim, sliceIndex, brightness, hFlip, vFlip, transpose]);

    return (
        <div className="w-full h-full bg-black flex justify-center items-center">
            <canvas className="h-full" ref={canvasRef} width={0} height={0} />
        </div>
    )
}
