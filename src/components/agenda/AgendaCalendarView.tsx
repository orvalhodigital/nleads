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
    <div className="bg-card rounded-3xl border border-border/80 shadow-sm p-6 overflow-hidden animate-fadeUp">
      <div className="grid grid-cols-7 gap-1">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
          <div key={`${day}-${i}`} className="py-2 text-[8px] font-bold text-muted-foreground/60 uppercase text-center">{day}</div>
        ))}
        {days.map(day => {
          const dayItems = calendarItems.filter(v => isSameDay(v.date, day));
          const isCurrentMonth = isSameMonth(day, currentDate);
          return (
            <div key={day.toISOString()} className={`min-h-[100px] p-2 rounded-xl border ${!isCurrentMonth ? 'opacity-10 grayscale' : isToday(day) ? 'bg-primary/10 border-primary/20' : 'border-border/40 hover:bg-muted'} transition-all`}>
              <span className={`text-[9px] font-bold ${isToday(day) ? 'text-primary' : 'text-muted-foreground/60'}`}>{format(day, 'd')}</span>
              <div className="mt-1 space-y-0.5">
                {dayItems.map(v => (
                  <div key={v.id} onClick={() => navigate(`/leads/${v.leadId}`)} className={`p-0.5 px-1 rounded text-[7px] font-bold text-primary-foreground truncate cursor-pointer ${v.type === 'visit' ? 'bg-primary hover:bg-primary/80' : 'bg-blue-500 hover:bg-blue-600'}`}>
                    {format(v.date, 'HH:mm')} {v.name}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/80">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-primary"></div>
          <span className="text-[9px] font-bold text-muted-foreground">Compromissos Agendados</span>
        </div>
      </div>
    </div>
  );
};
