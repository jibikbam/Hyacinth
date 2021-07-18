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

interface InputNumberProps {
    id: string;
    label: string;
    value: number;
    setValue: Function;
}

function InputNumber({id, label, value, setValue}: InputNumberProps) {
    return (
        <div className="flex flex-col items-start">
            <label className="text-sm text-gray-400 font-medium" htmlFor={id}>{label}</label>
            <input
                className="mt-0.5 px-3 py-1 w-full bg-gray-400 rounded shadow text-xl text-black focus:outline-none focus:ring-2 ring-gray-300"
                id={id}
                type="number"
                value={value}
                onInput={ev => setValue(ev.target.value)}
            />
        </div>
    )
}

interface SelectProps {
    id: string;
    label: string;
    options: string[];
    value: string;
    setValue: Function;
}

function Select({id, label, options, value, setValue}: SelectProps) {
    return (
        <div className="flex flex-col items-start">
            <label className="text-sm text-gray-400 font-medium" htmlFor={id}>{label}</label>
            <select
                className="appearance-none mt-0.5 px-3 py-1 w-full bg-gray-400 rounded text-black font-medium focus:outline-none focus:ring-2 ring-gray-300"
                id={id}
                value={value}
                onInput={ev => setValue(ev.target.value)}
            >
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    )
}

export {InputText, InputNumber, Select};
