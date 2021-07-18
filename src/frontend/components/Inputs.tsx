import React from 'react';

interface InputTextProps {
    id: string;
    label: string;
    placeholder: string;
    value: string;
    setValue: Function;
}
function InputText({id, label, placeholder, value, setValue}: InputTextProps) {
    return (
        <div>
            <label className="text-sm text-gray-400 font-medium" htmlFor={id}>{label}</label>
            <input
                className="px-3 py-1 w-full bg-gray-400 rounded text-lg text-black placeholder-gray-600 focus:outline-none focus:ring-2 ring-gray-300"
                id={id}
                type="text"
                placeholder={placeholder}
                value={value}
                onInput={ev => setValue(ev.target.value)}
            />
        </div>
    )
}

export {InputText};
