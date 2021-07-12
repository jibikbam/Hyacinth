import React, {useState} from 'react';
import {Link} from 'react-router-dom';

function loadDatasets() {
    return (window as any).dbapi.selectDatasets();
}

function Datasets() {
    const [datasets, setDatasets] = useState(loadDatasets());

    return (
        <main className="mt-32 mx-auto max-w-screen-sm">
            <div className="flex justify-between items-end">
                <div className="text-3xl">Datasets</div>
                <Link className="px-4 py-1.5 bg-pink-200 rounded text-black font-medium focus:outline-none focus:ring-4 ring-pink-200 ring-opacity-50">New</Link>
            </div>
            <div className="mt-2 space-y-4">
                {datasets.map(d => {
                    return (
                        <Link>
                            <div className="px-3 py-2 bg-gray-700 rounded">
                                <div>
                                    <div className="text-2xl">{d.name}</div>
                                    <div className="text-gray-400 font-medium">{d.image_count} volumes &bull; 0 labeling sessions</div>
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </main>
    )
}

export {Datasets};
