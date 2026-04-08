
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    X, Upload, Loader2, Check, Plus, Car, DollarSign, Calendar, Gauge, Zap,
    ChevronLeft, ArrowLeft
} from 'lucide-react';
import { Vehicle, VehicleType, TransmissionType, EngineType } from '../types';
import { supabase } from '../lib/supabaseClient';
import { resizeImage } from '../utils/imageProcessor';
import { carDatabase } from '../data/carDb';
import AutocompleteInput from './ui/AutocompleteInput';
import { formatCurrency, parseCurrency } from '../utils/formatters';


interface VehicleFormProps {
    initialData?: Vehicle;
    onSave: (vehicle: Omit<Vehicle, 'id'> | Vehicle) => void;
    isEditing?: boolean;
}

const VEHICLE_TYPES: VehicleType[] = ['SUV', 'Sedan', 'Hatch', 'Picape', 'Esportivo', 'Conversível', 'Van'];
const TRANSMISSION_TYPES: TransmissionType[] = ['Manual', 'Automático'];
const ENGINE_TYPES: EngineType[] = ['1.0', '1.4', '1.6', '2.0+', 'Elétrico', 'Híbrido'];
const COMMON_OPTIONS = [
    'Ar Condicionado', 'Direção Hidráulica', 'Vidros Elétricos', 'Travas Elétricas',
    'Alarme', 'Airbag', 'Freios ABS', 'Som Multimídia', 'Rodas de Liga Leve',
    'Bancos de Couro', 'Teto Solar', 'Câmera de Ré', 'Sensor de Estacionamento',
    'Piloto Automático', 'Computador de Bordo', 'Tração 4x4', 'Farol de Neblina',
    'Controle de Estabilidade', 'Controle de Tração', 'Chave Presencial'
];

