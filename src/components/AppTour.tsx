import React, { useState, useEffect } from 'react';
import { Joyride, Step, EventData, STATUS } from 'react-joyride';
import { useAuthContext } from '../contexts/AuthContext';
import { readMigrated } from '../lib/storage';

const AppTour: React.FC = () => {
  const { profile } = useAuthContext();
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Run the tour if onboarding is completed but the tour hasn't been shown yet.
    if (profile?.onboarding_completed) {
      const hasSeenTour = readMigrated('orvalho_tour_completed', 'otimizza_tour_completed');
      if (!hasSeenTour) {
        localStorage.setItem('orvalho_tour_completed', 'true');
        setTimeout(() => setRun(true), 1500);
      }
    }
  }, [profile?.onboarding_completed]);

  const steps: Step[] = [
    {
      target: 'body',
      placement: 'center',
      title: 'Bem-vindo ao Gestor de Pátio! 🎉',
      content: 'Agora que seu painel está configurado, preparamos um guia passo a passo para te mostrar onde fica cada coisa. Vamos lá?',
      skipBeacon: true,
    },
    {
      target: 'a[href="/dashboard"]',
      title: 'Métricas e Visão Geral',
      content: 'Aqui você acompanha o desempenho da sua concessionária, leads recebidos e veículos mais visualizados.',
    },
    {
      target: 'a[href="/inventory"]',
      title: 'Seu Estoque de Veículos',
      content: 'É aqui que você adiciona o seu "Primeiro Veículo", gerencia preços e fotos do seu estoque ativo.',
    },
    {
      target: 'a[href="/leads"]',
      title: 'Gestão de Leads',
      content: 'Todas as suas oportunidades de venda caem aqui. Você pode gerenciar seu "Primeiro Lead", conversar com clientes e agendar visitas.',
    },
    {
      target: 'a[href="/sales-flow"]',
      title: 'Funil de Vendas',
      content: 'Acompanhe visualmente cada etapa da negociação até o fechamento da venda.',
    },
    {
      target: 'a[href="/settings"]',
      title: 'Configurações',
      content: 'Precisa mudar o nome da loja, conectar novas integrações ou editar o perfil? É só vir nas configurações.',
    }
  ];

  const handleJoyrideEvent = (data: EventData) => {
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finishedStatuses.includes(data.status)) {
      setRun(false);
      localStorage.setItem('orvalho_tour_completed', 'true');
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous={true}
      onEvent={handleJoyrideEvent}
      options={{
        primaryColor: '#5B46E5', // --primary da Orvalho
        zIndex: 10000,
        showProgress: true,
        buttons: ['back', 'skip', 'primary'],
      }}
      styles={{
        buttonPrimary: {
          backgroundColor: '#5B46E5',
          borderRadius: '8px',
          padding: '8px 16px',
        },
        buttonBack: {
          color: '#64748b',
          marginRight: '8px',
        },
        buttonSkip: {
          color: '#64748b',
        }
      }}
      locale={{
        back: 'Anterior',
        close: 'Fechar',
        last: 'Pronto!',
        next: 'Próximo',
        skip: 'Pular',
      }}
    />
  );
};

export default AppTour;
