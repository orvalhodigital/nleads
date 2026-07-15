import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, ArrowRight, Users, CheckCircle2, PhoneCall, Clock
} from 'lucide-react';
import {
  GlassSection, SectionHeader, AgendaRow
} from './DashboardUiComponents';

interface DashboardTabAgendaProps {
  visToday: number;
  visitsDoneToday: number;
  followupsToday: number;
  followupsTomorrow: number;
  appointmentsTomorrow: number;
}

export const DashboardTabAgenda: React.FC<DashboardTabAgendaProps> = ({
  visToday,
  visitsDoneToday,
  followupsToday,
  followupsTomorrow,
  appointmentsTomorrow
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 animate-fadeUp">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassSection>
          <div className="flex items-center justify-between mb-8">
            <SectionHeader icon={Calendar} title="Agenda Visitas" subtitle="Resumo do dia" color="text-rose-500 bg-rose-500/10 border-rose-500/20 dark:text-rose-400 dark:bg-rose-950/30" />
            <button onClick={() => navigate('/agenda')} className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/95 transition-all shadow-md hover:-translate-y-0.5 cursor-pointer">
              <ArrowRight size={20} />
            </button>
          </div>
          <div className="space-y-4">
            <AgendaRow icon={Users} label="Visitas Agendadas" value={visToday} subtitle="Total para o dia de hoje" colorClass="text-amber-600 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-950/30" />
            <AgendaRow icon={CheckCircle2} label="Visitas Realizadas" value={visitsDoneToday} subtitle="Concluídas com sucesso" colorClass="text-primary bg-primary/10 border border-primary/20" />
          </div>
        </GlassSection>

        <GlassSection>
          <div className="flex items-center justify-between mb-8">
            <SectionHeader icon={PhoneCall} title="Follow-Ups" subtitle="Próximos contatos" color="text-blue-500 bg-blue-500/10 border-blue-500/20 dark:text-blue-400 dark:bg-blue-950/30" />
          </div>
          <div className="space-y-4">
            <AgendaRow icon={PhoneCall} label="Follow-Ups p/ Hoje" value={followupsToday} subtitle="Ligue ou mande mensagem" colorClass="text-blue-600 bg-blue-500/10 dark:text-blue-400 dark:bg-blue-950/30" />
            <AgendaRow icon={PhoneCall} label="Follow-Ups p/ Amanhã" value={followupsTomorrow} subtitle="Preparar contatos para o dia seguinte" colorClass="text-blue-500 bg-blue-500/5 dark:text-blue-400 dark:bg-blue-950/20" />
          </div>
        </GlassSection>

        <GlassSection>
          <div className="flex items-center justify-between mb-8">
            <SectionHeader icon={Clock} title="Projeção Amanhã" subtitle="O que está por vir" color="text-muted-foreground bg-muted border-border/80" />
          </div>
          <div className="flex flex-col gap-4">
            <div className="bg-card/60 dark:bg-card/30 p-6 rounded-3xl border border-border/80 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Novas Visitas</p>
                <p className="text-3xl font-bold text-foreground mt-2">{appointmentsTomorrow}</p>
              </div>
              <div className="text-4xl opacity-20">📅</div>
            </div>
          </div>
        </GlassSection>
      </div>
    </div>
  );
};
