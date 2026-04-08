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
            tipos_veiculo: [] as VehicleType[],
            valor_minimo: 0,
            valor_maximo: 0,
            marcas: [] as string[],
            modelos: [] as string[],
            transmissao: [] as TransmissionType[],
            motorizacao: [] as EngineType[],
            observacoes_adicionais: '',
            possui_entrada: false,
            valor_entrada: 0,
            possui_troca: false,
            veiculo_troca: ''
        } as Lead['preferences'],
        tags: [] as string[]
    });

    const availableBrands = Array.from(new Set([
        ...(profile?.enable_cars !== false ? Object.keys(carDatabase) : []),
        ...(profile?.enable_motorcycles ? Object.keys(motoDatabase) : []),
        ...vehicles.map(v => v.brand)
    ])).sort();

    const selectedBrands = leadForm.preferences.marcas || [];

    const availableModels = Array.from(new Set([
        ...(selectedBrands.length > 0
            ? selectedBrands.flatMap(brand => {
                const models = [];
                if (profile?.enable_cars !== false && carDatabase[brand]) {
                    models.push(...carDatabase[brand]);
                }
                if (profile?.enable_motorcycles && motoDatabase[brand]) {
                    models.push(...motoDatabase[brand].map(m => m.name));
                }
                return models;
            })
            : [
                ...(profile?.enable_cars !== false ? Object.values(carDatabase).flat() : []),
                ...(profile?.enable_motorcycles ? Object.values(motoDatabase).flatMap(motos => motos.map(m => m.name)) : [])
            ]
        ),
        ...vehicles
            .filter(v => selectedBrands.length === 0 || selectedBrands.includes(v.brand))
            .map(v => v.model)
    ])).sort();

    const dynamicVehicleTypes = Array.from(new Set([
        ...(profile?.enable_cars !== false ? CAR_VEHICLE_TYPES : []),
        ...(profile?.enable_motorcycles ? MOTO_VEHICLE_TYPES : []),
        'Qualquer Um(a)'
    ]));

    const dynamicEngineTypes = Array.from(new Set([
        ...(profile?.enable_cars !== false ? CAR_ENGINE_TYPES : []),
        ...(profile?.enable_motorcycles ? MOTO_ENGINE_TYPES : []),
        'Qualquer Um(a)'
    ]));

    useEffect(() => {
        if (initialData) {
            setLeadForm({
                ...initialData,
                preferences: {
                    ...initialData.preferences,
                    valor_minimo: initialData.preferences?.valor_minimo || 0,
                    valor_maximo: initialData.preferences?.valor_maximo || 0,
                    marcas: initialData.preferences?.marcas || [],
                    modelos: initialData.preferences?.modelos || [],
                    transmissao: initialData.preferences?.transmissao || [],
                    motorizacao: initialData.preferences?.motorizacao || [],
                    tipos_veiculo: initialData.preferences?.tipos_veiculo || [],
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
        <div className="max-w-4xl mx-auto w-full pb-20 animate-fadeUp">
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

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Info Column */}
                    <div className="lg:col-span-2 space-y-8">
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
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Perfil de Interesse</h3>
                                </div>

                                <div className="space-y-6">
                                    <MultiSelect
                                        label="Tipos de Veículo"
                                        options={dynamicVehicleTypes}
                                        value={leadForm.preferences.tipos_veiculo}
                                        onChange={val => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, tipos_veiculo: val as any } })}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Valor Máximo (R$)</label>
                                            <input
                                                type="text"
                                                value={formatCurrency(leadForm.preferences.valor_maximo)}
                                                onChange={e => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, valor_maximo: parseCurrency(e.target.value) } })}
                                                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-sm focus:border-emerald-500/30 outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Motorização</label>
                                            <MultiSelect
                                                label="Motorização"
                                                options={dynamicEngineTypes}
                                                value={leadForm.preferences.motorizacao}
                                                onChange={val => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, motorizacao: val as any } })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Câmbio</label>
                                            <MultiSelect
                                                label="Câmbio"
                                                options={['Manual', 'Automático', 'Qualquer Um(a)']}
                                                value={leadForm.preferences.transmissao}
                                                onChange={val => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, transmissao: val as any } })}
                                            />
                                        </div>
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

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Marcas de Interesse</label>
                                        <TagInput
                                            label=""
                                            placeholder="Digite e pressione Enter..."
                                            value={leadForm.preferences.marcas}
                                            onChange={tags => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, marcas: tags } })}
                                            suggestions={availableBrands}
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Modelos de Interesse</label>
                                        <TagInput
                                            label=""
                                            placeholder="Digite e pressione Enter..."
                                            value={leadForm.preferences.modelos}
                                            onChange={tags => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, modelos: tags } })}
                                            suggestions={availableModels}
                                        />
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
                    </div>

                    {/* Sidebar Column */}
                    <div className="space-y-8 lg:sticky lg:top-8 self-start">
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-slate-900/20">
                            <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Check size={16} className="text-emerald-400" /> Confirmar Cadastro
                            </h3>
                            <p className="text-slate-400 text-xs font-medium leading-relaxed mb-8">
                                Ao salvar, o lead será classificado no funil e ficará visível para acompanhamento.
                            </p>

                            <div className="space-y-3">
                                <button
                                    type="submit"
                                    className="w-full py-5 bg-emerald-500 text-white rounded-[1.5rem] text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                                >
                                    {isEditing ? 'Salvar Alterações' : 'Criar Lead'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/leads')}
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

export default LeadForm;
