import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isToday, isSameDay, isSameMonth, startOfWeek, startOfMonth, eachDayOfInterval, addDays } from 'date-fns';

interface AgendaCalendarViewProps {
  calendarItems: any[];
  currentDate: Date;
}

export const AgendaCalendarView: React.FC<AgendaCalendarViewProps> = ({
  calendarItems,
  currentDate
}) => {
  const navigate = useNavigate();
  const start = startOfWeek(startOfMonth(currentDate));
  const days = eachDayOfInterval({ start, end: addDays(start, 34) });

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 overflow-hidden animate-fadeUp">
      <div className="grid grid-cols-7 gap-1">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
          <div key={`${day}-${i}`} className="py-2 text-[8px] font-black text-slate-300 uppercase text-center">{day}</div>
        ))}
        {days.map(day => {
          const dayItems = calendarItems.filter(v => isSameDay(v.date, day));
          const isCurrentMonth = isSameMonth(day, currentDate);
          return (
            <div key={day.toISOString()} className={`min-h-[100px] p-2 rounded-xl border ${!isCurrentMonth ? 'opacity-10 grayscale' : isToday(day) ? 'bg-brand-50/50 border-brand-100' : 'border-slate-50 hover:bg-slate-50/30'} transition-all`}>
              <span className={`text-[9px] font-black ${isToday(day) ? 'text-brand-500' : 'text-slate-300'}`}>{format(day, 'd')}</span>
              <div className="mt-1 space-y-0.5">
                {dayItems.map(v => (
                  <div key={v.id} onClick={() => navigate(`/leads/${v.leadId}`)} className={`p-0.5 px-1 rounded text-[7px] font-black text-white truncate cursor-pointer ${v.type === 'visit' ? 'bg-slate-900 hover:bg-brand-600' : 'bg-blue-500 hover:bg-blue-600'}`}>
                    {format(v.date, 'HH:mm')} {v.name}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-slate-900"></div>
          <span className="text-[9px] font-bold text-slate-400">Visitas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500"></div>
          <span className="text-[9px] font-bold text-slate-400">Follow-ups</span>
        </div>
      </div>
    </div>
  );
};
