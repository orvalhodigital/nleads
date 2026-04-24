import React, { useState, useRef, useEffect } from 'react';
import { format, startOfMonth, startOfWeek, endOfMonth, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface CustomDatePickerProps {
    value: string; // ISO date string YYYY-MM-DD
    onChange: (date: string) => void;
    minDate?: string;
    placeholder?: string;
    className?: string;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ value, onChange, minDate, placeholder = 'Selecionar data', className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(value ? new Date(value + 'T12:00:00') : new Date());
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleDateSelect = (date: Date) => {
        onChange(format(date, 'yyyy-MM-dd'));
        setIsOpen(false);
    };

    const toggleOpen = () => setIsOpen(!isOpen);

    const prevMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentMonth(subMonths(currentMonth, 1));
    };

    const nextMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentMonth(addMonths(currentMonth, 1));
    };

    const startDate = startOfWeek(startOfMonth(currentMonth));
    const endDate = endOfWeek(endOfMonth(currentMonth));
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

    const formattedValue = value ? format(new Date(value + 'T12:00:00'), 'dd/MM/yyyy') : '';

    return (
        <div className="relative" ref={containerRef}>
            <div
                className={`flex items-center justify-between cursor-pointer ${className || 'w-full text-sm font-semibold p-3.5 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-emerald-500 transition-all outline-none'}`}
                onClick={toggleOpen}
            >
                <span className={formattedValue ? 'text-slate-800' : 'text-slate-400 font-medium'}>
                    {formattedValue || placeholder}
                </span>
                <CalendarIcon size={16} className="text-slate-400" />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 p-4 bg-white border border-slate-100 rounded-2xl shadow-xl z-[20000] w-72 animate-fadeUp">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={prevMonth} className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-[12px] font-black uppercase tracking-widest text-slate-800">
                            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                        </span>
                        <button onClick={nextMonth} className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 mb-2">
                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                            <div key={i} className="text-center text-[10px] font-bold text-slate-400 uppercase">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {dateRange.map((day, i) => {
                            const isSelected = value && isSameDay(day, new Date(value + 'T12:00:00'));
                            const isCurrentMonthDay = isSameMonth(day, currentMonth);
                            const isTodayDay = isToday(day);

                            // Basic logic for minDate
                            let disabled = false;
                            if (minDate) {
                                const minD = new Date(minDate + 'T00:00:00');
                                disabled = day < minD;
                            }

                            return (
                                <button
                                    key={i}
                                    disabled={disabled}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDateSelect(day);
                                    }}
                                    className={`
                                        h-8 w-8 rounded-lg text-[11px] font-bold flex items-center justify-center transition-all
                                        ${disabled ? 'opacity-20 cursor-not-allowed text-slate-400' :
                                            isSelected ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30' :
                                                isTodayDay ? 'border border-emerald-500 text-emerald-600 font-black bg-emerald-50' :
                                                    isCurrentMonthDay ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-50'}
                                    `}
                                >
                                    {format(day, 'd')}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
