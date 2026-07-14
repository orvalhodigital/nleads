import React, { useState } from 'react';
import { MessageSquare, Save, Loader2, Edit3, Zap, Info } from 'lucide-react';
import { Profile } from '../../types';
import { profileService } from '../../services/profileService';
import { useToast } from '../../contexts/ToastContext';
import { DEFAULT_PRESET_MESSAGES } from '../../utils/constants';

interface Props {
    profile: Profile;
    onUpdate: () => void;
}

const MessageSettings: React.FC<Props> = ({ profile, onUpdate }) => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<string[]>(
        profile.preset_messages?.length === 6 ? profile.preset_messages : DEFAULT_PRESET_MESSAGES
    );

    const handleUpdateMessage = (index: number, content: string) => {
        const newMessages = [...messages];
        newMessages[index] = content;
        setMessages(newMessages);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const normalizedMessages = Array(6).fill('').map((_, i) => messages[i] || '');
            await profileService.updateProfile({ preset_messages: normalizedMessages });
            showToast('success', 'Mensagens predefinidas atualizadas!');
            onUpdate();
        } catch (error: any) {
            showToast('error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-10 animate-fadeUp">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-brand-600 font-bold mb-1 uppercase tracking-widest text-[10px]">
                        <Zap size={16} />
                        Respostas Instantâneas
                    </div>
                    <h2 className="text-3xl font-black text-slate-900">Mensagens Rápidas</h2>
                    <p className="text-slate-500 font-medium">Configure as 6 frases que o sistema usará para agilizar seu atendimento.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {messages.map((msg, index) => (
                    <div key={index} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 relative group">
                        <div className="absolute top-0 right-10 -translate-y-1/2 flex gap-2">
                            <div className="bg-slate-900 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-xl">
                                {index + 1}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-slate-400 font-bold uppercase tracking-widest text-[10px] px-2 mb-2">
                                <Edit3 size={14} /> Mensagem {index + 1}
                            </div>
                            <textarea
                                className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] p-6 font-bold text-sm text-slate-800 focus:bg-white focus:border-brand-500 outline-none transition-all resize-none min-h-[120px] placeholder:text-slate-300 shadow-inner"
                                value={msg}
                                onChange={e => handleUpdateMessage(index, e.target.value)}
                                placeholder="Digite sua mensagem rápida aqui..."
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-brand-50 rounded-[2.5rem] border border-brand-100 p-10 flex flex-col md:flex-row items-center gap-10">
                <div className="flex-1 space-y-4 text-center md:text-left">
                    <h4 className="text-xl font-black text-brand-950 flex items-center gap-3 justify-center md:justify-start">
                        <Info size={24} className="text-brand-500" /> Dica de Variáveis
                    </h4>
                    <p className="text-sm font-medium text-brand-900/70 leading-relaxed">
                        Você pode usar as seguintes variáveis em suas mensagens:<br />
                        <span className="font-black">{"{{nome}}, {{marca}}, {{modelo}}, {{ano}}, {{valor}}"}</span><br />
                        O sistema preencherá automaticamente com os dados do lead e do veículo.
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full md:w-auto px-12 py-5 bg-brand-600 text-white rounded-[1.5rem] font-black shadow-xl shadow-brand-500/20 hover:bg-brand-700 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 border-b-4 border-brand-800"
                >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : <><Save size={24} /> Salvar Mensagens</>}
                </button>
            </div>
        </div>
    );
};

export default MessageSettings;
