import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, UserPlus, Check, Target, Building } from 'lucide-react';
import { Lead, LeadPhase, LeadTemperature, VehicleType, TransmissionType, EngineType } from '../types';
import TagInput from './TagInput';
import MultiSelect from './MultiSelect';
import { useData } from '../contexts/DataContext';
import { formatCurrency, parseCurrency } from '../utils/formatters';
import { carDatabase } from '../data/carDb';
import { motoDatabase } from '../data/motoDb';


interface LeadFormProps {
    initialData?: Lead;
    onSave: (lead: any) => void;
    isEditing?: boolean;
}

const SOURCES = ['Site', 'WhatsApp', 'Facebook', 'Instagram', 'Indicação', 'Telefone', 'Outros'];

const CAR_VEHICLE_TYPES: VehicleType[] = ['SUV', 'Sedan', 'Hatch', 'Picape', 'Esportivo', 'Conversível', 'Van'];
const MOTO_VEHICLE_TYPES: VehicleType[] = ['Naked', 'Sport', 'Trail', 'Custom', 'Scooter', 'Touring', 'Elétrica', 'Street'];

const CAR_ENGINE_TYPES: EngineType[] = ['1.0', '1.4', '1.6', '2.0+', 'Elétrico', 'Híbrido'];
const MOTO_ENGINE_TYPES: EngineType[] = ['110cc', '125cc', '150cc', '160cc', '190cc', '250cc', '300cc', '400cc', '600cc', '750cc', '1000cc', '1200cc+'];

