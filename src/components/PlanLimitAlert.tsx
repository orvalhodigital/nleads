import React from 'react';
import { AlertCircle, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { planService } from '../services/planService';

interface PlanLimitAlertProps {
  plan: string;
  featureName: string;
  currentCount?: number;
  limit?: number;
  email?: string;
  onUpgrade?: () => void;
}

const PlanLimitAlert: React.FC<PlanLimitAlertProps> = ({
  plan,
  featureName,
  currentCount,
  limit,
  email,
  onUpgrade,
}) => {
  const navigate = useNavigate();

  if (plan && plan !== 'free' && plan !== 'trial') return null;

  const handleUpgrade = async () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate('/settings?tab=Planos');
    }
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6 flex items-start gap-4">
      <div className="p-3 bg-amber-100 rounded-lg text-amber-600 shrink-0">
        <AlertCircle size={20} />
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-amber-950 mb-1">
          Limite do Plano Básico
        </h3>
        <p className="text-sm text-amber-900 mb-4">
          {featureName} está disponível apenas no Plano Ilimitado.
          {currentCount !== undefined && limit !== undefined && (
            <> Você está usando {currentCount} de {limit} {featureName.toLowerCase()}.</>
          )}
        </p>
        <button
          onClick={handleUpgrade}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold text-sm hover:bg-amber-700 transition-all"
        >
          <Zap size={16} />
          Fazer Upgrade
        </button>
      </div>
    </div>
  );
};

export default PlanLimitAlert;
