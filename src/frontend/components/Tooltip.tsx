import * as React from 'react';

export function Tooltip({text, children}: {text: string, children?: any}) {
    return (
        <div className="relative group">
            {children}
            <div className="absolute z-10 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition">
                <div className="p-1 -mx-24 w-48 bg-black rounded">
                    <div className="text-xs text-center">{text}</div>
                </div>
            </div>
        </div>
    )
}
