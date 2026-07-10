import React, { useState, useEffect, useRef } from 'react';
import PageContainer from './ui/PageContainer';
import { useNavigate } from 'react-router-dom';
import {
    X, Upload, Loader2, Check, Plus, DollarSign, Calendar, Gauge, Zap,
    ArrowLeft, Search, AlertCircle, Hash, Shield, ImagePlus, FileText,
    Target, Settings, HelpCircle, Sparkles, PlusCircle, Trash2
} from 'lucide-react';
import { Vehicle, VehicleType, TransmissionType, EngineType, FuelType, MotorcycleCategory, MotoStartType, MotoBrakeType, MotoFuelSystem, MotoCooling } from '../types';
import { Switch } from './ui/switch';
import { supabase } from '../lib/supabaseClient';
import { resizeImage } from '../utils/imageProcessor';
import { carDatabase } from '../data/carDb';
import AutocompleteInput from './ui/AutocompleteInput';
import { formatCurrency, parseCurrency, formatKM, parseKM } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';
import { generateSeoDetails } from '../services/geminiService';

interface VehicleFormProps {
    initialData?: Vehicle;
    onSave: (vehicle: Omit<Vehicle, 'id'> | Vehicle) => void;
    isEditing?: boolean;
}

const VEHICLE_TYPES: VehicleType[] = ['SUV', 'Sedan', 'Hatch', 'Picape', 'Esportivo', 'Conversível', 'Van'];
const TRANSMISSION_TYPES: TransmissionType[] = ['Manual', 'Automático', 'Automatizado', 'CVT', 'Semi-Automático'];
const ENGINE_TYPES: EngineType[] = ['1.0', '1.3', '1.4', '1.5', '1.6', '1.8', '2.0', '2.0+', 'Elétrico', 'Híbrido'];
const FUEL_TYPES: FuelType[] = ['Gasolina', 'Álcool', 'Flex', 'Diesel', 'GNV', 'Elétrico', 'Híbrido'];
const DOOR_OPTIONS: (2 | 4)[] = [2, 4];

const MOTORCYCLE_CATEGORIES: MotorcycleCategory[] = ['Naked', 'Sport', 'Trail', 'Custom', 'Scooter', 'Touring', 'Elétrica', 'Street'];
const MOTO_START_TYPES: MotoStartType[] = ['Elétrica', 'Pedal', 'Ambos'];
const MOTO_BRAKE_TYPES: MotoBrakeType[] = ['Disco', 'Tambor', 'ABS', 'CBS', 'Disco + ABS', 'Disco + CBS'];
const MOTO_FUEL_SYSTEMS: MotoFuelSystem[] = ['Carburador', 'Injeção Eletrônica'];
const MOTO_COOLING_OPTIONS: MotoCooling[] = ['Ar', 'Líquida', 'Ar e Óleo'];

const CATEGORIZED_OPTIONS = [
    { label: 'Segurança', color: 'bg-red-500', items: ['Alarme', 'Airbag', 'Freios ABS', 'Câmera de Ré', 'Sensor de Estacionamento', 'Controle de Estabilidade', 'Controle de Tração'] },
    { label: 'Conforto', color: 'bg-amber-500', items: ['Ar Condicionado', 'Direção Hidráulica', 'Vidros Elétricos', 'Travas Elétricas', 'Som Multimídia', 'Bancos de Couro', 'Teto Solar', 'Piloto Automático', 'Computador de Bordo', 'Chave Presencial'] },
    { label: 'Exterior', color: 'bg-sky-500', items: ['Rodas de Liga Leve', 'Tração 4x4', 'Farol de Neblina'] }
] as const;

const APIPLACAS_TOKEN = 'd7c110609b272abfbf7e3d1d97fcefdf';

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
    const dbKey = Object.keys(carDatabase).find(k => k.toUpperCase() === upper);
    return dbKey || (apiMarca.charAt(0).toUpperCase() + apiMarca.slice(1).toLowerCase());
}

