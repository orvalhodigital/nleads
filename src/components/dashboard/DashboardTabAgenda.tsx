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
            <SectionHeader icon={Calendar} title="Agenda Visitas" subtitle="Resumo do dia" color="text-rose-500 bg-rose-500/10 border-rose-500/20" />
            <button onClick={() => navigate('/agenda')} className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-all shadow-xl hover:-translate-y-1 cursor-pointer">
              <ArrowRight size={20} />
            </button>
          </div>
          <div className="space-y-4">
            <AgendaRow icon={Users} label="Visitas Agendadas" value={visToday} subtitle="Total para o dia de hoje" colorClass="text-amber-600 bg-amber-50" />
            <AgendaRow icon={CheckCircle2} label="Visitas Realizadas" value={visitsDoneToday} subtitle="Concluídas com sucesso" colorClass="text-brand-600 bg-brand-50 border border-brand-100" />
          </div>
        </GlassSection>

        <GlassSection>
          <div className="flex items-center justify-between mb-8">
            <SectionHeader icon={PhoneCall} title="Follow-Ups" subtitle="Próximos contatos" color="text-blue-500 bg-blue-500/10 border-blue-500/20" />
          </div>
          <div className="space-y-4">
            <AgendaRow icon={PhoneCall} label="Follow-Ups p/ Hoje" value={followupsToday} subtitle="Ligue ou mande mensagem" colorClass="text-blue-600 bg-blue-50" />
            <AgendaRow icon={PhoneCall} label="Follow-Ups p/ Amanhã" value={followupsTomorrow} subtitle="Preparar contatos para o dia seguinte" colorClass="text-blue-500 bg-blue-50/60" />
          </div>
        </GlassSection>

        <GlassSection>
          <div className="flex items-center justify-between mb-8">
            <SectionHeader icon={Clock} title="Projeção Amanhã" subtitle="O que está por vir" color="text-slate-500 bg-slate-100 border-slate-200" />
          </div>
          <div className="flex flex-col gap-4">
            <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Novas Visitas</p>
                <p className="text-3xl font-black text-slate-800 mt-2">{appointmentsTomorrow}</p>
              </div>
              <div className="text-4xl opacity-20">📅</div>
            </div>
          </div>
        </GlassSection>
      </div>
    </div>
  );
};
