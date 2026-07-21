import React, { useState } from 'react';
import { Lock, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { planService } from '../services/planService';

/**
 * Tela de bloqueio para assinatura em atraso além da graça de 3 dias.
 * Todas as telas ficam inacessíveis, exceto Configurações (onde se paga).
 * A entrada de leads pelo Supabase (server-side) continua funcionando — este
 * bloqueio é só da interface do lojista.
 */
const SubscriptionBlocked: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleRenew = async () => {
        setLoading(true);
        try {
            const url = await planService.getAsaasBillingPortalLink();
            window.location.href = url;
        } catch {
            // Se o portal falhar, manda para Configurações, onde há a opção de plano.
            navigate('/settings');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full p-8 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Lock className="text-red-500" size={30} />
                </div>
                <h1 className="text-2xl font-black text-slate-900 mb-2">Acesso suspenso</h1>
                <p className="text-slate-500 font-medium mb-6 leading-relaxed">
                    Sua assinatura está com pagamento atrasado há mais de 3 dias. Regularize o pagamento para reativar o acesso ao sistema.
                    <br /><br />
                    <span className="text-sm text-slate-400">Fique tranquilo: os leads que chegam pelos seus canais continuam sendo registrados normalmente.</span>
                </p>
                <div className="space-y-3">
                    <button
                        onClick={handleRenew}
                        disabled={loading}
                        className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-60"
                    >
                        {loading ? 'Abrindo...' : 'Renovar assinatura'}
                    </button>
                    <button
                        onClick={() => navigate('/settings')}
                        className="w-full py-3.5 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <Settings size={18} /> Ir para Configurações
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionBlocked;