const LeadForm: React.FC<LeadFormProps> = ({ initialData, onSave, isEditing = false }) => {
    const navigate = useNavigate();
    const { vehicles, profile } = useData();

    const [leadForm, setLeadForm] = useState({
        name: '',
        phone: '',
        email: '',
        phase: LeadPhase.NEW,
        temperature: LeadTemperature.COLD,
        source: 'Site',
        preferences: {
            interesse_carro: true,
            interesse_moto: false,
            tipos_veiculo: [] as VehicleType[],
            tipos_moto: [] as VehicleType[],
            carro_valor_min: 0,
            carro_valor_max: 0,
            carro_transmissao: [] as TransmissionType[],
            carro_motorizacao: [] as EngineType[],
            moto_valor_min: 0,
            moto_valor_max: 0,
            moto_transmissao: [] as TransmissionType[],
            moto_motorizacao: [] as EngineType[],
            valor_minimo: 0, // Legacy
            valor_maximo: 0, // Legacy
            marcas: [] as string[],
            modelos: [] as string[],
            marcas_moto: [] as string[],
            modelos_moto: [] as string[],
            transmissao: [] as TransmissionType[],
            motorizacao: [] as EngineType[],
            observacoes_adicionais: '',
            possui_entrada: false,
            valor_entrada: 0,
            possui_troca: false,
            veiculo_troca: ''
        } as any,
        tags: [] as string[]
    });

    const carBrands = Array.from(new Set([
        ...Object.keys(carDatabase),
        ...vehicles.filter(v => !v.isMoto).map(v => v.brand)
    ])).sort();

    const motoBrands = Array.from(new Set([
        ...Object.keys(motoDatabase),
        ...vehicles.filter(v => v.isMoto).map(v => v.brand)
    ])).sort();

    const getAvailableModels = (brands: string[], isMoto: boolean) => {
        const db = isMoto ? motoDatabase : carDatabase;
        const models = new Set<string>();
        
        if (brands.length > 0) {
            brands.forEach(brand => {
                if (db[brand]) {
                    if (isMoto) {
                        (db[brand] as any[]).forEach(m => models.add(m.name));
                    } else {
                        (db[brand] as string[]).forEach(m => models.add(m));
                    }
                }
            });
        } else {
            Object.values(db).forEach(list => {
                if (isMoto) {
                    (list as any[]).forEach(m => models.add(m.name));
                } else {
                    (list as string[]).forEach(m => models.add(m));
                }
            });
        }
        
        vehicles
            .filter(v => v.isMoto === isMoto && (brands.length === 0 || brands.includes(v.brand)))
            .forEach(v => models.add(v.model));
            
        return Array.from(models).sort();
    };

    const carModels = getAvailableModels(leadForm.preferences.marcas || [], false);
    const motoModels = getAvailableModels(leadForm.preferences.marcas_moto || [], true);

    useEffect(() => {
        if (initialData) {
            setLeadForm({
                ...initialData,
                preferences: {
                    ...initialData.preferences,
                    interesse_carro: initialData.preferences?.interesse_carro ?? (initialData.preferences?.marcas?.length > 0 || initialData.preferences?.tipos_veiculo?.some(t => CAR_VEHICLE_TYPES.includes(t))),
                    interesse_moto: initialData.preferences?.interesse_moto ?? (initialData.preferences?.marcas_moto?.length > 0 || initialData.preferences?.tipos_moto?.length > 0 || initialData.preferences?.tipos_veiculo?.some(t => MOTO_VEHICLE_TYPES.includes(t))),
                    carro_valor_min: initialData.preferences?.carro_valor_min || 0,
                    carro_valor_max: initialData.preferences?.carro_valor_max || initialData.preferences?.valor_maximo || 0,
                    carro_transmissao: initialData.preferences?.carro_transmissao || initialData.preferences?.transmissao || [],
                    carro_motorizacao: initialData.preferences?.carro_motorizacao || initialData.preferences?.motorizacao || [],
                    moto_valor_min: initialData.preferences?.moto_valor_min || 0,
                    moto_valor_max: initialData.preferences?.moto_valor_max || (initialData.preferences?.interesse_moto ? initialData.preferences?.valor_maximo : 0) || 0,
                    moto_transmissao: initialData.preferences?.moto_transmissao || (initialData.preferences?.interesse_moto ? initialData.preferences?.transmissao : []) || [],
                    moto_motorizacao: initialData.preferences?.moto_motorizacao || (initialData.preferences?.interesse_moto ? initialData.preferences?.motorizacao : []) || [],
                    marcas: initialData.preferences?.marcas || [],
                    modelos: initialData.preferences?.modelos || [],
                    marcas_moto: initialData.preferences?.marcas_moto || [],
                    modelos_moto: initialData.preferences?.modelos_moto || [],
                    tipos_veiculo: initialData.preferences?.tipos_veiculo || [],
                    tipos_moto: initialData.preferences?.tipos_moto || [],
                    observacoes_adicionais: initialData.preferences?.observacoes_adicionais || '',
                    possui_entrada: initialData.preferences?.possui_entrada || false,
                    valor_entrada: initialData.preferences?.valor_entrada || 0,
                    possui_troca: initialData.preferences?.possui_troca || false,
                    veiculo_troca: initialData.preferences?.veiculo_troca || ''
                }
            } as any);
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(leadForm);
    };

    const phases = [LeadPhase.NEW, LeadPhase.VISIT, LeadPhase.SIMULATION, LeadPhase.FOLLOW_UP, LeadPhase.COMPLETED, LeadPhase.DISQUALIFIED];

    return (
        <div className="max-w-[1600px] mx-auto w-full pb-32 animate-fadeUp">
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-6">
                    <button
                        type="button"
                        onClick={() => navigate('/leads')}
                        className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all hover:bg-slate-50 active:scale-95 shadow-sm"
                    >
                        <X size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
                            {isEditing ? 'Editar Lead' : 'Novo Lead'}
                        </h1>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
                            Preencha as informações do cliente
                        </p>
                    </div>
                </div>
            </div>

            <form id="lead-form" onSubmit={handleSubmit} className="space-y-8">
                        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-10">

                            <section className="space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Informações Básicas</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nome Completo</label>
                                        <input
                                            required
                                            value={leadForm.name}
                                            onChange={e => setLeadForm({ ...leadForm, name: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm focus:bg-white focus:border-emerald-500/30 outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                            placeholder="Ex: João Silva"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">WhatsApp / Telefone</label>
                                        <input
                                            required
                                            value={leadForm.phone}
                                            onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm focus:bg-white focus:border-emerald-500/30 outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                            placeholder="(00) 00000-0000"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">E-mail (Opcional)</label>
                                    <input
                                        type="email"
                                        value={leadForm.email}
                                        onChange={e => setLeadForm({ ...leadForm, email: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm focus:bg-white focus:border-emerald-500/30 outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                        placeholder="email@exemplo.com"
                                    />
                                </div>
                            </section>

                            <section className="space-y-6 pt-6 border-t border-slate-100">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                        Fase do Funil de Vendas
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {phases.map(p => (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => setLeadForm({ ...leadForm, phase: p as LeadPhase })}
                                                className={`px-4 py-2.5 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${leadForm.phase === p
                                                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20 active:scale-95'
                                                    : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-8 pt-6 border-t border-slate-100">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Qualificação e Origem</h3>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Temperatura do Lead</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[LeadTemperature.COLD, LeadTemperature.WARM, LeadTemperature.HOT].map(temp => (
                                            <button
                                                key={temp}
                                                type="button"
                                                onClick={() => setLeadForm({ ...leadForm, temperature: temp })}
                                                className={`py-4 px-2 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${leadForm.temperature === temp
                                                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20 active:scale-95'
                                                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                                    }`}
                                            >
                                                <span className="text-lg leading-none">
                                                    {temp === LeadTemperature.HOT ? '🔥' : temp === LeadTemperature.WARM ? '☀️' : '❄️'}
                                                </span>
                                                {temp === LeadTemperature.HOT ? 'Quente' : temp === LeadTemperature.WARM ? 'Morno' : 'Frio'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Origem do Lead</label>
                                    <select
                                        value={leadForm.source}
                                        onChange={e => setLeadForm({ ...leadForm, source: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm focus:bg-white outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all appearance-none"
                                    >
                                        {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </section>

                            <section className="space-y-8 bg-slate-50/50 p-8 rounded-[40px] border border-slate-100">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Perfil de Interesse</h3>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, interesse_carro: !leadForm.preferences.interesse_carro } })}
                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${leadForm.preferences.interesse_carro ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200'}`}
                                        >
                                            Carros
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, interesse_moto: !leadForm.preferences.interesse_moto } })}
                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${leadForm.preferences.interesse_moto ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200'}`}
                                        >
                                            Motos
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-10">
                                    {/* SEÇÃO CARROS */}
                                    {leadForm.preferences.interesse_carro && (
                                        <div className="space-y-6 p-6 bg-white rounded-3xl border border-slate-100 animate-fadeIn">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Target size={14} className="text-emerald-500" />
                                                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Interesse em Carros</h4>
                                            </div>
                                            
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tipos de Carro</label>
                                                <MultiSelect
                                                    label="Selecione os tipos..."
                                                    options={CAR_VEHICLE_TYPES}
                                                    value={leadForm.preferences.tipos_veiculo || []}
                                                    onChange={val => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, tipos_veiculo: val as any } })}
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Marcas de Carro</label>
                                                    <TagInput
                                                        label=""
                                                        placeholder="Ex: Toyota, BMW..."
                                                        value={leadForm.preferences.marcas || []}
                                                        onChange={tags => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, marcas: tags } })}
                                                        suggestions={carBrands}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Modelos de Carro</label>
                                                    <TagInput
                                                        label=""
                                                        placeholder="Ex: Corolla, X1..."
                                                        value={leadForm.preferences.modelos || []}
                                                        onChange={tags => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, modelos: tags } })}
                                                        suggestions={carModels}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-50">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Valor Máximo (Carro)</label>
                                                    <input
                                                        type="text"
                                                        value={formatCurrency(leadForm.preferences.carro_valormax)}
                                                        onChange={e => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, carro_valormax: parseCurrency(e.target.value) } })}
                                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm focus:bg-white focus:border-emerald-500/30 outline-none transition-all"
                                                        placeholder="R$ 0,00"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Câmbio</label>
                                                    <MultiSelect
                                                        label="Câmbio"
                                                        options={['Manual', 'Automático', 'Qualquer Um(a)']}
                                                        value={leadForm.preferences.carro_transmissao || []}
                                                        onChange={val => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, carro_transmissao: val as any } })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Motorização</label>
                                                    <MultiSelect
                                                        label="Motorização"
                                                        options={[...CAR_ENGINE_TYPES, 'Qualquer Um(a)']}
                                                        value={leadForm.preferences.carro_motorizacao || []}
                                                        onChange={val => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, carro_motorizacao: val as any } })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* SEÇÃO MOTOS */}
                                    {leadForm.preferences.interesse_moto && (
                                        <div className="space-y-6 p-6 bg-white rounded-3xl border border-slate-100 animate-fadeIn">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Target size={14} className="text-indigo-500" />
                                                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Interesse em Motos</h4>
                                            </div>
                                            
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tipos de Moto</label>
                                                <MultiSelect
                                                    label="Selecione os tipos..."
                                                    options={MOTO_VEHICLE_TYPES}
                                                    value={leadForm.preferences.tipos_moto || []}
                                                    onChange={val => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, tipos_moto: val as any } })}
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Marcas de Moto</label>
                                                    <TagInput
                                                        label=""
                                                        placeholder="Ex: Honda, Yamaha..."
                                                        value={leadForm.preferences.marcas_moto || []}
                                                        onChange={tags => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, marcas_moto: tags } })}
                                                        suggestions={motoBrands}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Modelos de Moto</label>
                                                    <TagInput
                                                        label=""
                                                        placeholder="Ex: CB 500, MT-07..."
                                                        value={leadForm.preferences.modelos_moto || []}
                                                        onChange={tags => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, modelos_moto: tags } })}
                                                        suggestions={motoModels}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-50">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Valor Máximo (Moto)</label>
                                                    <input
                                                        type="text"
                                                        value={formatCurrency(leadForm.preferences.moto__valormax)}
                                                        onChange={e => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, moto__valormax: parseCurrency(e.target.value) } })}
                                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm focus:bg-white focus:border-indigo-500/30 outline-none transition-all"
                                                        placeholder="R$ 0,00"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Câmbio</label>
                                                    <MultiSelect
                                                        label="Câmbio"
                                                        options={['Manual', 'Automático', 'Qualquer Um(a)']}
                                                        value={leadForm.preferences.moto_transmissao || []}
                                                        onChange={val => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, moto_transmissao: val as any } })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Motorização</label>
                                                    <MultiSelect
                                                        label="Motorização"
                                                        options={[...MOTO_ENGINE_TYPES, 'Qualquer Um(a)']}
                                                        value={leadForm.preferences.moto_motorizacao || []}
                                                        onChange={val => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, moto_motorizacao: val as any } })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Configurações Gerais */}
                                    <div className="space-y-6 pt-6 border-t border-slate-100">
                                        <div className="grid grid-cols-1 gap-8">
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Etiquetas (Tags)</label>
                                                <TagInput
                                                    label=""
                                                    placeholder="Adicionar tag..."
                                                    value={leadForm.tags || []}
                                                    onChange={tags => setLeadForm({ ...leadForm, tags })}
                                                    suggestions={[]}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Informações Complementares</h3>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Observações / Notas</label>
                                    <textarea
                                        value={leadForm.preferences.observacoes_adicionais}
                                        onChange={e => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, observacoes_adicionais: e.target.value } })}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm focus:bg-white outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all min-h-[120px] resize-none"
                                        placeholder="Alguma nota importante sobre o cliente ou negociação..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100 cursor-pointer transition-all hover:bg-white" onClick={() => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, possui_entrada: !leadForm.preferences.possui_entrada } })}>
                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${leadForm.preferences.possui_entrada ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-200'}`}>
                                                {leadForm.preferences.possui_entrada && <Check size={14} className="text-white" strokeWidth={4} />}
                                            </div>
                                            <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Possui Entrada</span>
                                        </div>
                                        {leadForm.preferences.possui_entrada && (
                                            <div className="animate-fadeInLeft">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-1.5">Valor da Entrada (R$)</label>
                                                <input
                                                    type="text"
                                                    value={formatCurrency(leadForm.preferences.valor_entrada)}
                                                    onChange={e => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, valor_entrada: parseCurrency(e.target.value) } })}
                                                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-sm focus:border-emerald-500/30 outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                                    placeholder="Ex: 50.000"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100 cursor-pointer transition-all hover:bg-white" onClick={() => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, possui_troca: !leadForm.preferences.possui_troca } })}>
                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${leadForm.preferences.possui_troca ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-200'}`}>
                                                {leadForm.preferences.possui_troca && <Check size={14} className="text-white" strokeWidth={4} />}
                                            </div>
                                            <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Possui Troca</span>
                                        </div>
                                        {leadForm.preferences.possui_troca && (
                                            <div className="animate-fadeInLeft">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-1.5">Qual veículo para troca?</label>
                                                <input
                                                    type="text"
                                                    value={leadForm.preferences.veiculo_troca || ''}
                                                    onChange={e => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, veiculo_troca: e.target.value } })}
                                                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-sm focus:border-emerald-500/30 outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                                    placeholder="Marca, modelo, ano..."
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>
                        </div>
            </form>

            {/* Sticky Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-700/50 px-6 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
                    <div className="hidden sm:block">
                        <p className="text-xs font-bold text-slate-400">
                            {isEditing ? 'Editando lead' : 'Novo cadastro'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 ml-auto">
                        <button
                            type="button"
                            onClick={() => navigate('/leads')}
                            className="px-6 py-3.5 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="lead-form"
                            className="px-8 py-3.5 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                        >
                            {isEditing ? 'Salvar Alterações' : 'Criar Lead'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeadForm;
