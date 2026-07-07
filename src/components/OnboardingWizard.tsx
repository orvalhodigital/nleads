import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useData } from '../contexts/DataContext';
import { Profile, Lead, Vehicle } from '../types';
import { profileService } from '../services/profileService';
import confetti from 'canvas-confetti';
import { ArrowRight, ArrowLeft, Check, Bike, Car, MessageCircle, Image as ImageIcon, Plus, Phone, Mail } from 'lucide-react';

interface OnboardingWizardProps {
  onComplete: () => void;
}

type Step = 'welcome' | 'company' | 'vehicles' | 'whatsapp' | 'complete';

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const { profile, user, refreshProfile } = useData();
  const [step, setStep] = useState<Step>('welcome');
  const [progress, setProgress] = useState(0);

  // Company step
  const [companyName, setCompanyName] = useState(profile?.company_name || user?.user_metadata?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState(profile?.company_logo || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || profile?.avatar_url || '');

  // Vehicles step
  const [enableCars, setEnableCars] = useState(profile?.enable_cars !== false);
  const [enableMotos, setEnableMotos] = useState(profile?.enable_motorcycles || false);

  // WhatsApp step
  const [whatsappStatus, setWhatsappStatus] = useState<'checking' | 'connected' | 'disconnected' | 'error'>('disconnected');



  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const vehicleImagesRef = useRef<HTMLInputElement>(null);

  const stepOrder: Step[] = ['welcome', 'company', 'vehicles', 'whatsapp', 'complete'];
  const currentStepIndex = stepOrder.indexOf(step);

  useEffect(() => {
    const completedSteps = calculateCompletedSteps();
    setProgress(completedSteps);
  }, [profile]);

  const calculateCompletedSteps = (): number => {
    let count = 0;
    if (profile?.company_logo) count++;
    if (profile?.avatar_url) count++;
    if (profile?.whatsapp_webhook_url) count++;
    if (profile?.enable_cars || profile?.enable_motorcycles) count++;
    // Would need to check actual vehicle/lead count from context
    return count;
  };

  const handleSkip = async () => {
    if (step === 'complete') {
      await completeOnboarding();
    } else {
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < stepOrder.length) {
        setStep(stepOrder[nextIndex]);
      }
    }
  };

  const uploadFile = async (file: File, bucket: string): Promise<string> => {
    const fileName = `${Date.now()}-${file.name}`;
    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleCompanyStep = async () => {
    setLoading(true);
    setError('');
    try {
      const updates: Partial<Profile> = { company_name: companyName, phone };

      if (logoFile) {
        const logoUrl = await uploadFile(logoFile, 'avatars');
        updates.company_logo = logoUrl;
      }

      if (avatarFile) {
        const avatarUrl = await uploadFile(avatarFile, 'avatars');
        updates.avatar_url = avatarUrl;
      }

      await profileService.updateProfile(updates);
      await refreshProfile();

      const nextIndex = currentStepIndex + 1;
      if (nextIndex < stepOrder.length) {
        setStep(stepOrder[nextIndex]);
      }
    } catch (err) {
      setError('Erro ao salvar dados da empresa');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVehiclesStep = async () => {
    if (!enableCars && !enableMotos) {
      setError('Selecione pelo menos um tipo de veículo');
      return;
    }

    setLoading(true);
    try {
      await supabase.auth.updateUser({
        data: {
          enable_cars: enableCars,
          enable_motorcycles: enableMotos,
        },
      });
      await refreshProfile();

      const nextIndex = currentStepIndex + 1;
      if (nextIndex < stepOrder.length) {
        setStep(stepOrder[nextIndex]);
      }
    } catch (err) {
      setError('Erro ao salvar configuração de veículos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  const completeOnboarding = async () => {
    setLoading(true);
    try {
      await profileService.updateProfile({ onboarding_completed: true });
      await refreshProfile();
      onComplete();
    } catch (err: any) {
      setError(err?.message || 'Erro ao completar onboarding');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fireConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return (
          <div className="text-center space-y-6 sm:space-y-8 animate-fadeUp">
            <div className="text-5xl sm:text-6xl">🚀</div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
              Olá, {profile?.full_name || 'bem-vindo'}!
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 max-w-md mx-auto">
              Seu painel está quase pronto. Vamos configurar as informações essenciais em 5 passos.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-8">
              <button
                onClick={() => setStep('company')}
                className="flex-1 py-3.5 sm:py-4 bg-[#57a89a] text-white rounded-2xl font-bold hover:bg-[#45857a] transition-all shadow-lg cursor-pointer"
              >
                Começar Configuração
              </button>
              <button
                onClick={handleSkip}
                className="flex-1 py-3.5 sm:py-4 border-2 border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all cursor-pointer"
              >
                Configurar Depois
              </button>
            </div>
          </div>
        );

      case 'company':
        return (
          <div className="space-y-6 animate-slideIn">
            <h2 className="text-3xl font-black text-slate-900">Dados da Empresa</h2>
            <p className="text-slate-600">Logo, foto de perfil e informações de contato</p>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Nome da Empresa</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#57a89a] focus:border-transparent outline-none"
                placeholder="Seu concessionário"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Telefone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#57a89a] focus:border-transparent outline-none"
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Logo da Empresa</label>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && setLogoFile(e.target.files[0])}
                className="hidden"
              />
              <button
                onClick={() => logoInputRef.current?.click()}
                className="w-full py-3 border-2 border-dashed border-[#73bdaf] rounded-xl text-[#57a89a] font-bold hover:bg-[#57a89a]/5 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ImageIcon size={20} />
                {logoFile?.name || 'Selecionar logo'}
              </button>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Foto de Perfil</label>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && setAvatarFile(e.target.files[0])}
                className="hidden"
              />
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="w-full py-3 border-2 border-dashed border-[#73bdaf] rounded-xl text-[#57a89a] font-bold hover:bg-[#57a89a]/5 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ImageIcon size={20} />
                {avatarFile?.name || 'Selecionar foto'}
              </button>
            </div>

            {error && <div className="p-3 bg-red-100 text-red-700 rounded-xl">{error}</div>}

            <div className="flex gap-4 pt-6">
              <button
                onClick={() => setStep('welcome')}
                className="flex-1 py-3 border-2 border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={handleCompanyStep}
                disabled={loading}
                className="flex-1 py-3 bg-[#57a89a] text-white rounded-xl font-bold hover:bg-[#45857a] disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Salvando...' : 'Próximo'}
              </button>
            </div>
          </div>
        );

      case 'vehicles':
        return (
          <div className="space-y-6 animate-slideIn">
            <h2 className="text-3xl font-black text-slate-900">Tipo de Veículo</h2>
            <p className="text-slate-600">Qual tipo de veículo você vende?</p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setEnableCars(!enableCars)}
                className={`p-6 rounded-2xl border-2 transition-all text-center cursor-pointer ${
                  enableCars
                    ? 'border-[#57a89a] bg-[#57a89a]/5'
                    : 'border-slate-200 bg-white hover:border-[#73bdaf]'
                }`}
              >
                <div className="text-5xl mb-3">🚗</div>
                <p className="font-bold text-slate-900">Carros</p>
                {enableCars && <Check className="w-5 h-5 text-[#57a89a] mx-auto mt-2" />}
              </button>

              <button
                onClick={() => setEnableMotos(!enableMotos)}
                className={`p-6 rounded-2xl border-2 transition-all text-center cursor-pointer ${
                  enableMotos
                    ? 'border-[#57a89a] bg-[#57a89a]/5'
                    : 'border-slate-200 bg-white hover:border-[#73bdaf]'
                }`}
              >
                <div className="text-5xl mb-3">🏍️</div>
                <p className="font-bold text-slate-900">Motos</p>
                {enableMotos && <Check className="w-5 h-5 text-[#57a89a] mx-auto mt-2" />}
              </button>
            </div>

            {error && <div className="p-3 bg-red-100 text-red-700 rounded-xl">{error}</div>}

            <div className="flex gap-4 pt-6">
              <button
                onClick={() => setStep('company')}
                className="flex-1 py-3 border-2 border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={handleVehiclesStep}
                disabled={loading}
                className="flex-1 py-3 bg-[#57a89a] text-white rounded-xl font-bold hover:bg-[#45857a] disabled:opacity-50 cursor-pointer"
              >
                Próximo
              </button>
            </div>
          </div>
        );

      case 'whatsapp':
        return (
          <div className="space-y-6 animate-slideIn">
            <h2 className="text-3xl font-black text-slate-900">Conectar WhatsApp</h2>
            <p className="text-slate-600">Receba mensagens de leads no seu WhatsApp</p>

            <div className="p-6 bg-[#57a89a]/5 rounded-2xl border-2 border-[#57a89a]/20 text-center space-y-4">
              <MessageCircle className="w-12 h-12 text-[#57a89a] mx-auto" />
              <div>
                <p className="font-bold text-slate-900">Status: {whatsappStatus}</p>
              </div>
              <button
                onClick={() => {
                  const popupWidth = 500;
                  const popupHeight = 600;
                  const left = window.innerWidth / 2 - popupWidth / 2;
                  const top = window.innerHeight / 2 - popupHeight / 2;
                  window.open(
                    'https://webhook.orvalhodigital.com.br/webhook/veiculos-criar-instancia',
                    'WhatsApp Connection',
                    `width=${popupWidth},height=${popupHeight},left=${left},top=${top}`
                  );
                  setWhatsappStatus('checking');
                }}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 cursor-pointer"
              >
                Conectar WhatsApp
              </button>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                onClick={() => setStep('vehicles')}
                className="flex-1 py-3 border-2 border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={handleSkip}
                className="flex-1 py-3 bg-[#57a89a] text-white rounded-xl font-bold hover:bg-[#45857a] cursor-pointer"
              >
                Pular
              </button>
            </div>
          </div>
        );



      case 'complete':
        return (
          <div className="text-center space-y-8 animate-fadeUp">
            <div className="text-7xl">✨</div>
            <h1 className="text-4xl font-black text-slate-900">Painel Configurado!</h1>
            <p className="text-xl text-slate-600">Você completou {progress}/4 etapas de configuração</p>
            {progress >= 3 && (
              <div className="inline-block bg-amber-100 text-amber-900 px-6 py-3 rounded-full font-bold">
                🏆 Painel Completo!
              </div>
            )}
            
            {error && <div className="p-3 bg-red-100 text-red-700 rounded-xl font-medium max-w-md mx-auto">{error}</div>}

            <button onClick={() => { fireConfetti(); setTimeout(completeOnboarding, 1000); }} disabled={loading} className="mt-8 py-4 px-8 bg-[#57a89a] text-white rounded-2xl font-bold hover:bg-[#45857a] text-lg disabled:opacity-50 cursor-pointer">
              {loading ? 'Redirecionando...' : 'Ir para o Painel'}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-auto">
      <div className="max-w-2xl mx-auto px-6 py-8 sm:py-20">
        {/* Progress bar */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-bold text-slate-600 uppercase tracking-wider">Progresso</p>
            <p className="text-sm font-bold text-[#57a89a]">{currentStepIndex + 1}/5</p>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#57a89a] to-[#73bdaf] transition-all duration-500"
              style={{ width: `${((currentStepIndex + 1) / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        {renderStep()}
      </div>
    </div>
  );
};

export default OnboardingWizard;
