import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary do painel admin.
 * Em vez de uma "tela branca" silenciosa quando uma página quebra,
 * exibe a mensagem real do erro para facilitar o diagnóstico.
 */
export default class AdminErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('AdminErrorBoundary capturou um erro:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-2xl mx-auto mt-10 bg-white rounded-2xl border border-red-200 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Ocorreu um erro nesta tela</h2>
              <p className="text-slate-500 text-sm">O restante do painel continua funcionando normalmente.</p>
            </div>
          </div>

          <pre className="bg-slate-900 text-red-300 text-xs rounded-xl p-4 overflow-auto max-h-60 whitespace-pre-wrap">
            {this.state.error?.message || 'Erro desconhecido'}
            {this.state.error?.stack ? `\n\n${this.state.error.stack}` : ''}
          </pre>

          <div className="flex gap-3 mt-6">
            <button
              onClick={this.handleReset}
              className="px-5 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-black transition-colors"
            >
              <RotateCcw size={16} /> Tentar novamente
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
            >
              Recarregar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
