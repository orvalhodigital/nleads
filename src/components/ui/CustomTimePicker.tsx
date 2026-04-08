import React, { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CustomTimePickerProps {
    value: string; // HH:mm format
    onChange: (time: string) => void;
    placeholder?: string;
    className?: string;
}

const generateTimeOptions = () => {
    const options: string[] = [];
    for (let h = 0; h < 24; h++) {
        const hour = h.toString().padStart(2, '0');
        options.push(`${hour}:00`);
        options.push(`${hour}:30`);
    }
    return options;
};

export const CustomTimePicker: React.FC<CustomTimePickerProps> = ({ value, onChange, placeholder = 'Selecionar horário', className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const options = generateTimeOptions();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);

            // Scroll to selected time when opening
            if (value && containerRef.current) {
                setTimeout(() => {
                    const selectedElem = containerRef.current?.querySelector(`[data-time="${value}"]`);
                    if (selectedElem) {
                        selectedElem.scrollIntoView({ block: 'center', behavior: 'smooth' });
                    }
                }, 10);
            }
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, value]);

    const handleSelect = (time: string) => {
        onChange(time);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={containerRef}>
            <div
                className={`flex items-center justify-between cursor-pointer ${className || 'w-full text-sm font-semibold p-3.5 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-emerald-500 transition-all outline-none'}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={value ? 'text-slate-800' : 'text-slate-400 font-medium'}>
                    {value || placeholder}
                </span>
                <Clock size={16} className="text-slate-400" />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-[100] w-full max-h-60 overflow-y-auto animate-fadeUp custom-scrollbar py-2">
                    {options.map((time) => (
                        <div
                            key={time}
                            data-time={time}
                            className={`px-4 py-2.5 mx-2 rounded-xl text-sm font-bold cursor-pointer transition-colors ${value === time
                                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                                    : 'text-slate-600 hover:bg-slate-50'
                                }`}
                            onClick={() => handleSelect(time)}
                        >
                            {time}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
