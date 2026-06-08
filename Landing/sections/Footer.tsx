import React from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import { useSystemSettings } from '../../../hooks/useSystemSettings';

const Footer: React.FC = () => {
  const { logoUrl } = useSystemSettings();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div>
            <div className="mb-4">
              {logoUrl ? (
                <img src={logoUrl} alt="Otimizza" className="h-8 w-auto" />
              ) : (
                <div className="text-xl font-black text-white">Otimizza</div>
              )}
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              A plataforma #1 em gestão de vendas de veículos. Organiza leads, estoque e vendas.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-bold text-white mb-4">Produto</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Funcionalidades</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Preços</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Segurança</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Status</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold text-white mb-4">Empresa</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Sobre</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Carreiras</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Contato</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-white mb-4">Contato</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail size={16} />
                <a href="mailto:contato@otimizza.com.br" className="hover:text-emerald-400 transition-colors">
                  contato@otimizza.com.br
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} />
                <a href="tel:+551133334444" className="hover:text-emerald-400 transition-colors">
                  (11) 3333-4444
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                <span>São Paulo, SP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700 mb-8" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between text-xs text-slate-400">
          <div>
            © {currentYear} Otimizza. Todos os direitos reservados.
          </div>
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-emerald-400 transition-colors">
              Política de Privacidade
            </a>
            <a href="#" className="hover:text-emerald-400 transition-colors">
              Termos de Serviço
            </a>
            <a href="#" className="hover:text-emerald-400 transition-colors">
              LGPD
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
