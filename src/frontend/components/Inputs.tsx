import * as React from 'react';
import {SelectorIcon} from '@heroicons/react/solid';

interface InputTextProps {
    id: string;
    label: string | null;
    placeholder: string;
    value: string;
    setValue: Function;
}

function InputText({id, label, placeholder, value, setValue}: InputTextProps) {
    return (
        <div>
            {label && <label className="text-sm text-gray-400 font-medium" htmlFor={id}>{label}</label>}
            <input
                className="px-3 py-1 w-full bg-gray-400 rounded text-lg text-black placeholder-gray-600 focus:outline-none focus:ring-2 ring-gray-300"
                id={id}
                type="text"
                placeholder={placeholder}
                value={value}
                onInput={ev => setValue(ev.currentTarget.value)}
            />
        </div>
    )
}

interface InputNumberProps {
    id: string;
    label: string;
    min?: number;
    max?: number;
    value: number;
    setValue: Function;
}

function InputNumber({id, label, value, min, max, setValue}: InputNumberProps) {
    return (
        <div className="flex-1 flex flex-col items-start">
            <label className="text-sm text-gray-400 font-medium" htmlFor={id}>{label}</label>
            <input
                className="mt-0.5 px-3 py-1 w-full bg-gray-400 rounded shadow text-xl text-black focus:outline-none focus:ring-2 ring-gray-300"
                id={id}
                type="number"
                value={value.toString()}
                min={min}
                max={max}
                onInput={ev => setValue(parseInt(ev.currentTarget.value) || 0)}
            />
        </div>
    )
}

interface InputRangeProps {
    min: number;
    max: number;
    step: number;
    value: number;
    setValue: (number) => void;
}

function InputRange({min, max, step, value, setValue}: InputRangeProps) {
    const valPct = value == 0 ? 0 : ((value - min) / (max - min)) * 100;
    return (
        <input
            className="w-full"
            style={{backgroundSize: `${valPct}% 100%`}}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onInput={ev => setValue(ev.currentTarget.value)}
        />
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
            <div className="relative w-full">
                <select
                    className="appearance-none mt-0.5 px-3 py-1 w-full bg-gray-400 rounded text-black font-medium focus:outline-none focus:ring-2 ring-gray-300"
                    id={id}
                    value={value}
                    onInput={ev => setValue(ev.currentTarget.value)}
                >
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <div className="absolute mr-1 inset-y-0 right-0 flex items-center">
                    <SelectorIcon className="w-5 h-5 text-gray-700" />
                </div>
            </div>
        </div>
    )
}

export {InputText, InputNumber, InputRange, Select};
