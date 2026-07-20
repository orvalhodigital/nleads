import React from 'react';
import { FileText, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LegalTermsPage: React.FC = () => {
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
            <FileText size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">Portal Legal</span>
          </div>
        </div>

        {/* Title */}
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
            TERMOS DE USO
          </h1>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Condições Gerais de Uso da Plataforma Gestor de Pátio
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground font-medium">
          
          <section className="space-y-3">
            <h2 className="text-lg font-black text-foreground uppercase tracking-tight">
              1. Aceitação dos Termos
            </h2>
            <p>
              Ao criar uma conta ou utilizar o <strong>Gestor de Pátio</strong> ("Sistema"), você ("Cliente" ou "Usuário") concorda integralmente com estes Termos de Uso e com a nossa Política de Privacidade. Caso não concorde com alguma disposição, você não deve efetuar o cadastro ou fazer uso do Sistema.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-foreground uppercase tracking-tight">
              2. Descrição do Serviço
            </h2>
            <p>
              O Sistema é uma plataforma SaaS (Software as a Service) voltada para o mercado de revendas de veículos, oferecendo soluções integradas para gestão de estoque, funil de vendas (Kanban), agenda de contatos, lembretes de visitas, disparador inteligente de WhatsApp, dashboard de metas e criação de website público de vendas.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-foreground uppercase tracking-tight">
              3. Cadastro e Segurança da Conta
            </h2>
            <p>
              O Cliente compromete-se a fornecer informações verídicas, completas e atualizadas no cadastro da sua conta "Empresa" ou de seus "Vendedores".
            </p>
            <p>
              Você é o único responsável pela guarda e sigilo de suas credenciais de acesso (e-mail e senha). Qualquer uso indevido resultante da perda de controle dessas credenciais será de inteira responsabilidade do Cliente.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-foreground uppercase tracking-tight">
              4. Planos, Cobrança e Assinatura Recorrente
            </h2>
            <p>
              O acesso completo a todas as funcionalidades premium do Sistema exige a contratação de um plano pago, cujos preços e termos de ciclo mensal são detalhados na área de Planos do Sistema.
            </p>
            <p>
              As cobranças são processadas sob a modalidade de assinatura recorrente mensal via processador de pagamentos independente <strong>Asaas</strong>.
            </p>
            <p>
              O atraso ou inadimplência nos pagamentos mensais resultará na suspensão ou limitação imediata do acesso do Cliente e de seus vendedores às funcionalidades exclusivas do plano pago, aplicando as travas e limites vigentes do plano gratuito (Free) de forma automática.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-foreground uppercase tracking-tight">
              5. Proteção de Dados e Responsabilidade sob os Leads
            </h2>
            <p>
              O Cliente é o único responsável por garantir que possui base legal legítima (conforme a Lei Geral de Proteção de Dados - LGPD) para coletar, tratar e inserir no Sistema os dados de seus leads e clientes finais (nome, e-mail, telefone, CPF, etc.), isentando a Orvalho Digital de qualquer responsabilidade decorrente do uso inadequado de tais informações.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-foreground uppercase tracking-tight">
              6. Regras de Uso Aceitável
            </h2>
            <p>
              É expressamente vedado ao Cliente:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Utilizar a Plataforma para envio de mensagens automatizadas não solicitadas (spam) ou práticas abusivas contrárias às políticas do WhatsApp.</li>
              <li>Tentar violar a segurança, invadir contas de outros usuários ou fazer engenharia reversa do código-fonte do Sistema.</li>
              <li>Utilizar a Plataforma para fins ilícitos, nocivos ou fraudulentos.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-foreground uppercase tracking-tight">
              7. Propriedade Intelectual e Direitos Autorais
            </h2>
            <p>
              Todos os direitos intelectuais sobre o software, marca Gestor de Pátio, layout do site, banco de dados estruturado e marca pertencem única e exclusivamente à Orvalho Digital. O Cliente retém a propriedade integral dos dados cadastrados de seus leads e estoque.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-foreground uppercase tracking-tight">
              8. Rescisão
            </h2>
            <p>
              O Cliente pode solicitar o cancelamento de sua assinatura recorrente a qualquer momento direto pelo painel financeiro de planos do Sistema. A Orvalho Digital reserva-se o direito de rescindir o contrato imediatamente em caso de descumprimento grave de qualquer cláusula de uso aceitável destes termos.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-foreground uppercase tracking-tight">
              9. Canal de Suporte e Contato
            </h2>
            <p>
              Para esclarecer dúvidas ou relatar problemas de uso dos nossos termos, utilize nosso canal de suporte interno ou envie um e-mail para: <strong>suporte@orvalhodigital.com.br</strong>.
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

export default LegalTermsPage;
