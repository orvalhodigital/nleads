import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { CheckCircle2, ChevronUp, ChevronDown, X } from 'lucide-react';

interface OnboardingChecklistProps {
  onStart?: () => void;
}

const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({ onStart }) => {
  const { profile, vehicles, leads } = useData();
  const [isMinimized, setIsMinimized] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  const checklist = [
    { id: 'logo', label: 'Logo da empresa', done: !!profile?.company_logo },
    { id: 'avatar', label: 'Foto de perfil', done: !!profile?.avatar_url },
    { id: 'whatsapp', label: 'WhatsApp conectado', done: !!profile?.whatsapp_webhook_url },
    { id: 'vehicle-type', label: 'Tipo de veículo', done: profile?.enable_cars || profile?.enable_motorcycles },
  ];

  const completedCount = checklist.filter((item) => item.done).length;
  const allComplete = completedCount === checklist.length;

  useEffect(() => {
    // Show checklist if not all complete, regardless of onboarding_completed
    const shouldShow = profile && completedCount < checklist.length;
    setIsVisible(shouldShow);
  }, [profile, completedCount]);

  if (!isVisible || allComplete) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-6 left-4 lg:left-72 bg-white rounded-2xl shadow-2xl border-2 border-slate-200 transition-all duration-300 z-40 ${
        isMinimized ? 'w-14 h-14 cursor-pointer hover:bg-slate-50 flex items-center justify-center overflow-hidden' : 'w-80'
      }`}
      onClick={() => isMinimized && setIsMinimized(false)}
    >
      {/* Icon when minimized */}
      {isMinimized ? (
        <div className="relative text-indigo-600">
            <CheckCircle2 size={24} />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-indigo-600 rounded-full" />
              <h3 className="font-bold text-slate-900">Configurações Pendentes</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
                title="Minimizar"
              >
                <ChevronDown size={18} />
              </button>
            </div>
          </div>

      {/* Content */}
      {!isMinimized && (
        <div className="p-4 space-y-3">
          {/* Progress */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-600 uppercase tracking-wider">Progresso</span>
              <span className="font-bold text-indigo-600">{completedCount}/4</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 transition-all"
                style={{ width: `${(completedCount / 4) * 100}%` }}
              />
            </div>
          </div>

          {/* Checklist items */}
          <div className="space-y-2">
            {checklist.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  item.done ? 'bg-emerald-50' : 'bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div
                  className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                    item.done ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  {item.done && <CheckCircle2 size={16} className="text-white" />}
                </div>
                <span
                  className={`text-sm font-medium ${
                    item.done ? 'text-emerald-900 line-through' : 'text-slate-700'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Motivational text & Action */}
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <button
              onClick={() => onStart?.()}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Continuar Onboarding</span>
            </button>
            <p className="text-xs text-slate-500 text-center">
              {completedCount === 4
                ? '✨ Tudo pronto!'
                : `${4 - completedCount} passo${4 - completedCount !== 1 ? 's' : ''} para terminar`}
            </p>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default OnboardingChecklist;
