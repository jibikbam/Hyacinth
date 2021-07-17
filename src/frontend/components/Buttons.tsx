import React from 'react';
import {Link} from 'react-router-dom';

const SIZE_CLASSES = {
    md: 'px-4 py-1.5',
}

const COLOR_CLASSES = {
    gray: 'bg-gray-500 ring-gray-500 text-white',
    pink: 'bg-pink-200 ring-pink-200 text-black',
}

const BUTTON_CLASSES = 'rounded shadow focus:outline-none focus:ring-4 ring-opacity-50';
const DISABLED_CLASSES = 'rounded bg-gray-600 text-gray-400';

function Button({onClick = null, size = 'md', color = 'gray', disabled = false, children = null}) {
    if (disabled) {
        const classes = [DISABLED_CLASSES, SIZE_CLASSES[size]];
        return <button className={classes.join(' ')} disabled={disabled}>{children}</button>
    }

    const classes = [BUTTON_CLASSES, SIZE_CLASSES[size], COLOR_CLASSES[color]];
    return <button onClick={onClick} className={classes.join(' ')}>{children}</button>
}

function LinkButton({to = null, size = 'md', color = 'gray', disabled = false, children = null}) {
    if (disabled) {
        const classes = ['inline-block', DISABLED_CLASSES, SIZE_CLASSES[size]];
        return <div className={classes.join(' ')}>{children}</div>
    }

    const classes = ['inline-block', BUTTON_CLASSES, SIZE_CLASSES[size], COLOR_CLASSES[color]];
    return <Link to={to} className={classes.join(' ')}>{children}</Link>
}

export {Button, LinkButton};
