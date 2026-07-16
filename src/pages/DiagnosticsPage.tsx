import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Check, RefreshCw, AlertTriangle, Play, Sparkles, CheckCircle2, ListFilter, Trash2, MessageCircle, ArrowRight } from 'lucide-react';

interface PlaybookItem {
  id: string;
  label: string;
  category: 'Atendimento' | 'Processo' | 'Engajamento' | 'Gestão';
  weight: number;
}

const PLAYBOOK_ITEMS: PlaybookItem[] = [
  // Pilar 1: Primeiro Contato & Rapidez (Atendimento)
  { id: 'tempo_resposta', label: 'Tempo de resposta ao primeiro contato com o lead inferior a 15 minutos.', category: 'Atendimento', weight: 5 },
  { id: 'saudacao_nome', label: 'Saudação inicial profissional e humanizada, citando o nome do cliente e da loja.', category: 'Atendimento', weight: 3 },
  { id: 'template_qualificacao', label: 'Utilização de scripts ou templates padronizados para qualificação preliminar no WhatsApp.', category: 'Atendimento', weight: 3 },
  { id: 'preferencia_canal', label: 'Confirmação do canal preferencial de contato do cliente (WhatsApp, Ligação ou Presencial).', category: 'Atendimento', weight: 2 },
  { id: 'midia_veiculo', label: 'Envio de foto ou vídeo real do veículo de interesse logo na primeira abordagem do vendedor.', category: 'Atendimento', weight: 4 },

  // Pilar 2: Qualificação & Sondagem (Processo)
  { id: 'investigacao_troca', label: 'Sondagem sobre a existência de veículo usado para troca e envio de dados para avaliação inicial.', category: 'Processo', weight: 4 },
  { id: 'condicoes_pagamento', label: 'Levantamento explícito das condições de pagamento desejadas (financiamento, à vista, consórcio).', category: 'Processo', weight: 4 },
  { id: 'uso_veiculo', label: 'Entendimento sobre o uso principal do veículo (trabalho, família, dia a dia) para melhor direcionamento.', category: 'Processo', weight: 2 },
  { id: 'score_financiamento', label: 'Simulação de score/crédito básica antes do envio da proposta para evitar reprovação rápida.', category: 'Processo', weight: 5 },
  { id: 'registro_preferencias', label: 'Cadastro imediato das preferências completas (cor, opcionais, faixa de preço) do lead no CRM.', category: 'Processo', weight: 4 },

  // Pilar 3: Follow-Up & Agendamento (Engajamento)
  { id: 'tentativa_visita', label: 'Tentativa clara e assertiva de agendar uma visita física ou test-drive na primeira conversa.', category: 'Engajamento', weight: 5 },
  { id: 'lembrete_visita', label: 'Envio de lembretes automáticos ou manuais de confirmação 24h e 2h antes da visita agendada.', category: 'Engajamento', weight: 3 },
  { id: 'motivo_perda', label: 'Registro claro e padronizado do motivo de desqualificação quando o lead é perdido.', category: 'Engajamento', weight: 3 },
  { id: 'followup_ativo', label: 'Execução de follow-up ativo em no máximo 48h para leads em fases de standby ou proposta.', category: 'Engajamento', weight: 4 },
  { id: 'estoque_alternativo', label: 'Oferta proativa de opções alternativas de estoque caso o veículo original seja vendido.', category: 'Engajamento', weight: 3 },

  // Pilar 4: Technology & Fechamento (Gestão)
  { id: 'crm_kanban', label: 'Uso diário do funil Kanban do CRM para mover as fases e atualizar o status comercial real.', category: 'Gestão', weight: 4 },
  { id: 'historico_limpo', label: 'Anotação e histórico de todas as interações no sistema (fim de anotações físicas/papéis).', category: 'Gestão', weight: 4 },
  { id: 'portais_integrados', label: 'Integração direta e automática de leads dos portais de anúncios com o funil do CRM.', category: 'Gestão', weight: 5 },
  { id: 'propostas_sistema', label: 'Emissão e registro formal de propostas comerciais de venda geradas pelo sistema.', category: 'Gestão', weight: 3 },
  { id: 'satisfacao_posvenda', label: 'Disparo de pesquisa de satisfação após fechamento de venda ou arquivamento de lead.', category: 'Gestão', weight: 2 },
];

