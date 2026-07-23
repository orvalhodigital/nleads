import React, { useState, useEffect } from 'react';
import { X, Send, Tag, Sparkles } from 'lucide-react';
import { Lead } from '../../types';
import { leadCommunicationService } from '../../services/leadCommunicationService';

interface LeadInterestModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: { id: string; brand: string; model: string; year: number; price: number } | null;
  targetLeads: Lead[];
  userEmail?: string;
  onSendComplete?: () => void;
  initialTemplate?: string;
}

const DEFAULT_TAGS = ['{{nome}}', '{{marca}}', '{{modelo}}', '{{ano}}', '{{valor}}'];

export const LeadInterestModal: React.FC<LeadInterestModalProps> = ({
  isOpen,
  onClose,
  item,
  targetLeads,
  userEmail,
  onSendComplete,
  initialTemplate,
}) => {
  const [template, setTemplate] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isOpen && item) {
      const defaultText =
        initialTemplate ||
        `Olá {{nome}}, chegou em nosso estoque essa opção: {{marca}} {{modelo}} {{ano}} por R$ {{valor}}. Quer mais detalhes sobre ela?`;
      setTemplate(defaultText);
      setIsSending(false);
    }
  }, [isOpen, item, initialTemplate]);

  if (!isOpen || !item || targetLeads.length === 0) return null;

  const handleTagClick = (tag: string) => {
    setTemplate((prev) => prev + ' ' + tag);
  };

  const handleSend = async () => {
    if (!item) return;

    setIsSending(true);
    let successCount = 0;

    try {
      for (const lead of targetLeads) {
        // Interpolação das variáveis na mensagem
        const messageBody = template
          .replace(/{{nome}}/g, lead.name)
          .replace(/{{marca}}/g, item.brand)
          .replace(/{{modelo}}/g, item.model)
          .replace(/{{ano}}/g, String(item.year))
          .replace(/{{valor}}/g, item.price.toLocaleString('pt-BR'));

        // 1. Grava no banco de dados via leadCommunicationService
        let insertedData: { id: string };
        try {
          insertedData = await leadCommunicationService.create({
            lead_id: lead.id,
            vehicle_id: item.id,
            contact_name: lead.name,
            contact_phone: lead.phone,
            message_body: messageBody,
            is_sent: 'não',
            email_user: userEmail,
          });
        } catch (insertError) {
          console.error('Erro ao inserir comunicação:', insertError);
          continue;
        }

        // 2. Dispara webhook para o n8n com o id retornado
        try {
          await fetch('https://webhook.orvalhodigital.com.br/webhook/puxa-mensagem', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message_id: insertedData?.id,
              lead_id: lead.id,
              name: lead.name,
              phone: lead.phone,
              message: messageBody,
              user_email: userEmail,
              vehicle: {
                id: item.id,
                brand: item.brand,
                model: item.model,
              },
            }),
          });
        } catch (webhookError) {
          console.error('Erro ao acionar webhook n8n (não bloqueante):', webhookError);
        }

        successCount++;
      }

      if (onSendComplete) {
        await onSendComplete();
      }

      alert(`Mensagem registrada e enviada para ${successCount} lead(s)!`);
      onClose();
    } catch (err) {
      console.error('Erro ao enviar mensagens:', err);
      alert('Ocorreu um erro ao processar o envio das mensagens.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-card text-card-foreground border border-border rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-fadeUp my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
          <div>
            <h2 className="text-lg font-heading font-bold uppercase tracking-tight text-foreground flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              Enviar Recomendação
            </h2>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mt-0.5">
              Para:{' '}
              {targetLeads.length > 1
                ? `${targetLeads.length} leads selecionados`
                : targetLeads[0]?.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <Tag size={13} />
              Texto da Mensagem
            </label>
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full h-36 p-4 bg-background border border-input rounded-2xl outline-none focus:ring-2 focus:ring-primary text-foreground text-sm font-medium resize-none leading-relaxed"
              placeholder="Digite a mensagem..."
            />
          </div>

          {/* Quick Tag Insertion */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Inserir variáveis rápidas:
            </p>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagClick(tag)}
                  className="px-3 py-1.5 bg-muted text-muted-foreground rounded-lg text-xs font-semibold hover:bg-primary/10 hover:text-primary transition-colors border border-border"
                >
                  {tag}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              * As variáveis acima serão substituídas automaticamente para cada destinatário.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-muted/30 border-t border-border flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            className="w-full sm:w-auto px-6 py-3.5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending || targetLeads.length === 0}
            className="w-full sm:w-auto px-6 py-3.5 bg-primary text-primary-foreground rounded-2xl text-[11px] font-extrabold uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send size={15} />
            {isSending ? 'Enviando...' : 'Confirmar e Enviar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadInterestModal;
