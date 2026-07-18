import React from 'react';
import { Briefcase, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LegalContractPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8 animate-fadeUp">
      <div className="max-w-4xl mx-auto bg-card border border-border/80 p-8 sm:p-12 rounded-[2rem] shadow-xl relative overflow-hidden">
        
        {/* Background Decorative Blur */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
        
        {/* Header */}
        <div className="flex items-center justify-between mb-10 pb-6 border-b border-border/80">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            Voltar
          </button>
          
          <div className="flex items-center gap-2 text-primary">
            <Briefcase size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">Portal Legal</span>
          </div>
        </div>

        {/* Title */}
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
            CONTRATO DE PRESTAÇÃO DE SERVIÇOS SAAS
          </h1>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Licenciamento de Uso da Plataforma nLeads CRM / Otimizza
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground font-medium">
          
          <section className="space-y-3">
            <p>
              Pelo presente instrumento particular, a <strong>Orvalho Digital Tecnologia Ltda</strong>, operadora da plataforma SaaS ("Contratada") e o <strong>Lojista/Revendedor de Veículos</strong> cadastrado na plataforma ("Contratante"), resolvem celebrar o presente Contrato de Prestação de Serviços de Software como Serviço (SaaS) mediante as cláusulas seguintes:
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-foreground uppercase tracking-tight">
              Cláusula 1ª — Objeto
            </h2>
            <p>
              O presente Contrato tem por objeto a licença de uso, não exclusiva e intransferível, do software em nuvem <strong>nLeads CRM / Otimizza</strong>, para gestão de leads, estoque de veículos, processo comercial e pós-venda da operação do Contratante, conforme funcionalidades do plano contratado pelo lojista.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-foreground uppercase tracking-tight">
              Cláusula 2ª — Prazo e Vigência
            </h2>
            <p>
              Este contrato é por prazo indeterminado, iniciando-se na data do aceite eletrônico e validação do cadastro do Contratante, renovando-se automaticamente no ciclo de faturamento a cada 30 dias, salvo manifestação em contrário pelo cancelamento eletrônico direto no painel da Plataforma.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-foreground uppercase tracking-tight">
              Cláusula 3ª — Valores e Forma de Pagamento
            </h2>
            <p>
              Pela licença de uso, o Contratante pagará à Contratada o valor mensal estipulado no plano contratado, processado sob modalidade de assinatura recorrente por meio da plataforma de pagamento integrada <strong>Asaas</strong>.
            </p>
            <p>
              O atraso ou inadimplência nos pagamentos mensais resultará na suspensão imediata e automatizada dos serviços e limites exclusivos do plano pago.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-foreground uppercase tracking-tight">
              Cláusula 4ª — Obrigações da Contratada
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Disponibilizar o Sistema em ambiente em nuvem estável e performático.</li>
              <li>Prestar suporte técnico operacional aos usuários da Plataforma pelos canais internos de atendimento.</li>
              <li>Garantir o sigilo e segurança lógica dos dados do estoque e leads do Contratante.</li>
              <li>Atuar estritamente na qualidade de Operadora de dados pessoais dos leads da loja, seguindo as diretrizes de tratamento fornecidas pelo lojista.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-foreground uppercase tracking-tight">
              Cláusula 5ª — Obrigações do Contratante
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Efetuar os pagamentos de assinatura recorrente dentro das datas de vencimento acordadas.</li>
              <li>Zelar pelas credenciais de acesso de sua equipe e vendedores.</li>
              <li>Garantir e declarar que possui base legal legítima (consentimento, contrato, etc.) nos termos da LGPD para tratar e armazenar os dados de leads na plataforma, isentando a Contratada de qualquer litígio de privacidade.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-foreground uppercase tracking-tight">
              Cláusula 6ª — Proteção de Dados (LGPD)
            </h2>
            <p>
              As partes reconhecem que a Contratada atua como Operadora e o Contratante atua como Controlador de dados pessoais de leads inseridos na plataforma. A Contratada compromete-se a não utilizar os dados dos leads para finalidade diversa da execução do objeto contratual, adotando práticas de segurança razoáveis e notificando o Contratante em caso de qualquer incidente de segurança.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-foreground uppercase tracking-tight">
              Cláusula 7ª — Propriedade Intelectual
            </h2>
            <p>
              Todos os elementos de software, design, algoritmos e marcas da plataforma são de titularidade exclusiva da Contratada. A licença de uso temporária não transfere quaisquer direitos intelectuais de desenvolvimento ao lojista. Os dados e estoque do lojista pertencem ao lojista.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-foreground uppercase tracking-tight">
              Cláusula 8ª — Limitação de Responsabilidade
            </h2>
            <p>
              A Contratada exime-se de qualquer responsabilidade por lucros cessantes, perdas financeiras indiretas decorrentes de falhas em integrações externas (serviços do WhatsApp Meta, bancos parceiros ou interrupções de hospedagem cloud). Em qualquer cenário, a responsabilidade civil da Contratada fica limitada ao valor total correspondente às 3 últimas mensalidades pagas pelo lojista.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-foreground uppercase tracking-tight">
              Cláusula 9ª — Lei Aplicável e Foro
            </h2>
            <p>
              Este instrumento é regido sob a legislação da República Federativa do Brasil, elegendo-se o foro da comarca da sede da Contratada para resolução de controvérsias comerciais.
            </p>
          </section>

        </div>
        
        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground font-semibold">
          <span>© {new Date().getFullYear()} Orvalho Digital. Todos os direitos reservados.</span>
          <span className="text-[10px] uppercase tracking-wider">Última atualização: 17/07/2026</span>
        </div>

      </div>
    </div>
  );
};

export default LegalContractPage;
