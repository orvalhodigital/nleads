import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { planService } from '../services/planService';

/**
 * Faixa fixa no topo para assinatura em atraso (dentro da graça de 3 dias).
 * O sistema ainda funciona; a faixa avisa e oferece a renovação.
 */
const OverdueBanner: React.FC = () => {
    const [loading, setLoading] = useState(false);

    const handleRenew = async () => {
        setLoading(true);
        try {
            const url = await planService.getAsaasBillingPortalLink();
            if (url) {
                window.location.href = url;
            } else {
                window.location.href = '/settings';
            }
        } catch (err: any) {
            console.warn('Erro ao obter link de cobrança do Asaas, redirecionando para configurações:', err);
            window.location.href = '/settings';
        }
    };

    return (
        <div className="bg-amber-500 text-white px-4 py-2.5 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center text-sm font-semibold">
            <span className="flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                Sua assinatura está com <strong>pagamento atrasado</strong>. Renove para não perder o acesso.
            </span>
            <button
                onClick={handleRenew}
                disabled={loading}
                className="bg-white text-amber-700 font-bold px-4 py-1.5 rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-60 shrink-0"
            >
                {loading ? 'Abrindo...' : 'Renovar assinatura'}
            </button>
        </div>
    );
};

export default OverdueBanner;
