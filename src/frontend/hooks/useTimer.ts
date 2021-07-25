import {useEffect, useState} from 'react';

const TIMER_INTERVAL_MS = 100; // 0.1 seconds

function useTimer(): [number, number, Function] {
    const [timestamp, setTimestamp] = useState<number>(Date.now());
    const [displaySeconds, setDisplaySeconds] = useState<number>(0);

    useEffect(() => {
        const intervalID = setInterval(() => {
            const curTimestamp = Date.now();
            setDisplaySeconds((curTimestamp - timestamp) / 1000);
        }, TIMER_INTERVAL_MS);

        return () => {
            clearInterval(intervalID);
        }
    }, [timestamp]);

    function resetTimer() {
        setTimestamp(Date.now());
        setDisplaySeconds(0);
    }

    return [timestamp, displaySeconds, resetTimer];
}

export {useTimer};
