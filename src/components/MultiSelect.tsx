import React from 'react';
import { Check } from 'lucide-react';

interface MultiSelectProps {
    label: string;
    options: string[];
    value: string[];
    onChange: (value: string[]) => void;
    allowSelectAll?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ label, options, value, onChange, allowSelectAll = true }) => {

    const isAllSelected = options.every(opt => value.includes(opt));
    const isNoneSelected = value.length === 0;

    const toggleOption = (option: string) => {
        // Check if handling "Em aberto" or similar "Any" logic if present in options
        // Assuming options are just pure values here.

        if (value.includes(option)) {
            onChange(value.filter(v => v !== option));
        } else {
            onChange([...value, option]);
        }
    };

    const handleSelectAll = () => {
        if (isAllSelected) {
            onChange([]);
        } else {
            onChange([...options]);
        }
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-end mb-2">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">{label}</label>
                {allowSelectAll && (
                    <button
                        type="button"
                        onClick={handleSelectAll}
                        className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider hover:text-emerald-600 transition-colors"
                    >
                        {isAllSelected ? 'Desmarcar Todos' : 'Marcar Todos'}
                    </button>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                {options.map(option => {
                    const isSelected = value.includes(option);
                    return (
                        <button
                            key={option}
                            type="button"
                            onClick={() => toggleOption(option)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase transition-all flex items-center gap-2 ${isSelected
                                ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                                : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-emerald-300 hover:text-emerald-600'
                                }`}
                        >
                            {isSelected && <Check size={12} strokeWidth={4} />}
                            {option}
                        </button>
                    )
                })}
            </div>
        </div>
    );
};

export default MultiSelect;
