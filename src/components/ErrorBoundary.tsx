import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  /** Muda de valor (ex.: pathname) para resetar o boundary ao navegar. */
  resetKey?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary do app do usuário (theme-aware, tokens Dia/Noite).
 * Evita a "tela branca" quando uma página quebra: mostra a mensagem e permite
 * tentar de novo / recarregar sem perder o resto da navegação.
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary capturou um erro:', error, info);
  }

  componentDidUpdate(prevProps: Props) {
    // Ao navegar para outra rota, limpa o erro para tentar renderizar a nova tela.
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-2xl mx-auto mt-10 bg-card rounded-3xl border border-destructive/30 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-destructive/10 text-destructive rounded-2xl">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h2 className="text-xl font-heading font-bold text-foreground tracking-tight">Ops, algo deu errado nesta tela</h2>
              <p className="text-muted-foreground text-sm mt-0.5">Você pode tentar de novo ou recarregar — seus dados estão salvos.</p>
            </div>
          </div>

          <pre className="bg-muted text-destructive text-xs rounded-2xl p-4 overflow-auto max-h-60 whitespace-pre-wrap border border-border/60">
            {this.state.error?.message || 'Erro desconhecido'}
          </pre>

          <div className="flex gap-3 mt-6">
            <button
              onClick={this.handleReset}
              className="px-5 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors"
            >
              <RotateCcw size={16} /> Tentar novamente
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-3 border border-border text-muted-foreground rounded-xl font-bold text-sm hover:bg-muted transition-colors"
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