const VehicleForm: React.FC<VehicleFormProps> = ({ initialData, onSave, isEditing = false }) => {
    const navigate = useNavigate();
    const [uploading, setUploading] = useState(false);
    const [customOption, setCustomOption] = useState('');

    const [formData, setFormData] = useState<Omit<Vehicle, 'id' | 'status'>>({
        brand: '', model: '', year: new Date().getFullYear(), modelYear: new Date().getFullYear(), plate: '', price: 0, type: 'Sedan',
        transmission: 'Automático', engine: '1.6', mileage: 0, color: '',
        isSingleOwner: false, isServiceHistoryComplete: false, isIpvaPaid: true, hasWarranty: false,
        optionals: [], imageUrl: ''
    });

    useEffect(() => {
        if (initialData) {
            const { id, status, saleDetails, ...rest } = initialData;
            setFormData(rest);
        }
    }, [initialData]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!e.target.files || e.target.files.length === 0) return;
            const file = e.target.files[0];
            setUploading(true);
            const resizedBlob = await resizeImage(file, 800, 600); // Standard size for WebP
            const resizedFile = new File([resizedBlob], "image.webp", { type: 'image/webp' });
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.webp`;

            const { data, error: uploadError } = await supabase.storage
                .from('vehicles')
                .upload(fileName, resizedFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('vehicles')
                .getPublicUrl(fileName);

            setFormData(prev => ({ ...prev, imageUrl: publicUrl }));
        } catch (error: any) {
            alert('Erro ao fazer upload: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing && initialData) {
            onSave({ ...initialData, ...formData });
        } else {
            onSave({ ...formData, status: 'available' });
        }
        navigate('/inventory');
    };

    return (
        <div className="max-w-4xl mx-auto w-full pb-20 animate-fadeUp">
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/inventory')}
                        className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all hover:bg-slate-50 active:scale-95 shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
                            {isEditing ? 'Editar Veículo' : 'Novo Veículo'}
                        </h1>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Preencha os dados técnicos abaixo</p>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100/50">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Ambiente de Cadastro</span>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Info Column */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-10">

                            <section className="space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Informações Básicas</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Marca</label>
                                        <AutocompleteInput
                                            required
                                            value={formData.brand}
                                            onChangeValue={(val) => setFormData({ ...formData, brand: val, model: '' })}
                                            suggestions={Object.keys(carDatabase)}
                                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all font-semibold text-sm"
                                            placeholder="Ex: Chevrolet"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Modelo</label>
                                        <AutocompleteInput
                                            required
                                            value={formData.model}
                                            onChangeValue={(val) => setFormData(prev => ({ ...prev, model: val }))}
                                            suggestions={carDatabase[Object.keys(carDatabase).find(k => k.toLowerCase() === formData.brand.toLowerCase()) || ''] || []}
                                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all font-semibold text-sm"
                                            placeholder="Ex: Onix"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Placa</label>
                                        <input
                                            value={formData.plate}
                                            onChange={e => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                                            placeholder="ABC-1234"
                                            maxLength={8}
                                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all font-semibold text-sm uppercase"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Ano Fab.</label>
                                        <input type="number" required value={formData.year} onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-semibold text-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Ano Modelo</label>
                                        <input type="number" required value={formData.modelYear || formData.year} onChange={e => setFormData({ ...formData, modelYear: parseInt(e.target.value) })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-semibold text-sm" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Preço Sugerido</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-0 bottom-0 my-auto mt-[1px] text-emerald-700 font-bold text-sm">R$</span>
                                            <input
                                                type="text"
                                                required
                                                value={formatCurrency(formData.price)}
                                                onChange={e => setFormData({ ...formData, price: parseCurrency(e.target.value) })}
                                                className="w-full p-4 pl-12 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl outline-none font-bold text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">KM Rodados</label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.mileage}
                                            onChange={e => setFormData({ ...formData, mileage: parseInt(e.target.value) })}
                                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-semibold text-sm"
                                        />
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Especificações Técnicas</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Tipo</label>
                                        <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as VehicleType })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm appearance-none cursor-pointer">
                                            {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Câmbio</label>
                                        <select value={formData.transmission} onChange={e => setFormData({ ...formData, transmission: e.target.value as TransmissionType })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm appearance-none cursor-pointer">
                                            {TRANSMISSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Motor</label>
                                        <select value={formData.engine} onChange={e => setFormData({ ...formData, engine: e.target.value as EngineType })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm appearance-none cursor-pointer">
                                            {ENGINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                                    {[
                                        { label: 'Único Dono', key: 'isSingleOwner' },
                                        { label: 'Revisões OK', key: 'isServiceHistoryComplete' },
                                        { label: 'IPVA Pago', key: 'isIpvaPaid' },
                                        { label: 'Garantia', key: 'hasWarranty' }
                                    ].map(check => (
                                        <button
                                            type="button"
                                            key={check.key}
                                            onClick={() => setFormData(prev => ({ ...prev, [check.key]: !prev[check.key as keyof typeof prev] }))}
                                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all gap-2 ${formData[check.key as keyof typeof formData] ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                                        >
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData[check.key as keyof typeof formData] ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200'}`}>
                                                {formData[check.key as keyof typeof formData] && <Check size={12} strokeWidth={4} />}
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-widest">{check.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <section className="space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Opcionais do Veículo</h3>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {COMMON_OPTIONS.map(opt => {
                                        const isSelected = formData.optionals.includes(opt);
                                        return (
                                            <button
                                                type="button"
                                                key={opt}
                                                onClick={() => {
                                                    setFormData(prev => {
                                                        const newOptionals = isSelected
                                                            ? prev.optionals.filter(o => o !== opt)
                                                            : [...prev.optionals, opt];
                                                        return { ...prev, optionals: newOptionals };
                                                    });
                                                }}
                                                className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-all border ${isSelected
                                                    ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                                                    : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {opt}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={customOption}
                                        onChange={e => setCustomOption(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                if (customOption.trim()) {
                                                    const val = customOption.trim();
                                                    if (!formData.optionals.includes(val)) {
                                                        setFormData(prev => ({ ...prev, optionals: [...prev.optionals, val] }));
                                                    }
                                                    setCustomOption('');
                                                }
                                            }
                                        }}
                                        placeholder="Adicionar outro opcional..."
                                        className="flex-1 p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all font-semibold text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (customOption.trim()) {
                                                const val = customOption.trim();
                                                if (!formData.optionals.includes(val)) {
                                                    setFormData(prev => ({ ...prev, optionals: [...prev.optionals, val] }));
                                                }
                                                setCustomOption('');
                                            }
                                        }}
                                        className="px-6 bg-slate-900 text-white rounded-2xl hover:bg-emerald-500 transition-colors"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* Sidebar / Image Column */}
                    <div className="space-y-8 lg:sticky lg:top-8 self-start">
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Car size={14} /> Mídia do Veículo
                            </h3>

                            <div className="space-y-4">
                                <div className="aspect-[4/3] rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden relative group">
                                    {formData.imageUrl ? (
                                        <>
                                            <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button type="button" onClick={() => setFormData({ ...formData, imageUrl: '' })} className="w-12 h-12 rounded-full bg-white text-red-500 flex items-center justify-center shadow-xl">
                                                    <X size={20} />
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-3">
                                            <Upload size={48} strokeWidth={1} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Nenhuma Foto</span>
                                        </div>
                                    )}
                                </div>

                                <label className={`block w-full cursor-pointer group`}>
                                    <div className={`w-full py-4 px-6 rounded-2xl border transition-all text-center flex items-center justify-center gap-3 ${uploading ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200 hover:border-emerald-500 hover:bg-emerald-50'}`}>
                                        {uploading ? (
                                            <Loader2 size={18} className="animate-spin text-emerald-500" />
                                        ) : (
                                            <Upload size={18} className="text-slate-400 group-hover:text-emerald-500" />
                                        )}
                                        <span className={`text-[11px] font-black uppercase tracking-widest ${uploading ? 'text-slate-400' : 'text-slate-600 group-hover:text-emerald-600'}`}>
                                            {uploading ? 'Enviando...' : 'Fazer Upload'}
                                        </span>
                                    </div>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                                </label>
                                <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-tight">Formatos aceitos: JPG, PNG. Máx 5MB.</p>
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-slate-900/20">
                            <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Check size={16} className="text-emerald-400" /> Confirmar Cadastro
                            </h3>
                            <p className="text-slate-400 text-xs font-medium leading-relaxed mb-8">
                                Ao salvar, o veículo ficará imediatamente visível no seu estoque disponível para novos leads.
                            </p>

                            <div className="space-y-3">
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="w-full py-5 bg-emerald-500 text-white rounded-[1.5rem] text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                                >
                                    {isEditing ? 'Salvar Alterações' : 'Publicar no Estoque'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/inventory')}
                                    className="w-full py-5 text-slate-400 text-xs font-black uppercase tracking-widest hover:text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default VehicleForm;
