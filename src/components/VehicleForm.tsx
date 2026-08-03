import React, { useState, useEffect, useRef } from 'react';
import PageContainer from './ui/PageContainer';
import { useNavigate } from 'react-router-dom';
import {
    X, Upload, Loader2, Check, Plus, DollarSign, Calendar, Gauge, Zap,
    ArrowLeft, Search, AlertCircle, Hash, Shield, ImagePlus, FileText,
    Target, Settings, HelpCircle, Sparkles, PlusCircle, Trash2, ChevronDown, Star, Camera,
    Car, Bike, Truck, Boxes
} from 'lucide-react';
import { Vehicle, VehicleType, TransmissionType, EngineType, FuelType, MotorcycleCategory, MotoStartType, MotoBrakeType, MotoFuelSystem, MotoCooling } from '../types';
import { Switch } from './ui/switch';
import { supabase } from '../lib/supabaseClient';
import { resizeImage } from '../utils/imageProcessor';
import { carDatabase } from '../data/carDb';
import AutocompleteInput from './ui/AutocompleteInput';
import { formatCurrency, parseCurrency, formatKM, parseKM } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';
import { generateSeoDetails, generateVehicleDescriptions } from '../services/openaiService';
import { consultaPlaca } from '../services/plateService';
import { VehicleFormSeo } from './vehicle-form/VehicleFormSeo';
import { VehicleFormCosts } from './vehicle-form/VehicleFormCosts';
import { VehicleFormPricing } from './vehicle-form/VehicleFormPricing';
import MotorcycleIcon from './icons/MotorcycleIcon';

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

