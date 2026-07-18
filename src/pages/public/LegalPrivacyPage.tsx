import React from 'react';
import { Shield, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LegalPrivacyPage: React.FC = () => {
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
            <Shield size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">Portal Legal</span>
          </div>
        </div>

        {/* Title */}
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
            POLÍTICA DE PRIVACIDADE
          </h1>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Adequação à Lei Geral de Proteção de Dados (Lei nº 13.709/2018)
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground font-medium">
          
          <section className="space-y-3">
            <h2 className="text-lg font-black text-foreground uppercase tracking-tight">
              1. Quem Somos
            </h2>
            <p>
              Esta Política de Privacidade descreve como a <strong>Orvalho Digital Tecnologia Ltda</strong> ("Orvalho Digital", "nós"), operadora da plataforma SaaS de gestão de leads e vendas de veículos ("nLeads CRM" ou "Sistema"), coleta, usa, armazena e protege dados pessoais coletados no âmbito da prestação dos seus serviços.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-foreground uppercase tracking-tight">
              2. Dois Grupos de Titulares de Dados
            </h2>
            <p>
              Esta Política trata de dois grupos distintos de titulares de dados pessoais, com papéis jurídicos diferentes nos termos da LGPD:
            </p>
            <div className="pl-4 border-l-2 border-primary/25 space-y-4">
              <p>
                <strong>2.1. Usuários da Plataforma (lojistas e vendedores):</strong> São as pessoas físicas ou jurídicas que contratam e utilizam o Sistema para gerenciar sua própria operação de vendas de veículos ("Cliente" ou "Usuário"). Em relação aos dados desses Usuários (cadastro, acesso, faturamento), a Orvalho Digital atua como <strong>Controladora dos Dados</strong>, nos termos do art. 5º, VI, da LGPD.
              </p>
              <p>
                <strong>2.2. Leads e Clientes Finais do Cliente:</strong> São os consumidores finais interessados em comprar um veículo cujos dados (nome, telefone, e-mail, preferências, etc.) são inseridos no Sistema pelo Cliente (a revenda/lojista), coletados via WhatsApp, formulários do site ou cadastro manual. Em relação a esses dados, o Cliente (a revenda) é o <strong>Controlador</strong> e a Orvalho Digital atua como <strong>Operadora</strong> (art. 5º, VII, da LGPD), processando os dados exclusivamente conforme as instruções e em benefício do Cliente.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-foreground uppercase tracking-tight">
              3. Dados Pessoais Coletados
            </h2>
            <p>
              Coletamos diferentes categorias de dados dependendo da interação com a Plataforma:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Dados de cadastro de Usuários:</strong> Nome completo, e-mail, telefone, senha criptografada, nome da empresa/loja, logotipo e metas comerciais informadas voluntariamente.</li>
              <li><strong>Dados de leads e clientes finais inseridos pelo Cliente:</strong> Nome, telefone, e-mail, preferências de compra, dados de veículo usado para troca (placa, marca, ano, quilometragem) e dados de simulações de financiamento.</li>
              <li><strong>Dados de pagamento:</strong> Os pagamentos das assinaturas são processados de forma segura pelo intermediador financeiro <strong>Asaas</strong>. Não armazenamos números de cartões de crédito em nossos servidores.</li>
              <li><strong>Dados técnicos:</strong> Endereço IP, tokens de sessão (armazenados localmente para login) e logs técnicos para segurança e diagnóstico.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-foreground uppercase tracking-tight">
              4. Finalidades do Tratamento e Bases Legais
            </h2>
            <p>
              Tratamos dados pessoais estritamente para fins legítimos e amparados pelas bases legais da LGPD:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Viabilizar o cadastro e uso do Sistema:</strong> Execução de contrato (Art. 7º, V da LGPD).</li>
              <li><strong>Cobrança de assinaturas:</strong> Execução de contrato (Art. 7º, V da LGPD).</li>
              <li><strong>Gestão de leads e clientes finais:</strong> Execução de contrato ou procedimentos preliminares a pedido do titular de dados (processado na qualidade de Operadora por instrução do Cliente).</li>
              <li><strong>Segurança e prevenção a fraudes:</strong> Legítimo interesse (Art. 7º, IX da LGPD).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-foreground uppercase tracking-tight">
              5. Compartilhamento de Dados com Terceiros
            </h2>
            <p>
              Para viabilizar a prestação de serviços da plataforma SaaS, compartilhamos dados com os seguintes prestadores de infraestrutura e serviços:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Supabase Inc.</strong> — Banco de dados e armazenamento de arquivos em nuvem.</li>
              <li><strong>Vercel Inc.</strong> — Hospedagem e deploy da aplicação.</li>
              <li><strong>Asaas Gestão Financeira S.A.</strong> — Processamento de cobranças e assinaturas.</li>
              <li><strong>OpenAI L.L.C. / Google LLC</strong> — Processamento inteligente de descrições e correspondências de leads (OpenRouter API).</li>
            </ul>
            <p>Não comercializamos ou compartilhamos dados pessoais com terceiros para fins publicitários externos.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-foreground uppercase tracking-tight">
              6. Retenção e Eliminação de Dados
            </h2>
            <p>
              Os dados pessoais são armazenados enquanto o contrato estiver ativo ou pelo período necessário para cumprimento de obrigações legais, regulatórias ou para exercício regular de direitos em juízo. Após a rescisão ou encerramento da conta, os dados são devidamente eliminados ou anonimizados.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-foreground uppercase tracking-tight">
              7. Direitos do Titular dos Dados
            </h2>
            <p>
              O titular dos dados pessoais possui, conforme o artigo 18 da LGPD, os direitos de: confirmação do tratamento, acesso aos dados, correção de dados incompletos ou inexatos, eliminação de dados desnecessários ou excessivos e revogação de consentimento anteriormente fornecido.
            </p>
            <p>
              <em>Aviso Importante:</em> Leads e clientes finais de uma revenda que desejarem exercer seus direitos sob a LGPD devem contatar diretamente a respectiva revenda de veículos (Controladora dos dados). A Orvalho Digital atuará como Operadora dando suporte para efetivação do direito quando acionada pela revenda.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-black text-foreground uppercase tracking-tight">
              8. Canal de Contato
            </h2>
            <p>
              Para dúvidas sobre esta política ou para exercer os seus direitos de privacidade, entre em contato pelo e-mail do Encarregado de Dados (DPO): <strong>dpo@orvalhodigital.com.br</strong>.
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

export default LegalPrivacyPage;
