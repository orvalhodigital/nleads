
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { systemSettingsService } from '../services/systemSettingsService';
import { Upload, Save, Clock, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { resizeImage } from '../utils/imageProcessor';

export default function AdminSettings() {
    // Standard Logo
    const [logoUrl, setLogoUrl] = useState('');
    const [uploadingLogo, setUploadingLogo] = useState(false);

    // Temp Logo
    const [tempLogoUrl, setTempLogoUrl] = useState('');
    const [tempStart, setTempStart] = useState('');
    const [tempEnd, setTempEnd] = useState('');
    const [uploadingTemp, setUploadingTemp] = useState(false);

    const logoInputRef = useRef<HTMLInputElement>(null);
    const tempLogoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        const data = await systemSettingsService.getAll();
        {
            const settingsMap = data.reduce((acc: any, curr) => {
                acc[curr.key] = curr.value;
                return acc;
            }, {});

            setLogoUrl(settingsMap['logo_url'] || '');
            setTempLogoUrl(settingsMap['temp_logo_url'] || '');
            setTempStart(settingsMap['temp_logo_start'] || '');
            setTempEnd(settingsMap['temp_logo_end'] || '');
        }
    };

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>, isTemp: boolean) => {
        try {
            if (!event.target.files || event.target.files.length === 0) return;
            const file = event.target.files[0];

            if (isTemp) setUploadingTemp(true);
            else setUploadingLogo(true);

            // Otimizar imagem para WebP
            // Para logos, usamos um redimensionamento que tenta manter a qualidade mas reduz o tamanho
            const processedBlob = await resizeImage(file, 600, 300);
            const processedFile = new File([processedBlob], 'logo.webp', { type: 'image/webp' });

            const fileName = `${Math.random().toString(36).substring(2)}.webp`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('system_assets')
                .upload(filePath, processedFile, {
                    contentType: 'image/webp'
                });

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('system_assets')
                .getPublicUrl(filePath);

            if (isTemp) setTempLogoUrl(publicUrl);
            else setLogoUrl(publicUrl);

        } catch (error: any) {
            alert('Erro no upload: ' + error.message);
        } finally {
            if (isTemp) setUploadingTemp(false);
            else setUploadingLogo(false);
        }
    };

    const handleSave = async () => {
        try {
            const updates = [
                { key: 'logo_url', value: logoUrl },
                { key: 'temp_logo_url', value: tempLogoUrl },
                { key: 'temp_logo_start', value: tempStart },
                { key: 'temp_logo_end', value: tempEnd },
            ];

            await systemSettingsService.upsert(updates);
            alert('Configurações salvas com sucesso!');
        } catch (error: any) {
            alert('Erro ao salvar: ' + error.message);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fadeUp">
            <header>
                <h1 className="text-2xl font-bold text-slate-800">Configurações do Sistema</h1>
                <p className="text-slate-500 mt-1">Personalize a aparência e recursos globais da aplicação</p>
            </header>

            <div className="grid gap-8 md:grid-cols-2">
                {/* Default Logo Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <Upload size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">Logo Padrão</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 min-h-[200px]">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo Atual" className="max-h-32 object-contain mb-4" />
                            ) : (
                                <div className="text-slate-400 text-sm mb-4">Nenhuma logo definida</div>
                            )}

                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={logoInputRef}
                                onChange={(e) => handleUpload(e, false)}
                            />

                            <button
                                onClick={() => logoInputRef.current?.click()}
                                disabled={uploadingLogo}
                                className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
                            >
                                {uploadingLogo ? 'Enviando...' : 'Carregar Nova Imagem'}
                            </button>
                            <p className="text-xs text-slate-400 mt-2">Recomendado: PNG Transparente</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">URL Direta (Opcional)</label>
                            <input
                                className="w-full text-sm border-slate-200 rounded-lg"
                                value={logoUrl}
                                onChange={e => setLogoUrl(e.target.value)}
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                </div>

                {/* Temporary Logo Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
                    {tempLogoUrl && (
                        <div className="absolute top-0 right-0 p-4">
                            <div className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded inline-flex items-center gap-1">
                                <Clock size={12} /> Temporário Ativo
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                            <Calendar size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">Logo Temporária</h2>
                    </div>

                    <p className="text-sm text-slate-500 mb-6">
                        Defina uma logo para ser exibida em datas específicas (ex: Black Friday, Natal).
                        O sistema voltará para a logo padrão automaticamente após o período.
                    </p>

                    <div className="space-y-4">
                        <div className="border-2 border-dashed border-amber-100 rounded-xl p-6 flex flex-col items-center justify-center bg-amber-50/30 min-h-[160px]">
                            {tempLogoUrl ? (
                                <div className="relative group">
                                    <img src={tempLogoUrl} alt="Logo Temporária" className="max-h-24 object-contain mb-4" />
                                    <button
                                        onClick={() => setTempLogoUrl('')}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ) : (
                                <div className="text-amber-400/70 text-sm mb-4">Nenhuma logo temporária</div>
                            )}

                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={tempLogoInputRef}
                                onChange={(e) => handleUpload(e, true)}
                            />

                            <button
                                onClick={() => tempLogoInputRef.current?.click()}
                                disabled={uploadingTemp}
                                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50 uppercase tracking-wide"
                            >
                                {uploadingTemp ? '...' : 'Escolher Imagem'}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Início</label>
                                <input
                                    type="datetime-local"
                                    className="w-full text-sm border-slate-200 rounded-lg"
                                    value={tempStart}
                                    onChange={e => setTempStart(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Fim</label>
                                <input
                                    type="datetime-local"
                                    className="w-full text-sm border-slate-200 rounded-lg"
                                    value={tempEnd}
                                    onChange={e => setTempEnd(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <AlertCircle size={16} />
                    <span>As alterações podem levar alguns instantes para refletir para todos os usuários.</span>
                </div>
                <button
                    onClick={handleSave}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all font-bold flex items-center gap-2"
                >
                    <Save size={20} />
                    Salvar Alterações
                </button>
            </div>
        </div>
    );
}