/** Máximo de fotos na galeria (além da foto principal) → 11 + 1 = 12 fotos do veículo. */
const MAX_GALLERY_IMAGES = 11;

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
    const [descGenerating, setDescGenerating] = useState(false);
    // Seções recolhidas por padrão — o lojista abre se quiser preencher.
    const [showCondicoes, setShowCondicoes] = useState(false);
    const [showOpcionais, setShowOpcionais] = useState(false);
    const [plateError, setPlateError] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Custom option inputs
    const [customOption, setCustomOption] = useState('');
    const [newCostDesc, setNewCostDesc] = useState('');
    const [newCostAmount, setNewCostAmount] = useState(0);

    const [formData, setFormData] = useState<Omit<Vehicle, 'id' | 'status'>>({
        brand: '', model: '', year: new Date().getFullYear(), modelYear: new Date().getFullYear(), plate: '', fipePrice: 0, price: 0, type: 'Sedan',
        transmission: 'Automático', engine: '1.6', fuelType: 'Flex', doors: 4, mileage: 0, color: '',
        // Por padrão só "Garantia" vem marcada; o lojista marca as demais conforme o caso.
        isSingleOwner: false, isServiceHistoryComplete: false, isIpvaPaid: false, hasWarranty: true,
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

    const [lastSavedSnapshot, setLastSavedSnapshot] = useState<string | null>(null);

    useEffect(() => {
        if (isEditing && initialData) {
            const { id, status, saleDetails, ...rest } = initialData;
            const updated = {
                ...rest,
                galleryImages: rest.galleryImages || [],
                operationalCosts: rest.operationalCosts || [],
                vehicleCategory: rest.vehicleCategory || 'carro'
            };
            setFormData(updated);
            setLastSavedSnapshot(JSON.stringify(updated));
        } else {
            const savedDraft = localStorage.getItem('vehicle_form_draft_new');
            if (savedDraft) {
                try {
                    const parsed = JSON.parse(savedDraft);
                    setFormData(prev => ({ ...prev, ...parsed, plate: '' }));
                } catch (e) {
                    console.error("Error loading draft:", e);
                }
            }
        }
    }, [initialData?.id, isEditing]);

    useEffect(() => {
        if (isEditing) return;
        const { plate, ...draftToSave } = formData;
        localStorage.setItem('vehicle_form_draft_new', JSON.stringify(draftToSave));
    }, [formData, isEditing]);

    const clearDraft = () => {
        if (isEditing) return;
        localStorage.removeItem('vehicle_form_draft_new');
    };

    // Analisador automático das especificações técnicas retornadas da API de placas
    const detectVehicleSpecs = (data: any) => {
        const extra = data.extra || {};
        const fullText = [
            data.MARCA || data.marca || '',
            data.MODELO || data.modelo || '',
            data.segmento || extra.segmento || '',
            data.sub_segmento || extra.sub_segmento || '',
            data.combustivel || extra.combustivel || '',
            data.caixa_cambio || extra.caixa_cambio || extra.cambio || '',
            data.motor || extra.motor || data.potencia || data.cilindradas || extra.cilindradas || '',
            extra.tipo_carroceria || '',
            extra.versao || ''
        ].join(' ').toUpperCase();

        // 1. Tipo Carroceria (SUV, Sedan, Hatch, Picape, Esportivo, Conversível, Van)
        let type: VehicleType = 'Sedan';
        if (/PICAPE|PICK|PICK-UP|CABINE|SAVEIRO|STRADA|TORO|HILUX|AMAROK|S10|RANGER|MONTANA|OROCH|RAM|COURIER|HOGGAR/.test(fullText)) {
            type = 'Picape';
        } else if (/SUV|UTILITARIO|CROSS|TRACKER|RENEGADE|COMPASS|CRETA|HRV|H-RV|KICKS|DUSTER|NIVUS|T-CROSS|TCROSS|TIGUAN|ECOSPORT|SW4|COMMANDER|FASTBACK|PULSE|TAOS|TIGGO/.test(fullText)) {
            type = 'SUV';
        } else if (/VAN|MINIVAN|FURGAO|SPIN|KOMBI|DUCATO|MASTER|EXPERT|JUMPY|FIORINO|DOBLO|KANGOO|PARTNER|TRANSIT/.test(fullText)) {
            type = 'Van';
        } else if (/CONVERSIVEL|CABRIO|ROADSTER/.test(fullText)) {
            type = 'Conversível';
        } else if (/ESPORTIVO|COUPE|MUSTANG|CAMARO|PORSCHE|TT|GTI|RS/.test(fullText)) {
            type = 'Esportivo';
        } else if (/SEDAN|SEDÃ|COROLLA|CIVIC|CITY|CRUZE|VIRTUS|LOGAN|VERSA|CRONOS|PRISMA|VOYAGE|JETTA|SENTRA|FLUENCE|CERATO/.test(fullText)) {
            type = 'Sedan';
        } else if (/HATCH|GOL|ONIX|KA|HB20|ARGO|POLO|PALIO|CELTA|UNO|FIT|SANDERO|208|308|YARIS|MOBY|MOBI|UP|FOX|ETIOS|CLIO/.test(fullText)) {
            type = 'Hatch';
        }

        // 2. Câmbio (Manual, Automático, Automatizado, CVT, Semi-Automático)
        let transmission: TransmissionType = 'Manual';
        if (/CVT/.test(fullText)) {
            transmission = 'CVT';
        } else if (/AUTOMATIZADO|DUALOGIC|GSR|I-MOTION|IMOTION|POWERSHIFT|DSG/.test(fullText)) {
            transmission = 'Automatizado';
        } else if (/AUTOMATICO|AUTOMÁTICO|\bAUT\b|\bAT6\b|\bAT8\b|\bAT9\b|\bAT4\b|\bAT\b|TIPTRONIC|STEPTRONIC/.test(fullText)) {
            transmission = 'Automático';
        } else if (/MANUAL|\bMAN\b|MECANICO|MECÂNICO/.test(fullText)) {
            transmission = 'Manual';
        }

        // 3. Combustível (Gasolina, Álcool, Flex, Diesel, GNV, Elétrico, Híbrido)
        let fuelType: FuelType = 'Flex';
        if (/ELETRICO|ELÉTRICO|\bBEV\b|\bEV\b/.test(fullText)) {
            fuelType = 'Elétrico';
        } else if (/HIBRIDO|HÍBRIDO|\bPHEV\b|\bHEV\b/.test(fullText)) {
            fuelType = 'Híbrido';
        } else if (/DIESEL/.test(fullText)) {
            fuelType = 'Diesel';
        } else if (/GNV|GAS NATURAL/.test(fullText)) {
            fuelType = 'GNV';
        } else if (/FLEX|BIOFLEX|ALCOOL\/GASOLINA|GASOL\/ALCOOL/.test(fullText)) {
            fuelType = 'Flex';
        } else if (/GASOLINA/.test(fullText)) {
            fuelType = 'Gasolina';
        } else if (/ALCOOL|ÁLCOOL|ETANOL/.test(fullText)) {
            fuelType = 'Álcool';
        }

        // 4. Motor (1.0, 1.3, 1.4, 1.5, 1.6, 1.8, 2.0, 2.0+, Elétrico, Híbrido)
        let engine: EngineType = '1.6';
        if (fuelType === 'Elétrico') {
            engine = 'Elétrico';
        } else if (fuelType === 'Híbrido' && !/\b(1\.[0-9]|2\.[0-9])\b/.test(fullText)) {
            engine = 'Híbrido';
        } else {
            const motorMatch = fullText.match(/\b(1\.[0-9]|2\.[0-9]|3\.[0-9]|4\.[0-9])\b/);
            if (motorMatch) {
                const val = parseFloat(motorMatch[1]);
                if (val <= 1.1) engine = '1.0';
                else if (val <= 1.35) engine = '1.3';
                else if (val <= 1.45) engine = '1.4';
                else if (val <= 1.55) engine = '1.5';
                else if (val <= 1.7) engine = '1.6';
                else if (val <= 1.9) engine = '1.8';
                else if (val <= 2.05) engine = '2.0';
                else engine = '2.0+';
            } else if (/999CC|1\.0/.test(fullText)) {
                engine = '1.0';
            } else if (/1598CC|1599CC|1\.6/.test(fullText)) {
                engine = '1.6';
            } else if (/1998CC|1999CC|2\.0/.test(fullText)) {
                engine = '2.0';
            }
        }

        // 5. Portas (2 ou 4)
        let doors: 2 | 4 = 4;
        if (type === 'Picape' && /CABINE SIMPLES|CS|\b2P\b|2 PORTAS/.test(fullText) && !/CABINE DUPLA|CD|4P|4 PORTAS/.test(fullText)) {
            doors = 2;
        } else if (/2P\b|2 PORTAS|CABINE SIMPLES|CS|COUPE|CUPÊ/.test(fullText) && !/4P|4 PORTAS|5P/.test(fullText)) {
            doors = 2;
        } else {
            doors = 4;
        }

        return { type, transmission, fuelType, engine, doors };
    };

    // Plate lookup
    const lookupPlate = async () => {
        const rawPlate = (formData.plate ?? '').replace(/[-\s]/g, '').toUpperCase();
        if (rawPlate.length < 7) {
            setPlateError('Digite uma placa válida (7 caracteres).');
            return;
        }
        setLookupLoading(true);
        setPlateError(null);
        try {
            const data = await consultaPlaca(rawPlate);

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

            const specs = detectVehicleSpecs(data);

            setFormData(prev => ({
                ...prev,
                brand,
                model,
                year,
                modelYear: parseInt(data.anoModelo) || year,
                color: data.cor || extra.cor || prev.color,
                fipePrice: fipePrice > 0 ? fipePrice : prev.fipePrice,
                vehicleCategory,
                type: specs.type,
                transmission: specs.transmission,
                fuelType: specs.fuelType,
                engine: specs.engine,
                doors: specs.doors
            }));

            setStep('form');
        } catch (err: any) {
            console.error("Plate lookup error:", err);
            setPlateError(err?.message || 'Não foi possível consultar a placa. Verifique e tente novamente.');
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

    // Photos Management
    const setAsMainImage = (url: string) => {
        setFormData(prev => {
            const currentMain = prev.imageUrl;
            if (currentMain === url) return prev;
            const currentGallery = prev.galleryImages || [];
            const newGallery = currentGallery.filter(img => img !== url);
            if (currentMain) {
                newGallery.unshift(currentMain);
            }
            return {
                ...prev,
                imageUrl: url,
                galleryImages: newGallery
            };
        });
        showToast('success', 'Foto de capa atualizada!');
    };

    const removeVehicleImage = (url: string) => {
        setFormData(prev => {
            if (prev.imageUrl === url) {
                const gallery = prev.galleryImages || [];
                const newMain = gallery[0] || '';
                const newGallery = gallery.slice(1);
                return {
                    ...prev,
                    imageUrl: newMain,
                    galleryImages: newGallery
                };
            } else {
                return {
                    ...prev,
                    galleryImages: (prev.galleryImages || []).filter(img => img !== url)
                };
            }
        });
    };

    const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const currentImages = [formData.imageUrl, ...(formData.galleryImages || [])].filter(Boolean);
        const MAX_TOTAL = 12;
        const slots = MAX_TOTAL - currentImages.length;
        if (slots <= 0) {
            showToast('error', `Limite de 12 fotos atingido.`);
            e.target.value = '';
            return;
        }

        const selected = Array.from(files).slice(0, slots);
        if (files.length > slots) {
            showToast('error', `Limite de 12 fotos. Apenas as primeiras ${slots} foto(s) foram enviadas.`);
        }

        setGalleryUploading(true);
        try {
            const uploadedUrls: string[] = [];
            for (const file of selected) {
                const resizedBlob = await resizeImage(file, 1080, 1080);
                const resizedFile = new File([resizedBlob], 'vehicle.webp', { type: 'image/webp' });
                const fileName = `gallery/${Date.now()}-${Math.random().toString(36).substring(2)}.webp`;

                const { error: uploadError } = await supabase.storage
                    .from('vehicles')
                    .upload(fileName, resizedFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('vehicles')
                    .getPublicUrl(fileName);

                uploadedUrls.push(publicUrl);
            }

            setFormData(prev => {
                const hasMain = !!prev.imageUrl;
                let newMain = prev.imageUrl;
                let newGallery = [...(prev.galleryImages || [])];

                if (!hasMain && uploadedUrls.length > 0) {
                    newMain = uploadedUrls[0];
                    newGallery = [...newGallery, ...uploadedUrls.slice(1)];
                } else {
                    newGallery = [...newGallery, ...uploadedUrls];
                }

                return {
                    ...prev,
                    imageUrl: newMain,
                    galleryImages: newGallery
                };
            });

            showToast('success', `${uploadedUrls.length} foto(s) enviada(s) com sucesso!`);
        } catch (error: any) {
            alert('Erro ao fazer upload da galeria: ' + error.message);
        } finally {
            setGalleryUploading(false);
            e.target.value = '';
        }
    };

    // AI Generation — SEO + preço sugerido
    const handleGenerateAI = async () => {
        if (!formData.brand?.trim() || !formData.model?.trim()) {
            showToast('error', 'Informe ao menos a marca e o modelo antes de gerar com IA.');
            return;
        }
        setAiGenerating(true);
        try {
            const response = await generateSeoDetails(formData);
            setFormData(prev => ({
                ...prev,
                seoHeadline: response.seoHeadline || prev.seoHeadline,
                seoDescription: response.seoDescription || prev.seoDescription,
                suggestedSalePrice: response.suggestedSalePrice || prev.suggestedSalePrice
            }));
            showToast('success', 'SEO e precificação gerados pela IA!');
        } catch (err: any) {
            // Mostra o motivo real (antes o erro era engolido e exibia "sucesso").
            showToast('error', err?.message || 'Falha ao gerar com a IA.');
        } finally {
            setAiGenerating(false);
        }
    };

    // AI Generation — descrições comerciais (curta e completa)
    const handleGenerateDescriptions = async () => {
        if (!formData.brand?.trim() || !formData.model?.trim()) {
            showToast('error', 'Informe ao menos a marca e o modelo antes de gerar com IA.');
            return;
        }
        setDescGenerating(true);
        try {
            const response = await generateVehicleDescriptions(formData);
            setFormData(prev => ({
                ...prev,
                shortDescription: response.shortDescription || prev.shortDescription,
                description: response.description || prev.description,
            }));
            showToast('success', 'Descrições geradas pela IA!');
        } catch (err: any) {
            showToast('error', err?.message || 'Falha ao gerar as descrições.');
        } finally {
            setDescGenerating(false);
        }
    };

    // Quantos itens de "Condições e Chaves" estão marcados (mostrado no cabeçalho recolhido).
    const condicoesCount = [
        formData.isSingleOwner,
        formData.isServiceHistoryComplete,
        formData.isIpvaPaid,
        formData.hasWarranty,
        formData.hasSpareKey,
        formData.hasOwnerManual,
    ].filter(Boolean).length;

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

    const updateOperationalCost = (id: string, amount: number) => {
        setFormData(prev => ({
            ...prev,
            operationalCosts: (prev.operationalCosts || []).map(item =>
                item.id === id ? { ...item, amount } : item
            )
        }));
    };

    const toggleOperationalCostTag = (label: string) => {
        setFormData(prev => {
            const current = prev.operationalCosts || [];
            const existing = current.find(item => item.description.toLowerCase() === label.toLowerCase());
            if (existing) {
                return {
                    ...prev,
                    operationalCosts: current.filter(item => item.id !== existing.id)
                };
            } else {
                const newItem = {
                    id: Math.random().toString(36).substring(2),
                    description: label,
                    amount: 0,
                    date: new Date().toISOString().split('T')[0]
                };
                return {
                    ...prev,
                    operationalCosts: [...current, newItem]
                };
            }
        });
    };

    const getFieldClassName = (field: string, base: string) => `${base} ${errors[field] ? 'border-rose-400 bg-rose-500/5 focus:ring-rose-500/10' : ''}`;

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
            let savedResult: any = null;
            if (isEditing && initialData) {
                savedResult = await onSave({ ...initialData, ...formData });
            } else {
                savedResult = await onSave({ ...formData, status: 'available' });
            }
            clearDraft();
            setLastSavedSnapshot(JSON.stringify(formData));
            showToast('success', isEditing ? 'Alterações salvas com sucesso!' : 'Veículo publicado no estoque!');

            if (!isEditing && savedResult?.id) {
                navigate(`/inventory/edit/${savedResult.id}`, { replace: true });
            }
        } catch (err: any) {
            console.error('Erro ao salvar veículo:', err);
        } finally {
            setSubmitting(false);
        }
    };

    // ── STEP 1: License Plate Lookup ──────────────────────────────────────────
    if (step === 'plate') {
        return (
            <PageContainer className="flex items-center justify-center min-h-[75vh] animate-fadeUp">
                <div className="bg-card text-foreground rounded-[3rem] p-10 md:p-16 max-w-xl w-full border border-border/80 shadow-2xl relative overflow-hidden text-center space-y-8">
                    <div className="absolute top-0 right-0 p-10 opacity-5">
                        <Target size={180} />
                    </div>

                    <div className="relative z-10 space-y-6">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 mx-auto">
                            <Hash size={32} />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold tracking-tight">Cadastro de Veículo</h2>
                            <p className="text-muted-foreground text-sm font-medium">Informe a placa para preencher os dados técnicos automaticamente.</p>
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
                                className="w-full p-5 bg-muted/65 border border-border/80 rounded-2xl text-center text-2xl font-bold tracking-widest text-foreground placeholder-muted-foreground/50 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all uppercase"
                            />
                            {plateError && (
                                <p className="text-xs font-bold text-rose-400 flex items-center justify-center gap-1.5 pt-1">
                                    <AlertCircle size={13} /> {plateError}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                type="button"
                                onClick={lookupPlate}
                                disabled={lookupLoading}
                                className="flex-1 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-bold uppercase tracking-wider text-xs transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {lookupLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                                {lookupLoading ? 'Consultando...' : 'Consultar Placa'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep('category_select')}
                                className="flex-1 py-4 bg-muted/70 hover:bg-muted text-foreground border border-border/80 rounded-2xl font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
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
                <div className="bg-card rounded-[3rem] p-10 border border-border/80 shadow-xl max-w-xl w-full text-center space-y-8">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-foreground tracking-tight">Tipo de Veículo</h2>
                        <p className="text-muted-foreground font-semibold text-sm">Selecione o tipo do veículo para continuar o cadastro manual.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Carro / Utilitário', value: 'carro', icon: <Car size={24} /> },
                            { label: 'Motocicleta', value: 'moto', icon: <MotorcycleIcon size={24} /> },
                            { label: 'Caminhão', value: 'caminhao', icon: <Truck size={24} /> },
                            { label: 'Outros', value: 'outros', icon: <Boxes size={24} /> }
                        ].map((cat) => (
                            <button
                                type="button"
                                key={cat.value}
                                onClick={() => {
                                    setFormData(prev => ({ ...prev, vehicleCategory: cat.value as any, plate: 'SEM PLACA' }));
                                    setStep('form');
                                }}
                                className="flex flex-col items-center justify-center p-6 rounded-2xl border border-border/80 hover:border-primary hover:bg-primary/5 transition-all gap-3 cursor-pointer group"
                            >
                                <div className="p-3 rounded-xl bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    {cat.icon}
                                </div>
                                <span className="text-xs font-bold text-foreground">{cat.label}</span>
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={() => setStep('plate')}
                        className="text-xs font-bold uppercase text-muted-foreground hover:text-foreground tracking-widest pt-2 block mx-auto cursor-pointer"
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
                        className="w-12 h-12 rounded-2xl bg-card border border-border/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all hover:bg-muted shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground tracking-tight uppercase">
                            {isEditing ? 'Editar Veículo' : 'Novo Veículo'}
                        </h1>
                        <p className="text-xs font-bold text-muted-foreground mt-1 uppercase tracking-widest">
                            Categoria ativa: <span className="text-primary font-bold">{formData.vehicleCategory?.toUpperCase()}</span>
                        </p>
                    </div>
                </div>

                {/* Subtitle / Context Badges */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-xl border border-primary/20">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Ambiente de Cadastro</span>
                    </div>
                </div>
            </div>

            {/* Segmented Tab Navigation */}
            <div className="flex border-b border-border/80 mb-8 overflow-x-auto custom-scrollbar gap-2 pb-2">
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
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border ${
                            activeTab === tab.id
                                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                : 'bg-card text-muted-foreground border-border/80 hover:bg-muted'
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
                    <div className="bg-card rounded-[2.5rem] p-10 border border-border/80 shadow-sm space-y-10">
                        {/* Identificação Básica — bloco destacado com cabeçalho limpo */}
                        <section className="space-y-6 rounded-3xl border border-border/80 bg-muted/30 dark:bg-muted/20 p-6 md:p-8">
                            <div className="flex items-center justify-between bg-card border border-border/80 p-4 px-6 rounded-2xl shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-6 bg-primary rounded-full" />
                                    <h3 className="font-heading font-extrabold text-base md:text-lg text-foreground tracking-tight flex items-center gap-2.5">
                                        <Calendar size={18} className="text-primary" /> Identificação Básica
                                    </h3>
                                </div>
                            </div>

                            {/* PLACA — destaque principal */}
                            <div className="space-y-2" id="field-plate">
                                <label htmlFor="input-plate" className="text-[10px] font-bold text-primary uppercase tracking-widest px-1 flex items-center gap-1.5">
                                    <Hash size={12} /> Placa do Veículo
                                </label>
                                <input
                                    id="input-plate"
                                    value={formData.plate}
                                    onChange={e => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                                    placeholder="ABC1234"
                                    maxLength={8}
                                    className="w-full md:max-w-xs p-5 bg-card border-2 border-primary/40 rounded-2xl outline-none font-heading font-bold text-2xl md:text-3xl tracking-[0.2em] text-center uppercase text-foreground focus:border-primary focus:ring-4 focus:ring-ring transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2" id="field-brand">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Marca</label>
                                    <AutocompleteInput
                                        required
                                        value={formData.brand}
                                        onChangeValue={(val) => setFormData({ ...formData, brand: val, model: '' })}
                                        suggestions={Object.keys(carDatabase)}
                                        className={getFieldClassName('brand', 'w-full p-4 bg-muted/75 border border-border/85 rounded-2xl outline-none font-semibold text-sm text-foreground focus:bg-card focus:border-primary/45 transition-all')}
                                        placeholder="Ex: Chevrolet"
                                    />
                                    {errors.brand && <p className="text-[10px] font-bold text-rose-500 px-1">{errors.brand}</p>}
                                </div>
                                <div className="space-y-2" id="field-model">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Modelo</label>
                                    <AutocompleteInput
                                        required
                                        value={formData.model}
                                        onChangeValue={(val) => setFormData(prev => ({ ...prev, model: val }))}
                                        suggestions={carDatabase[Object.keys(carDatabase).find(k => k.toLowerCase() === formData.brand.toLowerCase()) || ''] || []}
                                        className={getFieldClassName('model', 'w-full p-4 bg-muted/75 border border-border/85 rounded-2xl outline-none font-semibold text-sm text-foreground focus:bg-card focus:border-primary/45 transition-all')}
                                        placeholder="Ex: Onix"
                                    />
                                    {errors.model && <p className="text-[10px] font-bold text-rose-500 px-1">{errors.model}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2" id="field-year">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Ano Fab.</label>
                                    <input 
                                        type="number" 
                                        required 
                                        value={formData.year || ''} 
                                        onChange={e => setFormData({ ...formData, year: e.target.value ? parseInt(e.target.value) : 0 })} 
                                        className={getFieldClassName('year', 'w-full p-4 bg-muted/75 border border-border/85 rounded-2xl outline-none font-semibold text-sm text-foreground focus:bg-card focus:border-primary/45 transition-all')} 
                                    />
                                </div>

                                <div className="space-y-2" id="field-modelYear">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Ano Modelo</label>
                                    <input 
                                        type="number" 
                                        required 
                                        value={formData.modelYear || ''} 
                                        onChange={e => setFormData({ ...formData, modelYear: e.target.value ? parseInt(e.target.value) : 0 })} 
                                        className={getFieldClassName('modelYear', 'w-full p-4 bg-muted/75 border border-border/85 rounded-2xl outline-none font-semibold text-sm text-foreground focus:bg-card focus:border-primary/45 transition-all')} 
                                    />
                                </div>

                                <div className="space-y-2" id="field-mileage">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Quilometragem (KM)</label>
                                    <input
                                        type="text"
                                        required
                                        value={formatKM(formData.mileage)}
                                        onChange={e => setFormData({ ...formData, mileage: parseKM(e.target.value) })}
                                        className={getFieldClassName('mileage', 'w-full p-4 bg-muted/75 border border-border/85 rounded-2xl outline-none font-semibold text-sm text-foreground focus:bg-card focus:border-primary/45 transition-all')}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Cor</label>
                                    <input
                                        type="text"
                                        value={formData.color}
                                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                                        className="w-full p-4 bg-muted/75 border border-border/85 rounded-2xl outline-none font-semibold text-sm text-foreground focus:bg-card focus:border-primary/45 transition-all"
                                        placeholder="Ex: Preto"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Combustível</label>
                                    <select
                                        value={formData.fuelType || 'Flex'}
                                        onChange={e => setFormData({ ...formData, fuelType: e.target.value as FuelType })}
                                        className="w-full p-4 bg-muted/75 border border-border/85 rounded-2xl font-bold text-sm text-foreground focus:bg-card focus:border-primary/45 transition-all cursor-pointer"
                                    >
                                        {FUEL_TYPES.map(t => <option key={t} value={t} className="bg-card text-foreground">{t}</option>)}
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* SPECIFIC FIELDS FOR MOTORCYCLE */}
                        {formData.vehicleCategory === 'moto' ? (
                            <section className="space-y-6 animate-slideIn">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-1.5 h-4 bg-primary rounded-full" />
                                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2"><Zap size={13} /> Especificações de Moto</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Categoria Moto</label>
                                        <select value={formData.motoCategory} onChange={e => setFormData({ ...formData, motoCategory: e.target.value as MotorcycleCategory })} className="w-full p-4 bg-muted/75 border border-border/85 rounded-2xl font-bold text-sm text-foreground focus:bg-card focus:border-primary/45 transition-all cursor-pointer">
                                            {MOTORCYCLE_CATEGORIES.map(t => <option key={t} value={t} className="bg-card text-foreground">{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Tipo de Partida</label>
                                        <select value={formData.startType} onChange={e => setFormData({ ...formData, startType: e.target.value as MotoStartType })} className="w-full p-4 bg-muted/75 border border-border/85 rounded-2xl font-bold text-sm text-foreground focus:bg-card focus:border-primary/45 transition-all cursor-pointer">
                                            {MOTO_START_TYPES.map(t => <option key={t} value={t} className="bg-card text-foreground">{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Freio</label>
                                        <select value={formData.brakeType} onChange={e => setFormData({ ...formData, brakeType: e.target.value as MotoBrakeType })} className="w-full p-4 bg-muted/75 border border-border/85 rounded-2xl font-bold text-sm text-foreground focus:bg-card focus:border-primary/45 transition-all cursor-pointer">
                                            {MOTO_BRAKE_TYPES.map(t => <option key={t} value={t} className="bg-card text-foreground">{t}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Alimentação</label>
                                        <select value={formData.fuelSystem} onChange={e => setFormData({ ...formData, fuelSystem: e.target.value as MotoFuelSystem })} className="w-full p-4 bg-muted/75 border border-border/85 rounded-2xl font-bold text-sm text-foreground focus:bg-card focus:border-primary/45 transition-all cursor-pointer">
                                            {MOTO_FUEL_SYSTEMS.map(t => <option key={t} value={t} className="bg-card text-foreground">{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Arrefecimento</label>
                                        <select value={formData.cooling} onChange={e => setFormData({ ...formData, cooling: e.target.value as MotoCooling })} className="w-full p-4 bg-muted/75 border border-border/85 rounded-2xl font-bold text-sm text-foreground focus:bg-card focus:border-primary/45 transition-all cursor-pointer">
                                            {MOTO_COOLING_OPTIONS.map(t => <option key={t} value={t} className="bg-card text-foreground">{t}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </section>
                        ) : (
                            /* SPECIFIC FIELDS FOR CARS / GENERAL */
                            <section className="space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-1.5 h-4 bg-primary rounded-full" />
                                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2"><Zap size={13} /> Especificações Técnicas</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Tipo Carroceria</label>
                                        <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as VehicleType })} className="w-full p-4 bg-muted/75 border border-border/85 rounded-2xl font-bold text-sm text-foreground focus:bg-card focus:border-primary/45 transition-all cursor-pointer">
                                            {VEHICLE_TYPES.map(t => <option key={t} value={t} className="bg-card text-foreground">{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Câmbio</label>
                                        <select value={formData.transmission} onChange={e => setFormData({ ...formData, transmission: e.target.value as TransmissionType })} className="w-full p-4 bg-muted/75 border border-border/85 rounded-2xl font-bold text-sm text-foreground focus:bg-card focus:border-primary/45 transition-all cursor-pointer">
                                            {TRANSMISSION_TYPES.map(t => <option key={t} value={t} className="bg-card text-foreground">{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Motor</label>
                                        <select value={formData.engine} onChange={e => setFormData({ ...formData, engine: e.target.value as EngineType })} className="w-full p-4 bg-muted/75 border border-border/85 rounded-2xl font-bold text-sm text-foreground focus:bg-card focus:border-primary/45 transition-all cursor-pointer">
                                            {ENGINE_TYPES.map(t => <option key={t} value={t} className="bg-card text-foreground">{t}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Portas</label>
                                        <select
                                            value={formData.doors || 4}
                                            onChange={e => setFormData({ ...formData, doors: parseInt(e.target.value) === 2 ? 2 : 4 })}
                                            className="w-full p-4 bg-muted/75 border border-border/85 rounded-2xl font-bold text-sm text-foreground focus:bg-card focus:border-primary/45 transition-all cursor-pointer"
                                        >
                                            {DOOR_OPTIONS.map(d => <option key={d} value={d} className="bg-card text-foreground">{d} Portas</option>)}
                                        </select>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* General options checklist — recolhível */}
                        <section className="space-y-6">
                            <button
                                type="button"
                                onClick={() => setShowCondicoes(v => !v)}
                                aria-expanded={showCondicoes}
                                className="w-full flex items-center justify-between bg-muted/60 dark:bg-muted/40 hover:bg-muted border border-border/80 p-4 px-6 rounded-2xl transition-all group cursor-pointer shadow-sm"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-6 bg-primary rounded-full shrink-0" />
                                    <h3 className="font-heading font-extrabold text-base md:text-lg text-foreground tracking-tight flex items-center gap-2.5">
                                        <FileText size={18} className="text-primary" /> Condições e Chaves
                                    </h3>
                                    <span className="text-xs font-bold text-muted-foreground px-3 py-1 bg-card rounded-lg border border-border/60 ml-2">
                                        {condicoesCount > 0 ? `${condicoesCount} marcado(s)` : 'Opcional'}
                                    </span>
                                </div>
                                <ChevronDown
                                    size={20}
                                    className={`text-muted-foreground group-hover:text-foreground transition-transform duration-300 ${showCondicoes ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {showCondicoes && (
                            <div className="space-y-6 animate-fadeUp">
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
                                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all gap-2 ${formData[check.key as keyof typeof formData] ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-card border-border/80 text-muted-foreground hover:bg-muted'}`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData[check.key as keyof typeof formData] ? 'bg-primary border-primary text-primary-foreground' : 'bg-card border-border/80'}`}>
                                            {formData[check.key as keyof typeof formData] && <Check size={12} strokeWidth={4} />}
                                        </div>
                                        <span className="text-[9px] font-bold uppercase tracking-widest">{check.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${formData.hasSpareKey ? 'bg-primary/10 border-primary/20' : 'bg-card border-border/80'}`}>
                                    <div>
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Chave Reserva</p>
                                        <p className={`text-sm font-bold mt-0.5 ${formData.hasSpareKey ? 'text-primary' : 'text-muted-foreground'}`}>
                                            {formData.hasSpareKey ? 'Sim' : 'Não'}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={!!formData.hasSpareKey}
                                        onCheckedChange={(val) => setFormData(prev => ({ ...prev, hasSpareKey: val }))}
                                    />
                                </div>

                                <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${formData.hasOwnerManual ? 'bg-primary/10 border-primary/20' : 'bg-card border-border/80'}`}>
                                    <div>
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Manual do Proprietário</p>
                                        <p className={`text-sm font-bold mt-0.5 ${formData.hasOwnerManual ? 'text-primary' : 'text-muted-foreground'}`}>
                                            {formData.hasOwnerManual ? 'Sim' : 'Não'}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={!!formData.hasOwnerManual}
                                        onCheckedChange={(val) => setFormData(prev => ({ ...prev, hasOwnerManual: val }))}
                                    />
                                </div>
                            </div>
                            </div>
                            )}
                        </section>

                        {/* Opcionais checklist — recolhível */}
                        <section className="space-y-6">
                            <button
                                type="button"
                                onClick={() => setShowOpcionais(v => !v)}
                                aria-expanded={showOpcionais}
                                className="w-full flex items-center justify-between bg-muted/60 dark:bg-muted/40 hover:bg-muted border border-border/80 p-4 px-6 rounded-2xl transition-all group cursor-pointer shadow-sm"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-6 bg-amber-500 rounded-full shrink-0" />
                                    <h3 className="font-heading font-extrabold text-base md:text-lg text-foreground tracking-tight flex items-center gap-2.5">
                                        <Shield size={18} className="text-amber-500" /> Opcionais do Veículo
                                    </h3>
                                    <span className="text-xs font-bold text-muted-foreground px-3 py-1 bg-card rounded-lg border border-border/60 ml-2">
                                        {(formData.optionals?.length || 0) > 0 ? `${formData.optionals!.length} selecionado(s)` : 'Opcional'}
                                    </span>
                                </div>
                                <ChevronDown
                                    size={20}
                                    className={`text-muted-foreground group-hover:text-foreground transition-transform duration-300 ${showOpcionais ? 'rotate-180' : ''}`}
                                />
                            </button>
                            <div className={showOpcionais ? 'space-y-6 animate-fadeUp' : 'hidden'}>
                            <div className="flex items-center gap-3 mb-2 sr-only">
                                <h3 className="text-[10px]">Opcionais</h3>
                            </div>

                            <div className="space-y-5">
                                {CATEGORIZED_OPTIONS.map(category => (
                                    <div key={category.label}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className={`w-1 h-3 ${category.color} rounded-full`} />
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{category.label}</p>
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
                                                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                                            : 'bg-card text-muted-foreground border-border/80 hover:border-border hover:bg-muted'
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
                                    className="flex-1 p-4 bg-muted/75 border border-border/85 rounded-2xl outline-none font-semibold text-sm text-foreground focus:bg-card focus:border-primary/45 transition-all"
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
                                    className="px-6 bg-primary text-primary-foreground rounded-2xl hover:bg-primary/95 transition-all shadow-md shadow-primary/20 flex items-center justify-center cursor-pointer"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                            </div>
                        </section>

                        {/* Media and Description Section */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between bg-muted/60 dark:bg-muted/40 border border-border/80 p-4 px-6 rounded-2xl shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-6 bg-cyan-500 rounded-full" />
                                    <h3 className="font-heading font-extrabold text-base md:text-lg text-foreground tracking-tight flex items-center gap-2.5">
                                        <ImagePlus size={18} className="text-cyan-500" /> Galeria de Fotos do Veículo
                                    </h3>
                                </div>
                                {(() => {
                                    const totalCount = [formData.imageUrl, ...(formData.galleryImages || [])].filter(Boolean).length;
                                    return (
                                        <span className="text-xs font-bold text-muted-foreground px-3.5 py-1.5 bg-card rounded-xl border border-border/60">
                                            {totalCount} de 12 fotos
                                        </span>
                                    );
                                })()}
                            </div>

                            {/* Unificação de fotos e upload */}
                            {(() => {
                                const allImages: { url: string; isMain: boolean }[] = [];
                                if (formData.imageUrl) {
                                    allImages.push({ url: formData.imageUrl, isMain: true });
                                }
                                (formData.galleryImages || []).forEach(url => {
                                    if (url && url !== formData.imageUrl) {
                                        allImages.push({ url, isMain: false });
                                    }
                                });

                                const canAddMore = allImages.length < 12;

                                return (
                                    <div className="space-y-6">
                                        {/* Dropzone principal caso NENHUMA foto tenha sido enviada ainda */}
                                        {allImages.length === 0 ? (
                                            <label className="block cursor-pointer group">
                                                <div className="rounded-3xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/60 transition-all p-10 md:p-14 text-center space-y-4 relative overflow-hidden">
                                                    <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 mx-auto group-hover:scale-110 transition-transform">
                                                        {galleryUploading ? <Loader2 size={28} className="animate-spin" /> : <Upload size={28} />}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-base font-extrabold text-foreground tracking-tight">
                                                            {galleryUploading ? 'Enviando fotos...' : 'Adicionar Fotos do Veículo'}
                                                        </p>
                                                        <p className="text-xs font-medium text-muted-foreground max-w-md mx-auto">
                                                            Arraste as fotos para cá ou clique para navegar. Selecione até 12 fotos simultaneamente. A primeira foto será definida como a Capa Principal.
                                                        </p>
                                                    </div>
                                                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl text-xs font-bold uppercase tracking-wider shadow-md shadow-primary/20">
                                                        <Camera size={16} /> Selecionar Fotos
                                                    </div>
                                                </div>
                                                <input
                                                    type="file"
                                                    ref={galleryInputRef}
                                                    accept="image/*"
                                                    multiple
                                                    className="hidden"
                                                    onChange={handleGalleryUpload}
                                                    disabled={galleryUploading}
                                                />
                                            </label>
                                        ) : (
                                            /* Grid de fotos com badges de capa principal e ordenação rápida */
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                                    {allImages.map((item, idx) => (
                                                        <div
                                                            key={item.url + idx}
                                                            className={`relative group aspect-square rounded-2xl overflow-hidden bg-muted border-2 transition-all ${
                                                                item.isMain
                                                                    ? 'border-amber-500 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/20'
                                                                    : 'border-border/80 hover:border-primary/50'
                                                            }`}
                                                        >
                                                            <img src={item.url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />

                                                            {/* Badge Capa Principal */}
                                                            {item.isMain && (
                                                                <div className="absolute top-2 left-2 z-10 px-2.5 py-1 bg-amber-500 text-amber-950 font-black text-[9px] uppercase tracking-wider rounded-lg shadow-md flex items-center gap-1">
                                                                    <Star size={10} className="fill-amber-950 stroke-none" /> Capa
                                                                </div>
                                                            )}

                                                            {/* Overlay de ações ao passar o mouse */}
                                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between items-center z-20">
                                                                <div className="w-full flex justify-end">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeVehicleImage(item.url)}
                                                                        title="Remover foto"
                                                                        className="w-8 h-8 rounded-xl bg-rose-500/90 text-white flex items-center justify-center hover:bg-rose-600 transition-colors shadow-md cursor-pointer"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                                
                                                                {!item.isMain && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setAsMainImage(item.url)}
                                                                        className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-amber-950 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
                                                                    >
                                                                        <Star size={12} className="fill-amber-950 stroke-none" /> Definir Capa
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* Tile de Adicionar Mais Fotos (se houver vagas) */}
                                                    {canAddMore && (
                                                        <label className="block cursor-pointer aspect-square">
                                                            <div className="w-full h-full rounded-2xl border-2 border-dashed border-border/80 hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center p-3 text-center gap-2 text-muted-foreground hover:text-primary">
                                                                {galleryUploading ? (
                                                                    <Loader2 size={22} className="animate-spin text-primary" />
                                                                ) : (
                                                                    <Plus size={24} />
                                                                )}
                                                                <span className="text-[10px] font-bold uppercase tracking-widest leading-tight">
                                                                    {galleryUploading ? 'Enviando...' : 'Adicionar Fotos'}
                                                                </span>
                                                            </div>
                                                            <input
                                                                type="file"
                                                                ref={galleryInputRef}
                                                                accept="image/*"
                                                                multiple
                                                                className="hidden"
                                                                onChange={handleGalleryUpload}
                                                                disabled={galleryUploading}
                                                            />
                                                        </label>
                                                    )}
                                                </div>

                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                                                    Dica: Passe o mouse sobre qualquer foto para definí-la como <span className="text-amber-500 font-extrabold">Capa Principal</span> ou excluir.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </section>

                        {/* Seção de Descrições do Anúncio */}
                        <section className="space-y-6">
                            {/* Botão de IA para preencher as descrições */}
                            <div className="flex items-center justify-between gap-3 pt-2">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                                    Descrições do anúncio
                                </p>
                                <button
                                    type="button"
                                    onClick={handleGenerateDescriptions}
                                    disabled={descGenerating}
                                    title="Gera a descrição curta e a completa com base nos dados preenchidos"
                                    className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50 shadow-sm shadow-primary/20"
                                >
                                    {descGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                    {descGenerating ? 'Gerando...' : 'Gerar com IA'}
                                </button>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Descrição Comercial Curta</label>
                                <input
                                    type="text"
                                    value={formData.shortDescription || ''}
                                    onChange={e => setFormData({ ...formData, shortDescription: e.target.value })}
                                    className="w-full p-4 bg-muted/75 border border-border/85 rounded-2xl outline-none font-semibold text-sm text-foreground focus:bg-card focus:border-primary/45 transition-all"
                                    placeholder="Ex: Completo com teto solar e baixa quilometragem."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Detalhes Adicionais</label>
                                <textarea
                                    value={formData.description || ''}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full p-4 h-32 bg-muted/75 border border-border/85 rounded-2xl outline-none font-semibold text-sm text-foreground focus:bg-card focus:border-primary/45 transition-all"
                                    placeholder="Ex: Manual e chave cópia. Todas as revisões efetuadas em concessionária autorizada..."
                                />
                            </div>
                        </section>
                    </div>
                )}

                {/* ── TAB 2: SEO & META TAGS ────────────────────────────────────── */}
                {activeTab === 'seo' && (
                    <VehicleFormSeo
                        formData={formData}
                        setFormData={setFormData}
                        handleGenerateAI={handleGenerateAI}
                        aiGenerating={aiGenerating}
                    />
                )}

                {/* ── TAB 3: CUSTOS OPERACIONAIS ────────────────────────────────── */}
                {activeTab === 'custos' && (
                    <VehicleFormCosts
                        formData={formData}
                        newCostDesc={newCostDesc}
                        setNewCostDesc={setNewCostDesc}
                        newCostAmount={newCostAmount}
                        setNewCostAmount={setNewCostAmount}
                        addOperationalCost={addOperationalCost}
                        removeOperationalCost={removeOperationalCost}
                        updateOperationalCost={updateOperationalCost}
                        toggleOperationalCostTag={toggleOperationalCostTag}
                        formatCurrency={formatCurrency}
                        parseCurrency={parseCurrency}
                        totalCosts={totalCosts}
                    />
                )}

                {/* ── TAB 4: COMPRA E VENDA ────────────────────────────────────── */}
                {activeTab === 'compra_venda' && (
                    <VehicleFormPricing
                        formData={formData}
                        setFormData={setFormData}
                        formatCurrency={formatCurrency}
                        parseCurrency={parseCurrency}
                        totalCosts={totalCosts}
                        calculatedSuggestedPrice={calculatedSuggestedPrice}
                        errors={errors}
                        getFieldClassName={getFieldClassName}
                    />
                )}
            </form>

            {/* Sticky Bottom Action Bar */}
            {(() => {
                const isDirty = lastSavedSnapshot === null || JSON.stringify(formData) !== lastSavedSnapshot;
                return (
                    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border/80 px-6 py-4 shadow-xl">
                        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs font-bold text-muted-foreground">
                                    {isEditing ? 'Editando veículo' : 'Novo cadastro'}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => { clearDraft(); navigate('/inventory'); }}
                                    className="px-6 py-3.5 text-muted-foreground text-[10px] font-bold uppercase tracking-widest hover:text-foreground transition-colors cursor-pointer"
                                >
                                    Voltar para o Estoque
                                </button>
                                <button
                                    type="submit"
                                    form="vehicle-form"
                                    disabled={uploading || galleryUploading || submitting || !isDirty}
                                    className={`px-8 py-3.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer ${
                                        !isDirty
                                            ? 'bg-muted/80 text-muted-foreground border border-border/80 shadow-none cursor-default opacity-80'
                                            : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 active:scale-95'
                                    }`}
                                >
                                    {submitting ? (
                                        <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Salvando...</span>
                                    ) : !isDirty ? (
                                        <span className="flex items-center gap-2"><Check size={14} className="text-emerald-500 stroke-[3]" /> Salvo no Estoque</span>
                                    ) : isEditing ? (
                                        'Salvar Alterações'
                                    ) : (
                                        'Publicar no Estoque'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </PageContainer>
    );
};

export default VehicleForm;
