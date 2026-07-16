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
import { truckDatabase } from '../data/truckDb';


interface LeadFormProps {
    initialData?: Lead;
    onSave: (lead: any) => void;
    isEditing?: boolean;
}

const SOURCES = ['Site', 'WhatsApp', 'Instagram', 'Facebook', 'Indicação', 'Google', 'Ponto de Venda', 'Outros'];

const CAR_VEHICLE_TYPES: VehicleType[] = ['SUV', 'Sedan', 'Hatch', 'Picape', 'Esportivo', 'Conversível', 'Van'];
const MOTO_VEHICLE_TYPES: VehicleType[] = ['Naked', 'Sport', 'Trail', 'Custom', 'Scooter', 'Touring', 'Elétrica', 'Street'];

const CAR_ENGINE_TYPES: EngineType[] = ['1.0', '1.4', '1.6', '2.0+', 'Elétrico', 'Híbrido'];
const MOTO_ENGINE_TYPES: EngineType[] = ['110cc', '125cc', '150cc', '160cc', '190cc', '250cc', '300cc', '400cc', '600cc', '750cc', '1000cc', '1200cc+'];

const CAMINHAO_VEHICLE_TYPES = ['Semipesado', 'Pesado', 'Extra-pesado', 'Chassi-cabine', 'Cavalo Mecânico', 'Qualquer Um(a)'];
const CAMINHAO_TRANSMISSION_TYPES = ['Manual', 'Automatizada / Automática', 'Qualquer Um(a)'];
const CAMINHAO_ENGINE_TYPES = ['4 Cilindros', '6 Cilindros', 'Até 300 cv', '300 cv a 400 cv', '400 cv a 500 cv', 'Acima de 500 cv', 'Qualquer Um(a)'];

const BRAND_MAP: Record<string, string> = {
    'VW': 'Volkswagen', 'VOLKSWAGEN': 'Volkswagen',
    'CHEVROLET': 'Chevrolet', 'GM': 'Chevrolet',
    'FIAT': 'Fiat', 'FORD': 'Ford', 'TOYOTA': 'Toyota',
    'HONDA': 'Honda', 'HYUNDAI': 'Hyundai', 'RENAULT': 'Renault',
    'PEUGEOT': 'Peugeot', 'CITROEN': 'Citroën', 'CITROËN': 'Citroën',
    'NISSAN': 'Nissan', 'MITSUBISHI': 'Mitsubishi', 'JEEP': 'Jeep',
    'BMW': 'BMW', 'MERCEDES': 'Mercedes-Benz', 'MERCEDES-BENZ': 'Mercedes-Benz',
    'AUDI': 'Audi', 'KIA': 'Kia', 'LAND ROVER': 'Land Rover',
    'PORSCHE': 'Porsche', 'SUBARU': 'Subaru', 'SUZUKI': 'Suzuki',
    'VOLVO': 'Volvo', 'DODGE': 'Dodge', 'BYD': 'BYD',
    'GWM': 'GWM', 'JAC': 'JAC', 'CHERY': 'Chery',
    'LEXUS': 'Lexus', 'TROLLER': 'Troller',
};

function normalizeBrand(apiMarca: string): string {
    const upper = apiMarca.toUpperCase().trim();
    if (BRAND_MAP[upper]) return BRAND_MAP[upper];
    return apiMarca.charAt(0).toUpperCase() + apiMarca.slice(1).toLowerCase();
}

