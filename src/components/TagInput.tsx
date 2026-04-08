import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
    label: string;
    value: string[];
    onChange: (tags: string[]) => void;
    suggestions: string[];
    placeholder?: string;
}

const TagInput: React.FC<TagInputProps> = ({ label, value, onChange, suggestions, placeholder }) => {
    const [inputValue, setInputValue] = useState('');
    const [activeSuggestion, setActiveSuggestion] = useState(0);
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (inputValue) {
            const filtered = suggestions.filter(
                suggestion => suggestion.toLowerCase().includes(inputValue.toLowerCase()) && !value.includes(suggestion)
            );
            setFilteredSuggestions(filtered);
            setShowSuggestions(true);
            setActiveSuggestion(0);
        } else {
            setShowSuggestions(false);
        }
    }, [inputValue, suggestions, value]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (inputValue) {
                // If suggestion is selected/active, add it. Otherwise add input as is.
                const tagToAdd = (showSuggestions && filteredSuggestions[activeSuggestion])
                    ? filteredSuggestions[activeSuggestion]
                    : inputValue;

                if (tagToAdd && !value.includes(tagToAdd)) {
                    onChange([...value, tagToAdd]);
                    setInputValue('');
                }
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            if (showSuggestions && filteredSuggestions.length > 0) {
                setInputValue(filteredSuggestions[activeSuggestion]);
                // Optional: auto-add on tab? User said "TAB ... writes automatically" (autocompletes) 
                // "Enter ... adds as tag". So Tab just autocompletes the text.
            }
        } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
            onChange(value.slice(0, -1));
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (activeSuggestion < filteredSuggestions.length - 1) {
                setActiveSuggestion(prev => prev + 1);
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (activeSuggestion > 0) {
                setActiveSuggestion(prev => prev - 1);
            }
        }
    };

    const removeTag = (tagToRemove: string) => {
        onChange(value.filter(tag => tag !== tagToRemove));
    };

    const handleSuggestionClick = (suggestion: string) => {
        if (!value.includes(suggestion)) {
            onChange([...value, suggestion]);
            setInputValue('');
        }
        inputRef.current?.focus();
    };

    return (
        <div className="w-full">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 block">{label}</label>
            <div
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-sm font-bold text-slate-700 outline-none focus-within:border-emerald-500 transition-colors flex flex-wrap gap-2 min-h-[46px]"
                onClick={() => inputRef.current?.focus()}
            >
                {value.map((tag, i) => (
                    <span key={i} className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
                        {tag}
                        <button
                            onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                            className="hover:text-red-500 rounded-full"
                        >
                            <X size={12} />
                        </button>
                    </span>
                ))}
                <div className="relative flex-1 min-w-[120px] group">
                    {showSuggestions && filteredSuggestions.length > 0 && inputValue && filteredSuggestions[activeSuggestion]?.toLowerCase().startsWith(inputValue.toLowerCase()) && (
                        <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none overflow-hidden">
                            <span className="text-transparent whitespace-pre font-bold text-sm font-sans">{inputValue}</span>
                            <span className="text-slate-300 font-bold text-sm font-sans">
                                {filteredSuggestions[activeSuggestion]?.slice(inputValue.length)}
                            </span>
                        </div>
                    )}
                    <input
                        ref={inputRef}
                        className="w-full bg-transparent outline-none h-full relative z-10 font-bold text-sm text-slate-700 placeholder:font-normal placeholder:text-slate-400"
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={value.length === 0 ? placeholder : ''}
                        autoComplete="off"
                    />
                    {showSuggestions && (
                        <div className="absolute top-full left-0 w-full bg-white border border-slate-100 rounded-xl shadow-lg mt-2 max-h-40 overflow-y-auto z-50">
                            {filteredSuggestions.map((suggestion, index) => (
                                <div
                                    key={suggestion}
                                    className={`px-4 py-2 cursor-pointer text-xs font-bold uppercase transition-colors ${index === activeSuggestion ? 'bg-slate-50 text-emerald-500' : 'text-slate-600 hover:bg-slate-50'}`}
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    onMouseEnter={() => setActiveSuggestion(index)}
                                >
                                    {suggestion}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TagInput;