const TOTAL_WEIGHT = PLAYBOOK_ITEMS.reduce((sum, item) => sum + item.weight, 0);

export default function DiagnosticsPage() {
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const navigate = useNavigate();

  // Carregar dados salvos no localStorage ao montar o componente
  useEffect(() => {
    try {
      const saved = localStorage.getItem('otimizza_ficha_diagnostico');
      if (saved) {
        setAnswers(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Erro ao ler do localStorage:', error);
    }
  }, []);

  // Salvar dados no localStorage a cada alteração de resposta
  const handleToggle = (id: string) => {
    setAnswers(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem('otimizza_ficha_diagnostico', JSON.stringify(updated));
      } catch (error) {
        console.error('Erro ao salvar no localStorage:', error);
      }
      return updated;
    });
  };

  const handleReset = () => {
    if (window.confirm('Tem certeza de que deseja limpar todas as respostas digitadas?')) {
      setAnswers({});
      try {
        localStorage.removeItem('otimizza_ficha_diagnostico');
      } catch (error) {
        console.error('Erro ao limpar localStorage:', error);
      }
    }
  };

  // Calcular score ponderado em tempo real
  const currentWeight = PLAYBOOK_ITEMS.reduce((sum, item) => {
    return sum + (answers[item.id] ? item.weight : 0);
  }, 0);

  const percentage = Math.round((currentWeight / TOTAL_WEIGHT) * 100);

  // Determinar cor do semáforo
  let semaphoreColor = 'bg-rose-500 border-rose-400 text-white';
  let semaphoreLabel = 'Crítica / Deficiente';
  let semaphoreDesc = 'Sua estrutura de processos e atendimento de leads comercial está crítica. Perda massiva de vendas.';

  if (percentage >= 80) {
    semaphoreColor = 'bg-emerald-500 border-emerald-400 text-white shadow-emerald-500/20';
    semaphoreLabel = 'Excelente / Aprovada';
    semaphoreDesc = 'Sua estrutura está perfeitamente alinhada com as melhores práticas de aceleração de vendas.';
  } else if (percentage >= 50) {
    semaphoreColor = 'bg-amber-500 border-amber-400 text-slate-900 shadow-amber-500/20';
    semaphoreLabel = 'Regular / Atenção';
    semaphoreDesc = 'Processos comerciais funcionam de forma razoável, mas existem gargalos severos de conversão de leads.';
  }

  // Compartilhamento via WhatsApp sem atrasos
  const handleShareWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const pendencias = PLAYBOOK_ITEMS.filter(item => !answers[item.id]);
    const pontosAtendidos = PLAYBOOK_ITEMS.filter(item => answers[item.id]);

    let message = `*🔍 DIAGNÓSTICO DE ESTRUTURA COMERCIAL*\n`;
    message += `*Score Geral:* ${percentage}% (${semaphoreLabel})\n`;
    message += `------------------------------------\n\n`;
    message += `*Resumo da Auditoria:*\n${semaphoreDesc}\n\n`;

    if (pontosAtendidos.length > 0) {
      message += `*✓ Pontos Fortes (${pontosAtendidos.length}/${PLAYBOOK_ITEMS.length}):*\n`;
      pontosAtendidos.slice(0, 5).forEach((item, idx) => {
        message += `${idx + 1}. ${item.label} (Peso ${item.weight})\n`;
      });
      if (pontosAtendidos.length > 5) {
        message += `... e outros ${pontosAtendidos.length - 5} processos ativos.\n`;
      }
      message += `\n`;
    }

    if (pendencias.length > 0) {
      message += `*⚠️ Gargalos Comerciais Identificados:*\n`;
      // Ordena por peso decrescente para priorizar os piores gargalos
      pendencias.sort((a, b) => b.weight - a.weight).slice(0, 5).forEach((item, idx) => {
        message += `${idx + 1}. [ ] ${item.label} (Peso ${item.weight})\n`;
      });
      if (pendencias.length > 5) {
        message += `... e outras ${pendencias.length - 5} oportunidades de melhoria.\n`;
      }
      message += `\n`;
    }

    message += `*Quer estruturar seu time de vendas e gerenciar estoque?*\n`;
    message += `Conheça a plataforma: ${window.location.origin}/nova-conta`;

    const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const handleGoToLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/login');
  };

  const categories = ['todos', 'Atendimento', 'Processo', 'Engajamento', 'Gestão'];

  const filteredItems = activeCategory === 'todos'
    ? PLAYBOOK_ITEMS
    : PLAYBOOK_ITEMS.filter(i => i.category === activeCategory);

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 animate-fadeUp pb-28 lg:pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Ficha de Diagnóstico</h1>
          <p className="text-muted-foreground font-semibold text-sm mt-1">
            Audite a estrutura e o processo comercial da concessionária em campo.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGoToLogin}
            className="inline-flex items-center gap-2 px-4 py-2 border border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-bold uppercase rounded-xl transition-all shadow-sm cursor-pointer"
          >
            Sou Cliente
          </button>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 border border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-bold uppercase rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Trash2 size={14} /> Limpar
          </button>
        </div>
      </header>

      {/* Semaphore KPI Widget */}
      <div className="bg-card text-foreground rounded-3xl border border-border/80 p-6 md:p-8 shadow-xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Sparkles size={160} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase border tracking-wider flex items-center gap-1.5 shadow ${semaphoreColor}`}>
                <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                {semaphoreLabel}
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight mt-1">Pontuação: {percentage}%</h2>
            <p className="text-muted-foreground text-sm font-semibold leading-relaxed">
              {semaphoreDesc}
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={handleShareWhatsApp}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-extrabold uppercase transition-all shadow-md shadow-green-600/20 cursor-pointer"
              >
                <MessageCircle size={16} /> Compartilhar Diagnóstico
              </button>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-center justify-center bg-muted/60 backdrop-blur border border-border/80 w-32 h-32 rounded-3xl relative">
            <span className="text-4xl font-black">{percentage}%</span>
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Score Geral</span>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex border-b border-border/80 gap-6 overflow-x-auto hide-scrollbar pb-1 mb-6">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`pb-4 text-xs font-bold uppercase tracking-wider transition-all border-b-4 whitespace-nowrap cursor-pointer ${
              activeCategory === cat
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat === 'todos' ? '📋 Todos os itens' : cat}
          </button>
        ))}
      </div>

      {/* Checklist List */}
      <div className="space-y-4">
        {filteredItems.map((item, index) => {
          const isChecked = !!answers[item.id];
          return (
            <div
              key={item.id}
              onClick={() => handleToggle(item.id)}
              className={`bg-card rounded-2xl border p-5 transition-all duration-200 cursor-pointer flex items-start gap-4 hover:shadow-md hover:border-primary/50 relative overflow-hidden group ${
                isChecked
                  ? 'border-primary/40 bg-primary/5 shadow-sm'
                  : 'border-border/80'
              }`}
            >
              {/* Check Circle */}
              <div className={`shrink-0 w-6 h-6 rounded-xl flex items-center justify-center border transition-all mt-0.5 ${
                isChecked
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border/90 bg-muted/20 group-hover:border-primary'
              }`}>
                {isChecked && <Check size={14} strokeWidth={3} />}
              </div>

              {/* Text Area */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground bg-muted border border-border/80 px-2 py-0.5 rounded-md">
                    {item.category}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-primary">
                    Peso: {item.weight}
                  </span>
                </div>
                <p className={`text-sm font-semibold leading-relaxed ${
                  isChecked ? 'text-foreground font-bold' : 'text-foreground/80'
                }`}>
                  {index + 1}. {item.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