const VehicleForm: React.FC<VehicleFormProps> = ({ initialData, onSave, isEditing = false }) => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const logoInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    // Steps & Tabs States
    const [step, setStep] = useState<'plate' | 'category_select' | 'form'>(isEditing ? 'form' : 'plate');
    const [activeTab, setActiveTab] = useState<'dados' | 'seo' | 'custos' | 'compra_venda'>('dados');
    
    // UI Loaders
    const [uploading, setUploading] = useState(false);
    const [galleryUploading, setGalleryUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [aiGenerating, setAiGenerating] = useState(false);
    const [plateError, setPlateError] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Custom option inputs
    const [customOption, setCustomOption] = useState('');
    const [newCostDesc, setNewCostDesc] = useState('');
    const [newCostAmount, setNewCostAmount] = useState(0);

    const [formData, setFormData] = useState<Omit<Vehicle, 'id' | 'status'>>({
        brand: '', model: '', year: new Date().getFullYear(), modelYear: new Date().getFullYear(), plate: '', fipePrice: 0, price: 0, type: 'Sedan',
        transmission: 'Automático', engine: '1.6', fuelType: 'Flex', doors: 4, mileage: 0, color: '',
        isSingleOwner: false, isServiceHistoryComplete: false, isIpvaPaid: true, hasWarranty: false,
        hasSpareKey: false, hasOwnerManual: false,
        shortDescription: '', description: '',
        optionals: [], imageUrl: '', galleryImages: [],

        // Unified & New fields
        vehicleCategory: 'carro',
        motoCategory: 'Street',
        startType: 'Elétrica',
        brakeType: 'ABS',
        fuelSystem: 'Injeção Eletrônica',
        cooling: 'Ar',
        seoHeadline: '',
        seoDescription: '',
        operationalCosts: [],
        purchasePrice: 0,
        suggestedSalePrice: 0
    });

    useEffect(() => {
        if (isEditing && initialData) {
            const { id, status, saleDetails, ...rest } = initialData;
            setFormData({
                ...rest,
                galleryImages: rest.galleryImages || [],
                operationalCosts: rest.operationalCosts || [],
                vehicleCategory: rest.vehicleCategory || 'carro'
            });
        } else {
            const savedDraft = localStorage.getItem('vehicle_form_draft_new');
            if (savedDraft) {
                try {
                    const parsed = JSON.parse(savedDraft);
                    setFormData(prev => ({ ...prev, ...parsed }));
                } catch (e) {
                    console.error("Error loading draft:", e);
                }
            }
        }
    }, [initialData?.id, isEditing]);

    useEffect(() => {
        if (isEditing) return;
        localStorage.setItem('vehicle_form_draft_new', JSON.stringify(formData));
    }, [formData, isEditing]);

    const clearDraft = () => {
        if (isEditing) return;
        localStorage.removeItem('vehicle_form_draft_new');
    };

    // Plate lookup
    const lookupPlate = async () => {
        const rawPlate = formData.plate.replace(/[-\s]/g, '').toUpperCase();
        if (rawPlate.length < 7) {
            setPlateError('Digite uma placa válida (7 caracteres).');
            return;
        }
        setLookupLoading(true);
        setPlateError(null);
        try {
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
            const year = parseInt(data.ano) || formData.year;
            
            // Detect Category
            const apiSegment = (data.segmento || extra.segmento || '').toLowerCase();
            const apiSubSegment = (data.sub_segmento || extra.sub_segmento || '').toLowerCase();
            let vehicleCategory: 'carro' | 'moto' | 'caminhao' | 'outros' = 'carro';
            if (apiSegment.includes('moto') || apiSubSegment.includes('moto') || apiSegment.includes('ciclo')) {
                vehicleCategory = 'moto';
            } else if (apiSegment.includes('caminhão') || apiSegment.includes('caminhao') || apiSegment.includes('pesado')) {
                vehicleCategory = 'caminhao';
            }

            let fipePrice = 0;
            if (data.fipe && data.fipe.dados && data.fipe.dados.length > 0) {
                const fipeItem = data.fipe.dados[0];
                if (fipeItem && fipeItem.texto_valor) {
                    const rawString = fipeItem.texto_valor.replace('R$', '').trim();
                    const numString = rawString.replace(/\./g, '').replace(',', '.');
                    fipePrice = parseFloat(numString);
                }
            }

            setFormData(prev => ({
                ...prev,
                brand,
                model,
                year,
                modelYear: parseInt(data.anoModelo) || year,
                color: data.cor || extra.cor || prev.color,
                fipePrice: fipePrice > 0 ? fipePrice : prev.fipePrice,
                vehicleCategory
            }));

            setStep('form');
        } catch (err: any) {
            setPlateError('Não foi possível consultar a placa. Verifique e tente novamente.');
        } finally {
            setLookupLoading(false);
        }
    };

    const handlePlateKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            lookupPlate();
        }
    };

    // Images upload
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const resizedBlob = await resizeImage(file, 1080, 1080);
            const resizedFile = new File([resizedBlob], 'main.webp', { type: 'image/webp' });
            const fileName = `main-${Date.now()}.webp`;

            const { error: uploadError } = await supabase.storage
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

    const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setGalleryUploading(true);
        try {
            const urls: string[] = [];
            for (const file of Array.from(files)) {
                const resizedBlob = await resizeImage(file, 1080, 1080);
                const resizedFile = new File([resizedBlob], 'gallery.webp', { type: 'image/webp' });
                const fileName = `gallery/${Date.now()}-${Math.random().toString(36).substring(2)}.webp`;

                const { error: uploadError } = await supabase.storage
                    .from('vehicles')
                    .upload(fileName, resizedFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('vehicles')
                    .getPublicUrl(fileName);

                urls.push(publicUrl);
            }
            setFormData(prev => ({
                ...prev,
                galleryImages: [...(prev.galleryImages || []), ...urls],
            }));
        } catch (error: any) {
            alert('Erro ao fazer upload da galeria: ' + error.message);
        } finally {
            setGalleryUploading(false);
        }
    };

    const removeGalleryImage = (url: string) => {
        setFormData(prev => ({
            ...prev,
            galleryImages: (prev.galleryImages || []).filter(u => u !== url),
        }));
    };

    // AI Generation
    const handleGenerateAI = async () => {
        setAiGenerating(true);
        try {
            const response = await generateSeoDetails(formData);
            setFormData(prev => ({
                ...prev,
                seoHeadline: response.seoHeadline || prev.seoHeadline,
                seoDescription: response.seoDescription || prev.seoDescription,
                suggestedSalePrice: response.suggestedSalePrice || prev.suggestedSalePrice
            }));
            showToast('success', 'SEO e precificação gerados com sucesso pela IA!');
        } catch (err) {
            showToast('error', 'Falha ao conectar com a IA do Gemini.');
        } finally {
            setAiGenerating(false);
        }
    };

    // Financial calculations
    const totalCosts = (formData.operationalCosts || []).reduce((acc, item) => acc + item.amount, 0);
    const calculatedSuggestedPrice = (formData.purchasePrice || 0) + totalCosts + ((formData.purchasePrice || 0) + totalCosts) * 0.20;

    const addOperationalCost = (desc: string, amt: number) => {
        if (!desc.trim() || amt <= 0) return;
        const newItem = {
            id: Math.random().toString(36).substring(2),
            description: desc,
            amount: amt,
            date: new Date().toISOString().split('T')[0]
        };
        setFormData(prev => ({
            ...prev,
            operationalCosts: [...(prev.operationalCosts || []), newItem]
        }));
        setNewCostDesc('');
        setNewCostAmount(0);
    };

    const removeOperationalCost = (id: string) => {
        setFormData(prev => ({
            ...prev,
            operationalCosts: (prev.operationalCosts || []).filter(item => item.id !== id)
        }));
    };

    const getFieldClassName = (field: string, base: string) => `${base} ${errors[field] ? 'border-red-300 bg-red-50/60 focus:ring-red-500/10' : ''}`;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const nextErrors: Record<string, string> = {};

        if (!formData.brand.trim()) nextErrors.brand = 'Informe a marca.';
        if (!formData.model.trim()) nextErrors.model = 'Informe o modelo.';
        if (!formData.year) nextErrors.year = 'Informe o ano de fabricação.';
        if (!formData.price) nextErrors.price = 'Informe o preço de venda.';
        
        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            showToast('error', 'Por favor, preencha os dados básicos obrigatórios.');
            setActiveTab('dados');
            return;
        }

        setSubmitting(true);
        try {
            if (isEditing && initialData) {
                await onSave({ ...initialData, ...formData });
            } else {
                await onSave({ ...formData, status: 'available' });
            }
            clearDraft();
            showToast('success', isEditing ? 'Veículo atualizado com sucesso!' : 'Veículo cadastrado com sucesso!');
            navigate('/inventory');
        } finally {
            setSubmitting(false);
        }
    };

    // ── STEP 1: License Plate Lookup ──────────────────────────────────────────
    if (step === 'plate') {
        return (
            <PageContainer className="flex items-center justify-center min-h-[75vh] animate-fadeUp">
                <div className="bg-slate-900 text-white rounded-[3rem] p-10 md:p-16 max-w-xl w-full border-b-8 border-slate-950 shadow-2xl relative overflow-hidden text-center space-y-8">
                    <div className="absolute top-0 right-0 p-10 opacity-5">
                        <Target size={180} />
                    </div>

                    <div className="relative z-10 space-y-6">
                        <div className="w-16 h-16 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center border border-violet-500/20 mx-auto">
                            <Hash size={32} />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black tracking-tight">Cadastro de Veículo</h2>
                            <p className="text-slate-400 text-sm font-medium">Informe a placa para preencher os dados técnicos automaticamente.</p>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="text"
                                value={formData.plate}
                                onChange={e => {
                                    setPlateError(null);
                                    setFormData({ ...formData, plate: e.target.value.toUpperCase() });
                                }}
                                onKeyDown={handlePlateKeyDown}
                                placeholder="ABC1234"
                                maxLength={8}
                                className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-center text-2xl font-black tracking-widest text-white placeholder-slate-600 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all uppercase"
                            />
                            {plateError && (
                                <p className="text-xs font-bold text-red-400 flex items-center justify-center gap-1.5 pt-1">
                                    <AlertCircle size={13} /> {plateError}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                type="button"
                                onClick={lookupPlate}
                                disabled={lookupLoading}
                                className="flex-1 py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-extrabold uppercase tracking-wider text-xs transition-all shadow-xl shadow-violet-600/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {lookupLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                                {lookupLoading ? 'Consultando...' : 'Consultar Placa'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep('category_select')}
                                className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-extrabold uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                Sem Placa
                            </button>
                        </div>
                    </div>
                </div>
            </PageContainer>
        );
    }

    // ── STEP 2: Category Select (fallback for no plate) ──────────────────────
    if (step === 'category_select') {
        return (
            <PageContainer className="flex items-center justify-center min-h-[75vh] animate-fadeUp">
                <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl max-w-xl w-full text-center space-y-8">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Tipo de Veículo</h2>
                        <p className="text-slate-500 font-bold text-sm">Selecione o tipo do veículo para continuar o cadastro manual.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Carro / Utilitário', value: 'carro', icon: <Zap size={24} /> },
                            { label: 'Motocicleta', value: 'moto', icon: <Settings size={24} /> },
                            { label: 'Caminhão', value: 'caminhao', icon: <Shield size={24} /> },
                            { label: 'Outros', value: 'outros', icon: <HelpCircle size={24} /> }
                        ].map((cat) => (
                            <button
                                type="button"
                                key={cat.value}
                                onClick={() => {
                                    setFormData(prev => ({ ...prev, vehicleCategory: cat.value as any, plate: 'SEM PLACA' }));
                                    setStep('form');
                                }}
                                className="flex flex-col items-center justify-center p-6 rounded-2xl border border-slate-100 hover:border-violet-500 hover:bg-violet-50/20 transition-all gap-3 cursor-pointer group"
                            >
                                <div className="p-3 rounded-xl bg-slate-50 text-slate-600 group-hover:bg-violet-100 group-hover:text-violet-700 transition-colors">
                                    {cat.icon}
                                </div>
                                <span className="text-xs font-extrabold text-slate-800">{cat.label}</span>
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={() => setStep('plate')}
                        className="text-xs font-black uppercase text-slate-400 hover:text-slate-600 tracking-widest pt-2 block mx-auto cursor-pointer"
                    >
                        Voltar para consulta de placa
                    </button>
                </div>
            </PageContainer>
        );
    }

    // ── STEP 3: Main Dynamic Form ─────────────────────────────────────────────
    return (
        <PageContainer className="pb-32 animate-fadeUp">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-6">
                    <button
                        type="button"
                        onClick={() => {
                            if (isEditing) {
                                navigate('/inventory');
                            } else {
                                setStep('plate');
                            }
                        }}
                        className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all hover:bg-slate-50 shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
                            {isEditing ? 'Editar Veículo' : 'Novo Veículo'}
                        </h1>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
                            Categoria ativa: <span className="text-violet-600 font-extrabold">{formData.vehicleCategory?.toUpperCase()}</span>
                        </p>
                    </div>
                </div>

                {/* Subtitle / Context Badges */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-violet-50 rounded-xl border border-violet-100/50">
                        <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                        <span className="text-[10px] font-black text-violet-600 uppercase tracking-widest">Ambiente de Cadastro</span>
                    </div>
                </div>
            </div>

            {/* Segmented Tab Navigation */}
            <div className="flex border-b border-slate-200 mb-8 overflow-x-auto custom-scrollbar gap-2 pb-2">
                {[
                    { id: 'dados', label: 'Dados do Veículo', icon: <Settings size={16} /> },
                    { id: 'seo', label: 'SEO & Meta Tags', icon: <Target size={16} /> },
                    { id: 'custos', label: 'Custos Operacionais', icon: <DollarSign size={16} /> },
                    { id: 'compra_venda', label: 'Compra e Venda', icon: <Sparkles size={16} /> }
                ].map(tab => (
                    <button
                        type="button"
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border ${
                            activeTab === tab.id
                                ? 'bg-violet-600 text-white border-violet-600 shadow-md'
                                : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            <form id="vehicle-form" onSubmit={handleSubmit} className="space-y-8">
                {/* ── TAB 1: DADOS DO VEÍCULO ────────────────────────────────────── */}
                {activeTab === 'dados' && (
                    <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-10">
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-1.5 h-4 bg-violet-500 rounded-full" />
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Calendar size={13} /> Identificação Básica</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2" id="field-brand">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Marca</label>
                                    <AutocompleteInput
                                        required
                                        value={formData.brand}
                                        onChangeValue={(val) => setFormData({ ...formData, brand: val, model: '' })}
                                        suggestions={Object.keys(carDatabase)}
                                        className={getFieldClassName('brand', 'w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-semibold text-sm')}
                                        placeholder="Ex: Chevrolet"
                                    />
                                    {errors.brand && <p className="text-[10px] font-bold text-red-500 px-1">{errors.brand}</p>}
                                </div>
                                <div className="space-y-2" id="field-model">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Modelo</label>
                                    <AutocompleteInput
                                        required
                                        value={formData.model}
                                        onChangeValue={(val) => setFormData(prev => ({ ...prev, model: val }))}
                                        suggestions={carDatabase[Object.keys(carDatabase).find(k => k.toLowerCase() === formData.brand.toLowerCase()) || ''] || []}
                                        className={getFieldClassName('model', 'w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-semibold text-sm')}
                                        placeholder="Ex: Onix"
                                    />
                                    {errors.model && <p className="text-[10px] font-bold text-red-500 px-1">{errors.model}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="space-y-2" id="field-plate">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Placa</label>
                                    <input
                                        value={formData.plate}
                                        onChange={e => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                                        placeholder="ABC1234"
                                        maxLength={8}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-semibold text-sm uppercase"
                                    />
                                </div>

                                <div className="space-y-2" id="field-year">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Ano Fab.</label>
                                    <input 
                                        type="number" 
                                        required 
                                        value={formData.year || ''} 
                                        onChange={e => setFormData({ ...formData, year: e.target.value ? parseInt(e.target.value) : 0 })} 
                                        className={getFieldClassName('year', 'w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-semibold text-sm')} 
                                    />
                                </div>

                                <div className="space-y-2" id="field-modelYear">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Ano Modelo</label>
                                    <input 
                                        type="number" 
                                        required 
                                        value={formData.modelYear || ''} 
                                        onChange={e => setFormData({ ...formData, modelYear: e.target.value ? parseInt(e.target.value) : 0 })} 
                                        className={getFieldClassName('modelYear', 'w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-semibold text-sm')} 
                                    />
                                </div>

                                <div className="space-y-2" id="field-mileage">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Quilometragem (KM)</label>
                                    <input
                                        type="text"
                                        required
                                        value={formatKM(formData.mileage)}
                                        onChange={e => setFormData({ ...formData, mileage: parseKM(e.target.value) })}
                                        className={getFieldClassName('mileage', 'w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-semibold text-sm')}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Cor</label>
                                    <input
                                        type="text"
                                        value={formData.color}
                                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-semibold text-sm"
                                        placeholder="Ex: Preto"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Combustível</label>
                                    <select
                                        value={formData.fuelType || 'Flex'}
                                        onChange={e => setFormData({ ...formData, fuelType: e.target.value as FuelType })}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm cursor-pointer"
                                    >
                                        {FUEL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* SPECIFIC FIELDS FOR MOTORCYCLE */}
                        {formData.vehicleCategory === 'moto' ? (
                            <section className="space-y-6 animate-slideIn">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Zap size={13} /> Especificações de Moto</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Categoria Moto</label>
                                        <select value={formData.motoCategory} onChange={e => setFormData({ ...formData, motoCategory: e.target.value as MotorcycleCategory })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm cursor-pointer">
                                            {MOTORCYCLE_CATEGORIES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Tipo de Partida</label>
                                        <select value={formData.startType} onChange={e => setFormData({ ...formData, startType: e.target.value as MotoStartType })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm cursor-pointer">
                                            {MOTO_START_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Freio</label>
                                        <select value={formData.brakeType} onChange={e => setFormData({ ...formData, brakeType: e.target.value as MotoBrakeType })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm cursor-pointer">
                                            {MOTO_BRAKE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Alimentação</label>
                                        <select value={formData.fuelSystem} onChange={e => setFormData({ ...formData, fuelSystem: e.target.value as MotoFuelSystem })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm cursor-pointer">
                                            {MOTO_FUEL_SYSTEMS.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Arrefecimento</label>
                                        <select value={formData.cooling} onChange={e => setFormData({ ...formData, cooling: e.target.value as MotoCooling })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm cursor-pointer">
                                            {MOTO_COOLING_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </section>
                        ) : (
                            /* SPECIFIC FIELDS FOR CARS / GENERAL */
                            <section className="space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Zap size={13} /> Especificações Técnicas</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Tipo Carroceria</label>
                                        <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as VehicleType })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm cursor-pointer">
                                            {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Câmbio</label>
                                        <select value={formData.transmission} onChange={e => setFormData({ ...formData, transmission: e.target.value as TransmissionType })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm cursor-pointer">
                                            {TRANSMISSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Motor</label>
                                        <select value={formData.engine} onChange={e => setFormData({ ...formData, engine: e.target.value as EngineType })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm cursor-pointer">
                                            {ENGINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Portas</label>
                                        <select
                                            value={formData.doors || 4}
                                            onChange={e => setFormData({ ...formData, doors: parseInt(e.target.value) === 2 ? 2 : 4 })}
                                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm cursor-pointer"
                                        >
                                            {DOOR_OPTIONS.map(d => <option key={d} value={d}>{d} Portas</option>)}
                                        </select>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* General options checklist */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-1.5 h-4 bg-violet-500 rounded-full" />
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><FileText size={13} /> Condições e Chaves</h3>
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
                                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all gap-2 ${formData[check.key as keyof typeof formData] ? 'bg-violet-50 border-violet-200 text-violet-700' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData[check.key as keyof typeof formData] ? 'bg-violet-500 border-violet-500 text-white' : 'bg-white border-slate-200'}`}>
                                            {formData[check.key as keyof typeof formData] && <Check size={12} strokeWidth={4} />}
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest">{check.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${formData.hasSpareKey ? 'bg-violet-50 border-violet-200' : 'bg-white border-slate-100'}`}>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Chave Reserva</p>
                                        <p className={`text-sm font-bold mt-0.5 ${formData.hasSpareKey ? 'text-violet-700' : 'text-slate-400'}`}>
                                            {formData.hasSpareKey ? 'Sim' : 'Não'}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={!!formData.hasSpareKey}
                                        onCheckedChange={(val) => setFormData(prev => ({ ...prev, hasSpareKey: val }))}
                                    />
                                </div>

                                <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${formData.hasOwnerManual ? 'bg-violet-50 border-violet-200' : 'bg-white border-slate-100'}`}>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Manual do Proprietário</p>
                                        <p className={`text-sm font-bold mt-0.5 ${formData.hasOwnerManual ? 'text-violet-700' : 'text-slate-400'}`}>
                                            {formData.hasOwnerManual ? 'Sim' : 'Não'}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={!!formData.hasOwnerManual}
                                        onCheckedChange={(val) => setFormData(prev => ({ ...prev, hasOwnerManual: val }))}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Opcionais checklist */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Shield size={13} /> Opcionais do Veículo</h3>
                            </div>

                            <div className="space-y-5">
                                {CATEGORIZED_OPTIONS.map(category => (
                                    <div key={category.label}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className={`w-1 h-3 ${category.color} rounded-full`} />
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{category.label}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {category.items.map(opt => {
                                                const isSelected = formData.optionals.includes(opt);
                                                return (
                                                    <button
                                                        type="button"
                                                        key={opt}
                                                        onClick={() => {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                optionals: isSelected
                                                                    ? prev.optionals.filter(o => o !== opt)
                                                                    : [...prev.optionals, opt]
                                                                }));
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
                                    </div>
                                ))}
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
                                    className="flex-1 p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-semibold text-sm"
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
                                    className="px-6 bg-slate-900 text-white rounded-2xl hover:bg-violet-600 transition-colors"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        </section>

                        {/* Media and Description */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-1.5 h-4 bg-cyan-500 rounded-full" />
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><ImagePlus size={13} /> Mídia e Descrição</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Foto Principal</label>
                                    <div className="aspect-square max-w-[280px] rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden relative group">
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
                                                <Upload size={40} strokeWidth={1} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Nenhuma Foto</span>
                                            </div>
                                        )}
                                    </div>
                                    <label className="block w-full cursor-pointer">
                                        <div className={`max-w-[280px] w-full py-3 px-6 rounded-2xl border text-center flex items-center justify-center gap-3 ${uploading ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200 hover:border-violet-500 hover:bg-violet-50'}`}>
                                            {uploading ? <Loader2 size={16} className="animate-spin text-violet-500" /> : <Upload size={16} />}
                                            <span className="text-[11px] font-black uppercase tracking-widest">{uploading ? 'Enviando...' : 'Fazer Upload'}</span>
                                        </div>
                                        <input type="file" ref={logoInputRef} accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                                    </label>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Galeria</label>
                                        <span className="text-[10px] font-bold text-slate-300">{formData.galleryImages?.length || 0}/6 fotos</span>
                                    </div>

                                    {(formData.galleryImages?.length ?? 0) > 0 && (
                                        <div className="grid grid-cols-3 gap-2">
                                            {formData.galleryImages!.map((url, i) => (
                                                <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100">
                                                    <img src={url} alt={`Galeria ${i + 1}`} className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeGalleryImage(url)}
                                                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X size={16} className="text-white" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {(formData.galleryImages?.length || 0) < 6 && (
                                        <label className="block w-full cursor-pointer">
                                            <div className={`max-w-[280px] w-full py-3 px-4 rounded-2xl border text-center flex items-center justify-center gap-2 ${galleryUploading ? 'bg-slate-50' : 'bg-white border-slate-200 hover:border-violet-500'}`}>
                                                {galleryUploading ? <Loader2 size={16} className="animate-spin text-violet-500" /> : <Upload size={16} />}
                                                <span className="text-[11px] font-black uppercase tracking-widest">Adicionar Fotos</span>
                                            </div>
                                            <input type="file" ref={galleryInputRef} accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} disabled={galleryUploading} />
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Descrição Comercial Curta</label>
                                <input
                                    type="text"
                                    value={formData.shortDescription || ''}
                                    onChange={e => setFormData({ ...formData, shortDescription: e.target.value })}
                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-semibold text-sm"
                                    placeholder="Ex: Completo com teto solar e baixa quilometragem."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Detalhes Adicionais</label>
                                <textarea
                                    value={formData.description || ''}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full p-4 h-32 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-semibold text-sm"
                                    placeholder="Ex: Manual e chave cópia. Todas as revisões efetuadas em concessionária autorizada..."
                                />
                            </div>
                        </section>
                    </div>
                )}

                {/* ── TAB 2: SEO & META TAGS ────────────────────────────────────── */}
                {activeTab === 'seo' && (
                    <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-8 animate-fadeUp">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Otimização para Mecanismos de Busca (SEO)</h3>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">Indexação Google & IA</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleGenerateAI}
                                disabled={aiGenerating}
                                className="px-5 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                            >
                                {aiGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                Gerar com IA
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">SEO Headline (Título no Google)</label>
                                <input
                                    type="text"
                                    value={formData.seoHeadline || ''}
                                    onChange={e => setFormData({ ...formData, seoHeadline: e.target.value })}
                                    maxLength={70}
                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-semibold text-sm"
                                    placeholder="Ex: Compre Chevrolet Onix 1.6 Flex 2022 Conservado | Nome Concessionária"
                                />
                                <span className="text-[9px] font-bold text-slate-300 block text-right">{(formData.seoHeadline || '').length}/70 caracteres recomendados</span>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Meta Descrição (Snippet de Busca)</label>
                                <textarea
                                    value={formData.seoDescription || ''}
                                    onChange={e => setFormData({ ...formData, seoDescription: e.target.value })}
                                    maxLength={160}
                                    className="w-full p-4 h-32 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-semibold text-sm"
                                    placeholder="Ex: Oferta imperdível de Onix 2022! Câmbio automático, laudo cautelar aprovado e garantia de 90 dias. Confira as condições exclusivas de financiamento..."
                                />
                                <span className="text-[9px] font-bold text-slate-300 block text-right">{(formData.seoDescription || '').length}/160 caracteres recomendados</span>
                            </div>
                        </div>

                        {/* Google Preview Widget */}
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">Prévia no Google Search</p>
                            <div className="space-y-1">
                                <p className="text-[11px] text-slate-500 font-medium font-sans">https://sualoja.com.br/estoque/{formData.model?.toLowerCase() || 'veiculo'}</p>
                                <h4 className="text-indigo-600 font-sans hover:underline text-lg font-medium leading-snug cursor-pointer">
                                    {formData.seoHeadline || `${formData.brand} ${formData.model} ${formData.year} à Venda - Loja`}
                                </h4>
                                <p className="text-slate-600 text-xs font-sans leading-relaxed">
                                    {formData.seoDescription || 'Confira os opcionais, quilometragem, fotos e preço e agende uma visita agora mesmo para simular o financiamento...'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── TAB 3: CUSTOS OPERACIONAIS ────────────────────────────────── */}
                {activeTab === 'custos' && (
                    <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-8 animate-fadeUp">
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Custos Operacionais do Veículo</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">Reparos, Impostos, Preparação e Mídia</p>
                        </div>

                        {/* Fast inserts buttons */}
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Adicionar Custos Frequentes</p>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { label: 'Tráfego Pago / Mídia', amount: 150 },
                                    { label: 'Oficina Mecânica', amount: 500 },
                                    { label: 'Peças de Reposição', amount: 350 },
                                    { label: 'Pintura', amount: 400 },
                                    { label: 'Polimento', amount: 180 },
                                    { label: 'Lavagem Detalhada', amount: 80 },
                                    { label: 'Documentação / IPVA', amount: 600 }
                                ].map((item, idx) => (
                                    <button
                                        type="button"
                                        key={idx}
                                        onClick={() => addOperationalCost(item.label, item.amount)}
                                        className="px-4 py-2.5 bg-slate-50 border border-slate-100 hover:border-violet-500 hover:bg-violet-50/20 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <PlusCircle size={14} className="text-violet-600" />
                                        {item.label} (R$ {item.amount})
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Descrição do Custo</label>
                                <input
                                    type="text"
                                    value={newCostDesc}
                                    onChange={e => setNewCostDesc(e.target.value)}
                                    placeholder="Ex: Troca de pastilhas"
                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-semibold text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Valor (R$)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                                    <input
                                        type="text"
                                        value={formatCurrency(newCostAmount)}
                                        onChange={e => setNewCostAmount(parseCurrency(e.target.value))}
                                        className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-semibold text-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex items-end">
                                <button
                                    type="button"
                                    onClick={() => addOperationalCost(newCostDesc, newCostAmount)}
                                    className="w-full py-4 bg-slate-900 text-white hover:bg-violet-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <Plus size={16} /> Adicionar Custo
                                </button>
                            </div>
                        </div>

                        {/* Costs list */}
                        <div className="pt-6 border-t border-slate-100 space-y-4">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Histórico de Custos Adicionados</p>
                            
                            {(!formData.operationalCosts || formData.operationalCosts.length === 0) ? (
                                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-slate-400 font-medium text-xs uppercase tracking-wider">Nenhum custo operacional lançado para este veículo.</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                                    {formData.operationalCosts.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                            <div>
                                                <p className="text-xs font-black text-slate-800">{item.description}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.date}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-xs font-black text-slate-900">R$ {formatCurrency(item.amount)}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeOperationalCost(item.id)}
                                                    className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors cursor-pointer"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Total summary */}
                            <div className="flex justify-between items-center p-6 bg-slate-900 text-white rounded-3xl mt-4">
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Total de Custos de Preparação</span>
                                <span className="text-2xl font-black">R$ {formatCurrency(totalCosts)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── TAB 4: COMPRA E VENDA ────────────────────────────────────── */}
                {activeTab === 'compra_venda' && (
                    <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-8 animate-fadeUp">
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Configuração de Valores Comerciais</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">Cálculo de Margem & Sugestão de Preço</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Preço de Compra */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Valor Pago no Veículo (Compra)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                                    <input
                                        type="text"
                                        value={formatCurrency(formData.purchasePrice || 0)}
                                        onChange={e => setFormData({ ...formData, purchasePrice: parseCurrency(e.target.value) })}
                                        className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-semibold text-sm"
                                    />
                                </div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Custo de Aquisição Inicial</p>
                            </div>

                            {/* Custos Operacionais */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Custos de Preparação (Total)</label>
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl h-[54px] flex items-center">
                                    <p className="text-sm font-bold text-slate-700">R$ {formatCurrency(totalCosts)}</p>
                                </div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Soma da aba de custos</p>
                            </div>

                            {/* Preço Sugerido */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Preço Sugerido de Venda</label>
                                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl h-[54px] flex items-center justify-between">
                                    <span className="text-sm font-black text-indigo-700">R$ {formatCurrency(formData.suggestedSalePrice || calculatedSuggestedPrice)}</span>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, price: formData.suggestedSalePrice || calculatedSuggestedPrice })}
                                        className="text-[9px] font-black uppercase text-indigo-600 bg-white border border-indigo-200 px-3 py-1 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer"
                                    >
                                        Usar Sugestão
                                    </button>
                                </div>
                                <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest px-1 flex items-center gap-1">
                                    <Sparkles size={10} /> Sugerido com margem de 20%
                                </p>
                            </div>
                        </div>

                        {/* Definição de preço final de venda */}
                        <div className="pt-6 border-t border-slate-100 space-y-4">
                            <div className="space-y-2" id="field-price">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Preço Final de Venda (Anunciado)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-700 font-bold text-sm">R$</span>
                                    <input
                                        type="text"
                                        required
                                        value={formatCurrency(formData.price)}
                                        onChange={e => setFormData({ ...formData, price: parseCurrency(e.target.value) })}
                                        className={getFieldClassName('price', 'w-full p-5 pl-12 bg-violet-50 text-violet-700 border border-violet-100 rounded-2xl outline-none font-black text-lg')}
                                    />
                                </div>
                                {errors.price && <p className="text-[10px] font-bold text-red-500 px-1">{errors.price}</p>}
                                <p className="text-[9px] font-bold text-violet-600 uppercase tracking-widest px-1">Este valor aparecerá no seu website e propostas</p>
                            </div>
                        </div>
                    </div>
                )}
            </form>

            {/* Sticky Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-700/50 px-6 py-4">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold text-slate-400">
                            {isEditing ? 'Editando veículo' : 'Novo cadastro'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => { clearDraft(); navigate('/inventory'); }}
                            className="px-6 py-3.5 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="vehicle-form"
                            disabled={uploading || galleryUploading || submitting}
                            className="px-8 py-3.5 bg-violet-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-violet-700 transition-all shadow-lg shadow-violet-600/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                            {submitting ? (
                                <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Salvando...</span>
                            ) : isEditing ? (
                                'Salvar Alterações'
                            ) : (
                                'Publicar no Estoque'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </PageContainer>
    );
};

export default VehicleForm;
