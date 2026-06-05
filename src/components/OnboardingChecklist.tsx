import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { CheckCircle2, ChevronUp, ChevronDown, X } from 'lucide-react';

const OnboardingChecklist: React.FC = () => {
  const { profile, vehicles, leads } = useData();
  const [isMinimized, setIsMinimized] = useState(false);
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
    // Show checklist after onboarding is hidden (when not onboarding_completed)
    const shouldShow = profile && !profile.onboarding_completed && completedCount < checklist.length;
    setIsVisible(shouldShow);
  }, [profile, completedCount]);

  if (!isVisible || allComplete) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl border-2 border-slate-200 transition-all duration-300 z-40 ${
        isMinimized ? 'w-64' : 'w-80'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-indigo-600 rounded-full" />
          <h3 className="font-bold text-slate-900">Painel em Desenvolvimento</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
            title={isMinimized ? 'Expandir' : 'Minimizar'}
          >
            {isMinimized ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
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

          {/* Motivational text */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500 text-center">
              {completedCount === 4
                ? '✨ Tudo pronto!'
                : `${4 - completedCount} passo${4 - completedCount !== 1 ? 's' : ''} para terminar`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingChecklist;
