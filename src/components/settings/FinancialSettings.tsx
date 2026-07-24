import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  FileText,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Lock,
  ArrowRight
} from 'lucide-react';
import { Profile } from '../../types';
import { planService } from '../../services/planService';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabaseClient';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FinancialSettingsProps {
  profile: Profile;
  onNavigateToPlans?: () => void;
}

export const FinancialSettings: React.FC<FinancialSettingsProps> = ({ profile, onNavigateToPlans }) => {
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [loadingRenew, setLoadingRenew] = useState(false);

  // Modal exclusão de conta
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const companyIdentifier = (profile.company_name || profile.full_name || profile.email || '').trim();

  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const data = await planService.getAsaasInvoices();
      setInvoices(data);
    } catch (err: any) {
      console.warn('Não foi possível carregar faturas:', err);
    } finally {
      setLoadingInvoices(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleRenewClick = async () => {
    setLoadingRenew(true);
    try {
      const url = await planService.getAsaasBillingPortalLink();
      if (url) {
        window.location.href = url;
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Erro ao abrir tela de faturamento.');
    } finally {
      setLoadingRenew(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirmationText) return;
    setIsDeletingAccount(true);
    try {
      await planService.deleteAccount(deleteConfirmationText);
      showToast('success', 'Sua conta foi excluída com sucesso.');
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (err: any) {
      showToast('error', err?.message || 'Erro ao excluir conta. Verifique a confirmação.');
      setIsDeletingAccount(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RECEIVED':
      case 'CONFIRMED':
      case 'RECEIVED_IN_CASH':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={13} /> Pago / Confirmado
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock size={13} /> Aguardando Pagamento
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertTriangle size={13} /> Em Atraso
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border">
            <XCircle size={13} /> {status}
          </span>
        );
    }
  };

  const formatCurrency = (val?: number) => {
    if (typeof val !== 'number') return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDateStr = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header Resumo da Conta & Assinatura */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-[-10%] top-[-20%] w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-amber-300 uppercase tracking-widest">
              <ShieldCheck size={14} /> Assinatura {profile.planStatus === 'overdue' ? 'Em Atraso' : 'Ativa'}
            </div>
            <h2 className="font-heading font-black text-2xl md:text-3xl tracking-tight text-white capitalize">
              Plano {profile.plan?.replace('-', ' ') || 'Gratuito'}
            </h2>
            <p className="text-xs md:text-sm text-slate-300 font-medium">
              {profile.planStatus === 'overdue'
                ? 'Sua conta está com pendência de pagamento. Renove para manter seu acesso sem interrupções.'
                : 'Sua conta está regularizada com acesso liberado a todas as ferramentas do Gestor de Pátio.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleRenewClick}
              disabled={loadingRenew}
              className="px-6 py-3.5 bg-primary text-primary-foreground font-extrabold rounded-2xl text-xs uppercase tracking-wider hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loadingRenew ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
              {loadingRenew ? 'Carregando...' : 'Fatura / Pagar no Asaas'}
            </button>

            {onNavigateToPlans && (
              <button
                onClick={onNavigateToPlans}
                className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs uppercase tracking-wider border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Trocar de Plano <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Histórico de Pagamentos e Recibos */}
      <div className="bg-card text-foreground rounded-3xl border border-border/80 p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
          <div>
            <h3 className="font-heading font-extrabold text-xl tracking-tight flex items-center gap-2">
              <FileText size={22} className="text-primary" /> Histórico de Faturas & Recibos
            </h3>
            <p className="text-xs text-muted-foreground font-medium mt-1">
              Consulte os comprovantes e recibos oficiais de todos os pagamentos realizados no Asaas.
            </p>
          </div>

          <button
            onClick={fetchInvoices}
            disabled={loadingInvoices}
            className="self-start sm:self-auto p-2.5 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-xs font-bold cursor-pointer"
          >
            <RefreshCw size={14} className={loadingInvoices ? 'animate-spin' : ''} />
            Atualizar Lista
          </button>
        </div>

        {loadingInvoices ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 size={28} className="animate-spin text-primary" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Carregando recibos do Asaas...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-border/80 rounded-2xl p-6">
            <CreditCard size={32} className="mx-auto text-muted-foreground/60 mb-2" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nenhuma fatura registrada ainda</p>
            <p className="text-xs text-muted-foreground/80 mt-1">As faturas e recibos gerados no Asaas aparecerão aqui automaticamente.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/80 text-[10px] uppercase font-black tracking-widest text-muted-foreground/80">
                  <th className="py-3 px-4">Data / Criada em</th>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4">Método</th>
                  <th className="py-3 px-4">Valor</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Recibo / Fatura</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs font-medium">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-4 px-4 font-bold text-foreground">
                      {formatDateStr(inv.paymentDate || inv.dateCreated || inv.dueDate)}
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">
                      {inv.description || 'Assinatura Gestor de Pátio'}
                    </td>
                    <td className="py-4 px-4 font-bold uppercase text-muted-foreground">
                      {inv.billingType || 'ONLINE'}
                    </td>
                    <td className="py-4 px-4 font-extrabold text-foreground">
                      {formatCurrency(inv.value)}
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(inv.status)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {inv.invoiceUrl ? (
                        <a
                          href={inv.invoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-bold text-xs transition-all cursor-pointer"
                        >
                          Ver Recibo <ExternalLink size={13} />
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground font-normal">Indisponível</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Zona de Perigo: Exclusão de Conta */}
      <div className="bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/20 rounded-3xl p-6 md:p-8 space-y-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div className="space-y-1 flex-1">
            <h3 className="font-heading font-extrabold text-lg text-rose-600 dark:text-rose-400 tracking-tight">
              Zona de Perigo — Exclusão Definitiva de Conta
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ao excluir sua conta, **todos os seus dados serão apagados permanentemente** do banco de dados (estoque de veículos, motos, histórico de leads, agendamentos, vendas e imagens). Esta ação é **irreversível** e cancela a assinatura no Asaas.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-rose-600/20"
          >
            <Trash2 size={15} /> Excluir Minha Conta
          </button>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão de Conta */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-card text-foreground rounded-3xl border border-rose-500/30 p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <Lock size={22} />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-xl tracking-tight">Confirmar Exclusão</h3>
                <p className="text-xs text-muted-foreground font-medium">Ação irreversível</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Para confirmar que você deseja apagar **todos os dados** de <strong className="text-foreground font-bold">{companyIdentifier}</strong> permanentemente, digite o nome exacto da sua empresa ou <strong className="text-rose-500">"EXCLUIR MINHA CONTA"</strong> no campo abaixo:
            </p>

            <input
              type="text"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder={`Digite "${companyIdentifier}"`}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmationText('');
                }}
                disabled={isDeletingAccount}
                className="px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                onClick={handleDeleteAccount}
                disabled={!deleteConfirmationText || isDeletingAccount}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-rose-600/20"
              >
                {isDeletingAccount ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                {isDeletingAccount ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
