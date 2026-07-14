import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface CustomSelectOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
    color?: string;
}

interface CustomSelectProps {
    options: CustomSelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    searchable?: boolean;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    containerClassName?: string;
    error?: string;
    footer?: React.ReactNode;
}

// ─── Portal Dropdown ─────────────────────────────────────────────────────────
// Renders dropdown list into document.body so it is NEVER clipped by
// overflow:hidden / overflow:auto ancestors (modals with scroll, etc.)
const DropdownPortal: React.FC<{
    triggerRef: React.RefObject<HTMLElement | null>;
    onClose: () => void;
    children: React.ReactNode;
}> = ({ triggerRef, onClose, children }) => {
    const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

    useLayoutEffect(() => {
        const update = () => {
            if (triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                setPos({
                    top: rect.bottom + window.scrollY + 4,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                });
            }
        };
        update();
        window.addEventListener('scroll', update, true);
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
        };
    }, [triggerRef]);

    return createPortal(
        <div
            style={{
                position: 'absolute',
                top: pos.top,
                left: pos.left,
                width: pos.width,
                zIndex: 20000,
            }}
            className="bg-white border border-brand-100 shadow-2xl rounded-2xl overflow-hidden animate-slideDown"
            onMouseDown={e => e.stopPropagation()}
        >
            {children}
        </div>,
        document.body
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const CustomSelect: React.FC<CustomSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Selecione uma opção...',
    label,
    searchable = false,
    required = false,
    disabled = false,
    className = '',
    containerClassName = '',
    error,
    footer
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const selectedOption = options.find(opt => opt.value === value);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div className={`relative space-y-2 ${containerClassName}`} ref={containerRef}>
            {label && (
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1 block">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`
                    w-full px-4 py-3.5 bg-slate-50 border transition-all cursor-pointer flex items-center justify-between
                    ${isOpen ? 'border-brand-500 ring-4 ring-brand-500/10 rounded-2xl' : 'border-slate-100 rounded-2xl hover:border-slate-200'}
                    ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}
                    ${error ? 'border-red-500 ring-red-500/10' : ''}
                    ${className}
                `}
            >
                <div className="flex items-center gap-3 truncate">
                    {selectedOption?.icon && (
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${selectedOption.color || 'bg-slate-100 text-slate-400'}`}>
                            {selectedOption.icon}
                        </div>
                    )}
                    <span className={`text-sm font-bold truncate ${selectedOption ? 'text-slate-800' : 'text-slate-400'}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <ChevronDown size={18} className={`text-slate-500 transition-transform shrink-0 ${isOpen ? 'rotate-180 text-brand-500' : ''}`} />
            </div>

            {isOpen && !disabled && (
                <DropdownPortal triggerRef={containerRef} onClose={() => setIsOpen(false)}>
                    {searchable && (
                        <div className="p-3 border-b border-slate-50 relative">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                onClick={e => e.stopPropagation()}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-brand-200"
                            />
                            {searchTerm && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setSearchTerm(''); }}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-600"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    )}

                    <div className="max-h-60 overflow-y-auto custom-scrollbar p-2">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(option => (
                                <div
                                    key={option.value}
                                    onClick={(e) => { e.stopPropagation(); handleSelect(option.value); }}
                                    className={`
                                        px-4 py-3 rounded-xl cursor-pointer flex items-center justify-between group transition-colors
                                        ${option.value === value ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}
                                    `}
                                >
                                    <div className="flex items-center gap-3 truncate">
                                        {option.icon && (
                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${option.value === value ? (option.color || 'bg-brand-100 text-brand-600') : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                                                {option.icon}
                                            </div>
                                        )}
                                        <span className={`text-xs font-black uppercase tracking-tight truncate ${option.value === value ? 'text-brand-700' : 'text-slate-700'}`}>
                                            {option.label}
                                        </span>
                                    </div>
                                    {option.value === value && <Check size={16} className="text-brand-600 shrink-0" />}
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">Nada encontrado</p>
                            </div>
                        )}
                    </div>

                    {footer && (
                        <div className="p-2 bg-slate-50/80 border-t border-slate-100 backdrop-blur-sm">
                            {footer}
                        </div>
                    )}
                </DropdownPortal>
            )}

            {error && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest px-2 italic">{error}</p>}
        </div>
    );
};

export default CustomSelect;