const LeadForm: React.FC<LeadFormProps> = ({ initialData, onSave, isEditing = false }) => {
    const navigate = useNavigate();
    const { vehicles, motorcycles, profile } = useData();

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
            interesse_caminhao: false,
            tipos_veiculo: [] as VehicleType[],
            tipos_moto: [] as VehicleType[],
            tipos_caminhao: [] as string[],
            carro_valor_min: 0,
            carro_valor_max: 0,
            carro_transmissao: [] as TransmissionType[],
            carro_motorizacao: [] as EngineType[],
            moto_valor_min: 0,
            moto_valor_max: 0,
            moto_transmissao: [] as TransmissionType[],
            moto_motorizacao: [] as EngineType[],
            caminhao_valor_min: 0,
            caminhao_valor_max: 0,
            caminhao_transmissao: [] as TransmissionType[],
            caminhao_motorizacao: [] as string[],
            marcas: [] as string[],
            modelos: [] as string[],
            marcas_moto: [] as string[],
            modelos_moto: [] as string[],
            marcas_caminhao: [] as string[],
            modelos_caminhao: [] as string[],
            observacoes_adicionais: '',
            possui_entrada: false,
            valor_entrada: 0,
            possui_troca: false,
            veiculo_troca: '',
            troca_data: {
                placa: '',
                categoria: 'carro',
                marca: '',
                modelo: '',
                ano: undefined,
                cor: '',
                quilometragem: undefined,
                valor_fipe: undefined,
                situacao_financeira: 'Quitado',
                valor_quitacao: undefined,
                observacoes: ''
            }
        } as any,
        tags: [] as string[]
    });

    const [plateLoading, setPlateLoading] = useState(false);
    const [plateError, setPlateError] = useState<string | null>(null);

    const carBrands = Array.from(new Set([
        ...Object.keys(carDatabase),
        ...vehicles.filter(v => v.vehicleCategory === 'carro' || !v.vehicleCategory).map(v => v.brand)
    ])).sort();

    const motoBrands = Array.from(new Set([
        ...Object.keys(motoDatabase),
        ...motorcycles.map(m => m.brand)
    ])).sort();

    const truckBrands = Array.from(new Set([
        ...Object.keys(truckDatabase),
        ...vehicles.filter(v => v.vehicleCategory === 'caminhao').map(v => v.brand)
    ])).sort();

    const getAvailableModels = (brands: string[], category: 'carro' | 'moto' | 'caminhao') => {
        const db = category === 'moto' ? motoDatabase : (category === 'caminhao' ? truckDatabase : carDatabase);
        const models = new Set<string>();
        
        if (brands.length > 0) {
            brands.forEach(brand => {
                if (db[brand]) {
                    if (category === 'moto') {
                        (db[brand] as any[]).forEach(m => models.add(m.name));
                    } else {
                        (db[brand] as string[]).forEach(m => models.add(m));
                    }
                }
            });
        } else {
            Object.values(db).forEach(list => {
                if (category === 'moto') {
                    (list as any[]).forEach(m => models.add(m.name));
                } else {
                    (list as string[]).forEach(m => models.add(m));
                }
            });
        }
        
        if (category === 'moto') {
            motorcycles
                .filter(m => brands.length === 0 || brands.includes(m.brand))
                .forEach(m => models.add(m.model));
        } else {
            vehicles
                .filter(v => (brands.length === 0 || brands.includes(v.brand)) && v.vehicleCategory === category)
                .forEach(v => models.add(v.model));
        }
            
        return Array.from(models).sort();
    };

    const carModels = getAvailableModels(leadForm.preferences.marcas || [], 'carro');
    const motoModels = getAvailableModels(leadForm.preferences.marcas_moto || [], 'moto');
    const truckModels = getAvailableModels(leadForm.preferences.marcas_caminhao || [], 'caminhao');

    useEffect(() => {
        if (initialData) {
            setLeadForm({
                ...initialData,
                preferences: {
                    ...initialData.preferences,
                    interesse_carro: initialData.preferences?.interesse_carro ?? (initialData.preferences?.marcas?.length > 0 || initialData.preferences?.tipos_veiculo?.some(t => CAR_VEHICLE_TYPES.includes(t))),
                    interesse_moto: initialData.preferences?.interesse_moto ?? (initialData.preferences?.marcas_moto?.length > 0 || initialData.preferences?.tipos_moto?.length > 0 || initialData.preferences?.tipos_veiculo?.some(t => MOTO_VEHICLE_TYPES.includes(t))),
                    interesse_caminhao: initialData.preferences?.interesse_caminhao ?? (initialData.preferences?.marcas_caminhao?.length > 0 || initialData.preferences?.tipos_caminhao?.length > 0),
                    carro_valor_min: initialData.preferences?.carro_valor_min || 0,
                    carro_valor_max: initialData.preferences?.carro_valor_max || 0,
                    carro_transmissao: initialData.preferences?.carro_transmissao || [],
                    carro_motorizacao: initialData.preferences?.carro_motorizacao || [],
                    moto_valor_min: initialData.preferences?.moto_valor_min || 0,
                    moto_valor_max: initialData.preferences?.moto_valor_max || 0,
                    moto_transmissao: initialData.preferences?.moto_transmissao || [],
                    moto_motorizacao: initialData.preferences?.moto_motorizacao || [],
                    caminhao_valor_min: initialData.preferences?.caminhao_valor_min || 0,
                    caminhao_valor_max: initialData.preferences?.caminhao_valor_max || 0,
                    caminhao_transmissao: initialData.preferences?.caminhao_transmissao || [],
                    caminhao_motorizacao: initialData.preferences?.caminhao_motorizacao || [],
                    marcas: initialData.preferences?.marcas || [],
                    modelos: initialData.preferences?.modelos || [],
                    marcas_moto: initialData.preferences?.marcas_moto || [],
                    modelos_moto: initialData.preferences?.modelos_moto || [],
                    marcas_caminhao: initialData.preferences?.marcas_caminhao || [],
                    modelos_caminhao: initialData.preferences?.modelos_caminhao || [],
                    tipos_veiculo: initialData.preferences?.tipos_veiculo || [],
                    tipos_moto: initialData.preferences?.tipos_moto || [],
                    tipos_caminhao: initialData.preferences?.tipos_caminhao || [],
                    observacoes_adicionais: initialData.preferences?.observacoes_adicionais || '',
                    possui_entrada: initialData.preferences?.possui_entrada || false,
                    valor_entrada: initialData.preferences?.valor_entrada || 0,
                    possui_troca: initialData.preferences?.possui_troca || false,
                    veiculo_troca: initialData.preferences?.veiculo_troca || '',
                    troca_data: initialData.preferences?.troca_data || {
                        placa: '',
                        categoria: 'carro',
                        marca: '',
                        modelo: '',
                        ano: undefined,
                        cor: '',
                        quilometragem: undefined,
                        valor_fipe: undefined,
                        situacao_financeira: 'Quitado',
                        valor_quitacao: undefined,
                        observacoes: ''
                    }
                }
            } as any);
        }
    }, [initialData]);

    const lookupTradeInPlate = async () => {
        const trocaData = leadForm.preferences.troca_data || {};
        const rawPlate = (trocaData.placa || '').replace(/[-\s]/g, '').toUpperCase();
        if (rawPlate.length < 7) {
            setPlateError('Digite uma placa válida (7 caracteres).');
            return;
        }
        setPlateLoading(true);
        setPlateError(null);
        try {
            const APIPLACAS_TOKEN = 'd7c110609b272abfbf7e3d1d97fcefdf';
            const res = await fetch(`https://wdapi2.com.br/consulta/${rawPlate}/${APIPLACAS_TOKEN}`);
            if (!res.ok) throw new Error('Erro na consulta.');
            const data = await res.json();

            const msg: string = data.mensagemRetorno || '';
            const isError = msg.toLowerCase().startsWith('erro') || msg.toLowerCase().includes('não encontrada') || msg.toLowerCase().includes('invalida');
            if (isError) {
                setPlateError(msg || 'Placa não encontrada.');
                return;
            }

            if (!data.MARCA && !data.marca) {
                setPlateError('Placa não encontrada na base de dados.');
                return;
            }

            const extra = data.extra || {};
            const brand = normalizeBrand(data.MARCA || data.marca || '');
            const model = data.MODELO || data.modelo || '';
            const year = parseInt(data.ano) || undefined;
            
            // Detect Category
            const apiSegment = (data.segmento || extra.segmento || '').toLowerCase();
            const apiSubSegment = (data.sub_segmento || extra.sub_segmento || '').toLowerCase();
            let categoria: 'carro' | 'moto' | 'caminhao' = 'carro';
            if (apiSegment.includes('moto') || apiSubSegment.includes('moto') || apiSegment.includes('ciclo')) {
                categoria = 'moto';
            } else if (apiSegment.includes('caminhão') || apiSegment.includes('caminhao') || apiSegment.includes('pesado')) {
                categoria = 'caminhao';
            }

            let valor_fipe = 0;
            if (data.fipe && data.fipe.dados && data.fipe.dados.length > 0) {
                const fipeItem = data.fipe.dados[0];
                if (fipeItem && fipeItem.texto_valor) {
                    const rawString = fipeItem.texto_valor.replace('R$', '').trim();
                    const numString = rawString.replace(/\./g, '').replace(',', '.');
                    valor_fipe = parseFloat(numString);
                }
            }

            setLeadForm(prev => {
                const prevTroca = prev.preferences.troca_data || {};
                const newVeiculoTroca = `${brand} ${model} ${year || ''}`.trim();
                return {
                    ...prev,
                    preferences: {
                        ...prev.preferences,
                        veiculo_troca: newVeiculoTroca,
                        troca_data: {
                            ...prevTroca,
                            marca: brand,
                            modelo: model,
                            ano: year,
                            cor: data.cor || extra.cor || prevTroca.cor || '',
                            categoria,
                            valor_fipe: valor_fipe > 0 ? valor_fipe : prevTroca.valor_fipe
                        }
                    }
                };
            });

        } catch (err: any) {
            setPlateError('Não foi possível consultar a placa. Verifique e tente novamente.');
        } finally {
            setPlateLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(leadForm);
    };

    const phases = [LeadPhase.NEW, LeadPhase.VISIT, LeadPhase.SIMULATION, LeadPhase.FOLLOW_UP, LeadPhase.STAND_BY, LeadPhase.COMPLETED, LeadPhase.DISQUALIFIED];

    return (
        <div className="max-w-[1600px] mx-auto w-full pb-32 animate-fadeUp">
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-6">
                    <button
                        type="button"
                        onClick={() => navigate('/leads')}
                        className="w-12 h-12 rounded-2xl bg-card border border-border/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all hover:bg-muted active:scale-95 shadow-sm"
                    >
                        <X size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground tracking-tight uppercase">
                            {isEditing ? 'Editar Lead' : 'Novo Lead'}
                        </h1>
                        <p className="text-xs font-bold text-muted-foreground mt-1 uppercase tracking-widest">
                            Preencha as informações do cliente
                        </p>
                    </div>
                </div>
            </div>

            <form id="lead-form" onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-card rounded-[2.5rem] p-10 border border-border/80 shadow-sm space-y-10">

                    <section className="space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-1.5 h-6 bg-primary rounded-full" />
                            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Informações Básicas</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Nome Completo</label>
                                <input
                                    required
                                    value={leadForm.name}
                                    onChange={e => setLeadForm({ ...leadForm, name: e.target.value })}
                                    className="w-full px-5 py-4 bg-muted/75 border border-border/85 rounded-2xl font-bold text-sm focus:bg-card focus:border-primary/40 outline-none focus:ring-4 focus:ring-primary/10 transition-all text-foreground"
                                    placeholder="Ex: João Silva"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">WhatsApp / Telefone</label>
                                <input
                                    required
                                    value={leadForm.phone}
                                    onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })}
                                    className="w-full px-5 py-4 bg-muted/75 border border-border/85 rounded-2xl font-bold text-sm focus:bg-card focus:border-primary/40 outline-none focus:ring-4 focus:ring-primary/10 transition-all text-foreground"
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">E-mail (Opcional)</label>
                            <input
                                type="email"
                                value={leadForm.email}
                                onChange={e => setLeadForm({ ...leadForm, email: e.target.value })}
                                className="w-full px-5 py-4 bg-muted/75 border border-border/85 rounded-2xl font-bold text-sm focus:bg-card focus:border-primary/40 outline-none focus:ring-4 focus:ring-primary/10 transition-all text-foreground"
                                placeholder="email@exemplo.com"
                            />
                        </div>
                    </section>

                    <section className="space-y-6 pt-6 border-t border-border/80">
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                                Fase do Funil de Vendas
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {phases.map(p => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setLeadForm({ ...leadForm, phase: p as LeadPhase })}
                                        className={`px-4 py-2.5 rounded-xl border font-bold text-[10px] uppercase tracking-widest transition-all ${leadForm.phase === p
                                            ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 active:scale-95'
                                            : 'bg-card text-muted-foreground border-border/80 hover:border-border hover:bg-muted'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="space-y-8 pt-6 border-t border-border/80">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-1.5 h-6 bg-primary rounded-full" />
                            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Qualificação e Origem</h3>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Temperatura do Lead</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[LeadTemperature.COLD, LeadTemperature.WARM, LeadTemperature.HOT].map(temp => (
                                    <button
                                        key={temp}
                                        type="button"
                                        onClick={() => setLeadForm({ ...leadForm, temperature: temp })}
                                        className={`py-4 px-2 rounded-2xl border font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${leadForm.temperature === temp
                                            ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 active:scale-95'
                                            : 'bg-card border-border/80 text-muted-foreground hover:border-border hover:bg-muted'
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
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Origem do Lead</label>
                            <select
                                value={leadForm.source}
                                onChange={e => setLeadForm({ ...leadForm, source: e.target.value })}
                                className="w-full px-5 py-4 bg-muted/75 border border-border/85 rounded-2xl font-bold text-sm focus:bg-card outline-none focus:ring-4 focus:ring-primary/10 transition-all text-foreground appearance-none"
                            >
                                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </section>

                    <section className="space-y-8 bg-muted/30 p-8 rounded-[40px] border border-border/80">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-primary rounded-full" />
                                <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Perfil de Interesse</h3>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, interesse_carro: !leadForm.preferences.interesse_carro } })}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all border ${leadForm.preferences.interesse_carro ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border/80 hover:bg-muted'}`}
                                >
                                    Carros
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, interesse_moto: !leadForm.preferences.interesse_moto } })}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all border ${leadForm.preferences.interesse_moto ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border/80 hover:bg-muted'}`}
                                >
                                    Motos
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, interesse_caminhao: !leadForm.preferences.interesse_caminhao } })}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all border ${leadForm.preferences.interesse_caminhao ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border/80 hover:bg-muted'}`}
                                >
                                    Caminhões
                                </button>
                            </div>
                        </div>

                        <div className="space-y-10">
                            {/* SEÇÃO CARROS */}
                            {leadForm.preferences.interesse_carro && (
                                <div className="space-y-6 p-6 bg-card rounded-3xl border border-border/80 animate-fadeIn">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Target size={14} className="text-primary" />
                                        <h4 className="text-[10px] font-bold text-foreground uppercase tracking-widest">Interesse em Carros</h4>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Tipos de Carro</label>
                                        <MultiSelect
                                            label="Selecione os tipos..."
                                            options={CAR_VEHICLE_TYPES}
                                            value={leadForm.preferences.tipos_veiculo || []}
                                            onChange={val => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, tipos_veiculo: val as any } })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Marcas de Carro</label>
                                            <TagInput
                                                label=""
                                                placeholder="Ex: Toyota, BMW..."
                                                value={leadForm.preferences.marcas || []}
                                                onChange={tags => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, marcas: tags } })}
                                                suggestions={carBrands}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Modelos de Carro</label>
                                            <TagInput
                                                label=""
                                                placeholder="Ex: Corolla, X1..."
                                                value={leadForm.preferences.modelos || []}
                                                onChange={tags => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, modelos: tags } })}
                                                suggestions={carModels}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border/80">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Valor Máximo (Carro)</label>
                                            <input
                                                type="text"
                                                value={formatCurrency(leadForm.preferences.carro_valor_max)}
                                                onChange={e => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, carro_valor_max: parseCurrency(e.target.value) } })}
                                                className="w-full px-5 py-4 bg-muted/75 border border-border/85 rounded-2xl font-bold text-sm focus:bg-card focus:border-primary/40 outline-none transition-all text-foreground"
                                                placeholder="R$ 0,00"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Câmbio</label>
                                            <MultiSelect
                                                label="Câmbio"
                                                options={['Manual', 'Automático', 'Qualquer Um(a)']}
                                                value={leadForm.preferences.carro_transmissao || []}
                                                onChange={val => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, carro_transmissao: val as any } })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Motorização</label>
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
                                <div className="space-y-6 p-6 bg-card rounded-3xl border border-border/80 animate-fadeIn">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Target size={14} className="text-indigo-500" />
                                        <h4 className="text-[10px] font-bold text-foreground uppercase tracking-widest">Interesse em Motos</h4>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Tipos de Moto</label>
                                        <MultiSelect
                                            label="Selecione os tipos..."
                                            options={MOTO_VEHICLE_TYPES}
                                            value={leadForm.preferences.tipos_moto || []}
                                            onChange={val => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, tipos_moto: val as any } })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Marcas de Moto</label>
                                            <TagInput
                                                label=""
                                                placeholder="Ex: Honda, Yamaha..."
                                                value={leadForm.preferences.marcas_moto || []}
                                                onChange={tags => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, marcas_moto: tags } })}
                                                suggestions={motoBrands}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Modelos de Moto</label>
                                            <TagInput
                                                label=""
                                                placeholder="Ex: CB 500, MT-07..."
                                                value={leadForm.preferences.modelos_moto || []}
                                                onChange={tags => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, modelos_moto: tags } })}
                                                suggestions={motoModels}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border/80">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Valor Máximo (Moto)</label>
                                            <input
                                                type="text"
                                                value={formatCurrency(leadForm.preferences.moto_valor_max)}
                                                onChange={e => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, moto_valor_max: parseCurrency(e.target.value) } })}
                                                className="w-full px-5 py-4 bg-muted/75 border border-border/85 rounded-2xl font-bold text-sm focus:bg-card focus:border-indigo-500/30 outline-none transition-all text-foreground"
                                                placeholder="R$ 0,00"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Câmbio</label>
                                            <MultiSelect
                                                label="Câmbio"
                                                options={['Manual', 'Automático', 'Qualquer Um(a)']}
                                                value={leadForm.preferences.moto_transmissao || []}
                                                onChange={val => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, moto_transmissao: val as any } })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Motorização</label>
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

                            {/* SEÇÃO CAMINHÕES */}
                            {leadForm.preferences.interesse_caminhao && (
                                <div className="space-y-6 p-6 bg-card rounded-3xl border border-border/80 animate-fadeIn">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Target size={14} className="text-amber-500" />
                                        <h4 className="text-[10px] font-bold text-foreground uppercase tracking-widest">Interesse em Caminhões</h4>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Tipos de Caminhão</label>
                                        <MultiSelect
                                            label="Selecione os tipos..."
                                            options={CAMINHAO_VEHICLE_TYPES}
                                            value={leadForm.preferences.tipos_caminhao || []}
                                            onChange={val => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, tipos_caminhao: val as any } })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Marcas de Caminhão</label>
                                            <TagInput
                                                label=""
                                                placeholder="Ex: Volvo, Scania..."
                                                value={leadForm.preferences.marcas_caminhao || []}
                                                onChange={tags => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, marcas_caminhao: tags } })}
                                                suggestions={truckBrands}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Modelos de Caminhão</label>
                                            <TagInput
                                                label=""
                                                placeholder="Ex: FH 540, R 450..."
                                                value={leadForm.preferences.modelos_caminhao || []}
                                                onChange={tags => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, modelos_caminhao: tags } })}
                                                suggestions={truckModels}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border/80">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Valor Máximo (Caminhão)</label>
                                            <input
                                                type="text"
                                                value={formatCurrency(leadForm.preferences.caminhao_valor_max)}
                                                onChange={e => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, caminhao_valor_max: parseCurrency(e.target.value) } })}
                                                className="w-full px-5 py-4 bg-muted/75 border border-border/85 rounded-2xl font-bold text-sm focus:bg-card focus:border-amber-500/30 outline-none transition-all text-foreground"
                                                placeholder="R$ 0,00"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Câmbio</label>
                                            <MultiSelect
                                                label="Câmbio"
                                                options={CAMINHAO_TRANSMISSION_TYPES}
                                                value={leadForm.preferences.caminhao_transmissao || []}
                                                onChange={val => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, caminhao_transmissao: val as any } })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Motorização</label>
                                            <MultiSelect
                                                label="Motorização"
                                                options={CAMINHAO_ENGINE_TYPES}
                                                value={leadForm.preferences.caminhao_motorizacao || []}
                                                onChange={val => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, caminhao_motorizacao: val as any } })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Configurações Gerais */}
                            <div className="space-y-6 pt-6 border-t border-border/80">
                                <div className="grid grid-cols-1 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Etiquetas (Tags)</label>
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
                            <div className="w-1.5 h-6 bg-primary rounded-full" />
                            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Informações Complementares</h3>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Observações / Notas</label>
                            <textarea
                                value={leadForm.preferences.observacoes_adicionais}
                                onChange={e => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, observacoes_adicionais: e.target.value } })}
                                className="w-full px-5 py-4 bg-muted/75 border border-border/85 rounded-2xl font-bold text-sm focus:bg-card outline-none focus:ring-4 focus:ring-primary/10 transition-all min-h-[120px] resize-none text-foreground"
                                placeholder="Alguma nota importante sobre o cliente ou negociação..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 bg-muted/50 p-6 rounded-2xl border border-border/80 cursor-pointer transition-all hover:bg-card" onClick={() => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, possui_entrada: !leadForm.preferences.possui_entrada } })}>
                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${leadForm.preferences.possui_entrada ? 'bg-primary border-primary' : 'bg-card border-border/80'}`}>
                                        {leadForm.preferences.possui_entrada && <Check size={14} className="text-primary-foreground" strokeWidth={4} />}
                                    </div>
                                    <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">Possui Entrada</span>
                                </div>
                                {leadForm.preferences.possui_entrada && (
                                    <div className="animate-fadeInLeft">
                                        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-1 block mb-1.5">Valor da Entrada (R$)</label>
                                        <input
                                            type="text"
                                            value={formatCurrency(leadForm.preferences.valor_entrada)}
                                            onChange={e => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, valor_entrada: parseCurrency(e.target.value) } })}
                                            className="w-full px-5 py-4 bg-card border border-border/85 rounded-2xl font-bold text-sm focus:border-primary/40 outline-none focus:ring-4 focus:ring-primary/10 transition-all text-foreground"
                                            placeholder="Ex: 50.000"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4 col-span-1 md:col-span-2">
                                <div className="flex items-center gap-4 bg-muted/50 p-6 rounded-2xl border border-border/80 cursor-pointer transition-all hover:bg-card" onClick={() => setLeadForm({ ...leadForm, preferences: { ...leadForm.preferences, possui_troca: !leadForm.preferences.possui_troca } })}>
                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${leadForm.preferences.possui_troca ? 'bg-primary border-primary' : 'bg-card border-border/80'}`}>
                                        {leadForm.preferences.possui_troca && <Check size={14} className="text-primary-foreground" strokeWidth={4} />}
                                    </div>
                                    <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">Possui Troca</span>
                                </div>
                                {leadForm.preferences.possui_troca && (
                                    <div className="space-y-4 p-6 bg-card rounded-3xl border border-border/80 animate-fadeInLeft">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Tag size={12} className="text-primary" />
                                            <span className="text-[10px] font-bold text-foreground uppercase tracking-widest">Detalhes do Veículo de Troca</span>
                                        </div>

                                        {/* Placa & Categoria */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-1 block">Placa</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={leadForm.preferences.troca_data?.placa || ''}
                                                        onChange={e => setLeadForm({
                                                            ...leadForm,
                                                            preferences: {
                                                                ...leadForm.preferences,
                                                                troca_data: {
                                                                    ...(leadForm.preferences.troca_data || {}),
                                                                    placa: e.target.value.toUpperCase()
                                                                }
                                                            }
                                                        })}
                                                        placeholder="AAA-0000"
                                                        className="flex-1 px-4 py-3 bg-muted/75 border border-border/85 rounded-xl font-bold text-xs uppercase focus:bg-card focus:border-primary/40 outline-none transition-all text-foreground"
                                                    />
                                                    <button
                                                        type="button"
                                                        disabled={plateLoading}
                                                        onClick={lookupTradeInPlate}
                                                        className="px-4 py-3 bg-primary text-primary-foreground rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
                                                    >
                                                        {plateLoading ? 'Buscando...' : 'Buscar'}
                                                    </button>
                                                </div>
                                                {plateError && <span className="text-[9px] text-red-500 font-bold block mt-1 px-1">{plateError}</span>}
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-1 block">Categoria</label>
                                                <select
                                                    value={leadForm.preferences.troca_data?.categoria || 'carro'}
                                                    onChange={e => setLeadForm({
                                                        ...leadForm,
                                                        preferences: {
                                                            ...leadForm.preferences,
                                                            troca_data: {
                                                                ...(leadForm.preferences.troca_data || {}),
                                                                categoria: e.target.value as any
                                                            }
                                                        }
                                                    })}
                                                    className="w-full px-4 py-3 bg-muted/75 border border-border/85 rounded-xl font-bold text-xs focus:bg-card focus:border-primary/40 outline-none transition-all text-foreground"
                                                >
                                                    <option value="carro">Carro</option>
                                                    <option value="moto">Moto</option>
                                                    <option value="caminhao">Caminhão</option>
                                                </select>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-1 block">Valor FIPE (R$)</label>
                                                <input
                                                    type="text"
                                                    value={formatCurrency(leadForm.preferences.troca_data?.valor_fipe || 0)}
                                                    onChange={e => setLeadForm({
                                                        ...leadForm,
                                                        preferences: {
                                                            ...leadForm.preferences,
                                                            troca_data: {
                                                                ...(leadForm.preferences.troca_data || {}),
                                                                valor_fipe: parseCurrency(e.target.value)
                                                            }
                                                        }
                                                    })}
                                                    placeholder="R$ 0,00"
                                                    className="w-full px-4 py-3 bg-muted/75 border border-border/85 rounded-xl font-bold text-xs focus:bg-card focus:border-primary/40 outline-none transition-all text-foreground"
                                                />
                                            </div>
                                        </div>

                                        {/* Marca, Modelo, Ano & Cor */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-1 block">Marca</label>
                                                <input
                                                    type="text"
                                                    value={leadForm.preferences.troca_data?.marca || ''}
                                                    onChange={e => {
                                                        const m = e.target.value;
                                                        const currentModel = leadForm.preferences.troca_data?.modelo || '';
                                                        const currentYear = leadForm.preferences.troca_data?.ano || '';
                                                        setLeadForm({
                                                            ...leadForm,
                                                            preferences: {
                                                                ...leadForm.preferences,
                                                                veiculo_troca: `${m} ${currentModel} ${currentYear}`.trim(),
                                                                troca_data: {
                                                                    ...(leadForm.preferences.troca_data || {}),
                                                                    marca: m
                                                                }
                                                            }
                                                        });
                                                    }}
                                                    placeholder="Ex: Fiat"
                                                    className="w-full px-4 py-3 bg-muted/75 border border-border/85 rounded-xl font-bold text-xs focus:bg-card focus:border-primary/40 outline-none transition-all text-foreground"
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-1 block">Modelo</label>
                                                <input
                                                    type="text"
                                                    value={leadForm.preferences.troca_data?.modelo || ''}
                                                    onChange={e => {
                                                        const mod = e.target.value;
                                                        const currentBrand = leadForm.preferences.troca_data?.marca || '';
                                                        const currentYear = leadForm.preferences.troca_data?.ano || '';
                                                        setLeadForm({
                                                            ...leadForm,
                                                            preferences: {
                                                                ...leadForm.preferences,
                                                                veiculo_troca: `${currentBrand} ${mod} ${currentYear}`.trim(),
                                                                troca_data: {
                                                                    ...(leadForm.preferences.troca_data || {}),
                                                                    modelo: mod
                                                                }
                                                            }
                                                        });
                                                    }}
                                                    placeholder="Ex: Palio"
                                                    className="w-full px-4 py-3 bg-muted/75 border border-border/85 rounded-xl font-bold text-xs focus:bg-card focus:border-primary/40 outline-none transition-all text-foreground"
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-1 block">Ano</label>
                                                <input
                                                    type="number"
                                                    value={leadForm.preferences.troca_data?.ano || ''}
                                                    onChange={e => {
                                                        const val = e.target.value ? parseInt(e.target.value) : undefined;
                                                        const currentBrand = leadForm.preferences.troca_data?.marca || '';
                                                        const currentModel = leadForm.preferences.troca_data?.modelo || '';
                                                        setLeadForm({
                                                            ...leadForm,
                                                            preferences: {
                                                                ...leadForm.preferences,
                                                                veiculo_troca: `${currentBrand} ${currentModel} ${val || ''}`.trim(),
                                                                troca_data: {
                                                                    ...(leadForm.preferences.troca_data || {}),
                                                                    ano: val
                                                                }
                                                            }
                                                        });
                                                    }}
                                                    placeholder="Ex: 2018"
                                                    className="w-full px-4 py-3 bg-muted/75 border border-border/85 rounded-xl font-bold text-xs focus:bg-card focus:border-primary/40 outline-none transition-all text-foreground"
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-1 block">Cor</label>
                                                <input
                                                    type="text"
                                                    value={leadForm.preferences.troca_data?.cor || ''}
                                                    onChange={e => setLeadForm({
                                                        ...leadForm,
                                                        preferences: {
                                                            ...leadForm.preferences,
                                                            troca_data: {
                                                                ...(leadForm.preferences.troca_data || {}),
                                                                cor: e.target.value
                                                            }
                                                        }
                                                    })}
                                                    placeholder="Ex: Preto"
                                                    className="w-full px-4 py-3 bg-muted/75 border border-border/85 rounded-xl font-bold text-xs focus:bg-card focus:border-primary/40 outline-none transition-all text-foreground"
                                                />
                                            </div>
                                        </div>

                                        {/* KM & Situação Financeira */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-border/80">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-1 block">Quilometragem (KM)</label>
                                                <input
                                                    type="number"
                                                    value={leadForm.preferences.troca_data?.quilometragem || ''}
                                                    onChange={e => setLeadForm({
                                                        ...leadForm,
                                                        preferences: {
                                                            ...leadForm.preferences,
                                                            troca_data: {
                                                                ...(leadForm.preferences.troca_data || {}),
                                                                quilometragem: e.target.value ? parseInt(e.target.value) : undefined
                                                            }
                                                        }
                                                    })}
                                                    placeholder="Ex: 85000"
                                                    className="w-full px-4 py-3 bg-muted/75 border border-border/85 rounded-xl font-bold text-xs focus:bg-card focus:border-primary/40 outline-none transition-all text-foreground"
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-1 block">Situação Financeira</label>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setLeadForm({
                                                            ...leadForm,
                                                            preferences: {
                                                                ...leadForm.preferences,
                                                                troca_data: {
                                                                    ...(leadForm.preferences.troca_data || {}),
                                                                    situacao_financeira: 'Quitado'
                                                                }
                                                            }
                                                        })}
                                                        className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase transition-all border ${
                                                            (leadForm.preferences.troca_data?.situacao_financeira || 'Quitado') === 'Quitado'
                                                                ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20'
                                                                : 'bg-muted/70 text-muted-foreground border-border/80 hover:bg-muted'
                                                        }`}
                                                    >
                                                        Quitado
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setLeadForm({
                                                            ...leadForm,
                                                            preferences: {
                                                                ...leadForm.preferences,
                                                                troca_data: {
                                                                    ...(leadForm.preferences.troca_data || {}),
                                                                    situacao_financeira: 'Financiado'
                                                                }
                                                            }
                                                        })}
                                                        className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase transition-all border ${
                                                            leadForm.preferences.troca_data?.situacao_financeira === 'Financiado'
                                                                ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20'
                                                                : 'bg-muted/70 text-muted-foreground border-border/80 hover:bg-muted'
                                                        }`}
                                                    >
                                                        Financiado
                                                    </button>
                                                </div>
                                            </div>

                                            {leadForm.preferences.troca_data?.situacao_financeira === 'Financiado' && (
                                                <div className="space-y-1.5 animate-fadeInLeft">
                                                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-1 block">Valor de Quitação (R$)</label>
                                                    <input
                                                        type="text"
                                                        value={formatCurrency(leadForm.preferences.troca_data?.valor_quitacao || 0)}
                                                        onChange={e => setLeadForm({
                                                            ...leadForm,
                                                            preferences: {
                                                                ...leadForm.preferences,
                                                                troca_data: {
                                                                    ...(leadForm.preferences.troca_data || {}),
                                                                    valor_quitacao: parseCurrency(e.target.value)
                                                                }
                                                            }
                                                        })}
                                                        placeholder="R$ 0,00"
                                                        className="w-full px-4 py-3 bg-muted/75 border border-border/85 rounded-xl font-bold text-xs focus:bg-card focus:border-primary/40 outline-none transition-all text-foreground"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Observações / Notas */}
                                        <div className="space-y-1.5 pt-3 border-t border-border/80">
                                            <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-1 block">Observações do Veículo de Troca</label>
                                            <textarea
                                                value={leadForm.preferences.troca_data?.observacoes || ''}
                                                onChange={e => setLeadForm({
                                                    ...leadForm,
                                                    preferences: {
                                                        ...leadForm.preferences,
                                                        troca_data: {
                                                            ...(leadForm.preferences.troca_data || {}),
                                                            observacoes: e.target.value
                                                        }
                                                    }
                                                })}
                                                placeholder="Detalhe o estado de conservação, débitos, se tem leilão, retoques, etc..."
                                                className="w-full px-4 py-3 bg-muted/75 border border-border/85 rounded-xl font-bold text-xs focus:bg-card focus:border-primary/40 outline-none transition-all min-h-[70px] resize-none text-foreground"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </form>

            {/* Sticky Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border/80 px-6 py-4 shadow-xl">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
                    <div className="hidden sm:block">
                        <p className="text-xs font-bold text-muted-foreground">
                            {isEditing ? 'Editando lead' : 'Novo cadastro'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 ml-auto">
                        <button
                            type="button"
                            onClick={() => navigate('/leads')}
                            className="px-6 py-3.5 text-muted-foreground text-[10px] font-bold uppercase tracking-widest hover:text-foreground transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="lead-form"
                            className="px-8 py-3.5 bg-primary text-primary-foreground rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 transition-all shadow-md shadow-primary/20 active:scale-95"
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
