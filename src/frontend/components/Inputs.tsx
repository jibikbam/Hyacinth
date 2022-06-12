import * as React from 'react';
import {InputValidator} from '../hooks/validators';
import {Tooltip} from './Tooltip';
import {QuestionMarkCircleIcon, SelectorIcon} from '@heroicons/react/solid';

interface InputTextProps {
    id: string;
    label: string | null;
    placeholder: string;
    dark?: boolean;
    value?: string;
    setValue?: Function;
    validator?: InputValidator<string>;
}

function InputText({id, label, placeholder, dark, value, setValue, validator}: InputTextProps) {
    return (
        <div>
            {label && <label className="mb-0.5 text-sm text-gray-400" htmlFor={id}>{label}</label>}
            <input
                className={`px-3 py-1 w-full ${dark ? 'bg-gray-900' : 'bg-black bg-opacity-50'} rounded text-gray-300 placeholder-gray-500 transition
                border ${(validator && validator.showErrors) ? 'border-red-400' : 'border-gray-700 hover:border-gray-500 focus:border-gray-400'}
                focus:outline-none`}
                id={id}
                type="text"
                placeholder={placeholder}
                value={validator ? validator.value : value}
                onInput={ev => (validator ? validator.setValue : setValue)(ev.currentTarget.value)}
            />
            {validator && validator.showErrors && validator.errors.map(e => <div key={e} className="mt-1.5 text-xs text-red-400">{e}</div>)}
        </div>
    )
}

interface InputNumberProps {
    id: string;
    label: string;
    help?: string;
    min?: number;
    max?: number;
    value?: number;
    setValue?: Function;
    validator?: InputValidator<number>;
}

function InputNumber({id, label, help, value, min, max, setValue, validator}: InputNumberProps) {
    return (
        <div className="flex-1 flex flex-col">
            {(label || help) &&
                <div className="mb-1 pr-0.5 flex justify-between items-center">
                    <label className="text-sm text-gray-400" htmlFor={id}>{label}</label>
                    {help && <Tooltip text={help}><QuestionMarkCircleIcon className="w-4 h-4 text-gray-500" /></Tooltip>}
                </div>
            }
            <input
                className={`px-3 py-1 w-full bg-black bg-opacity-40 rounded shadow text-xl text-gray-300 transition
                border ${(validator && validator.showErrors) ? 'border-red-400' : 'border-gray-700 hover:border-gray-400 focus:border-gray-400'}
                focus:outline-none`}
                id={id}
                type="number"
                value={validator ? validator.value.toString() : value.toString()}
                min={min}
                max={max}
                onInput={ev => (validator ? validator.setValue : setValue)(parseInt(ev.currentTarget.value) || 0)}
            />
            {validator && validator.showErrors && validator.errors.map(e => <div key={e} className="mt-1.5 text-xs text-red-400">{e}</div>)}
        </div>
    )
}

interface InputRangeProps {
    min: number;
    max: number;
    step: number;
    value: number;
    setValue: React.Dispatch<React.SetStateAction<number>>;
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
            onInput={ev => setValue(parseFloat(ev.currentTarget.value))}
        />
    )
}

interface SelectProps {
    id: string;
    label: string | null;
    options: string[];
    value: string;
    setValue: Function;
}

function Select({id, label, options, value, setValue}: SelectProps) {
    return (
        <div className="flex flex-col items-start">
            {label && <label className="mb-1 text-sm text-gray-400" htmlFor={id}>{label}</label>}
            <div className="relative w-full">
                <select
                    className="appearance-none px-3 py-1.5 w-full bg-black bg-opacity-50 rounded text-gray-300 transition
                    border border-gray-700 hover:border-gray-400 focus:border-gray-400
                    focus:outline-none"
                    id={id}
                    value={value}
                    onInput={ev => setValue(ev.currentTarget.value)}
                >
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <div className="absolute mr-1 inset-y-0 right-0 flex items-center">
                    <SelectorIcon className="w-5 h-5 text-gray-500" />
                </div>
            </div>
        </div>
    )
}

export {InputText, InputNumber, InputRange, Select};
