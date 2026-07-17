import React, { useState, useMemo, useCallback, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Plus, Search, Filter, Gauge, Calendar, DollarSign,
    Edit3, Trash2, ChevronLeft, Upload, Loader2, X, Check,
    UserCheck, Users, Tag, Send, LayoutGrid, List,
    Bike, Hash, Palette, Zap, AlertCircle, TrendingUp, TrendingDown, Minus, Shield, ImagePlus, FileText
} from 'lucide-react';
import { MotoGridCard, MotoListCard } from './motorcycle-inventory/MotoCards';
import { MotoFilters } from './motorcycle-inventory/MotoFilters';
import { Lead, LeadPhase, SaleDetails, LeadTemperature, Motorcycle, MotorcycleCategory, MotoStartType, MotoFuelSystem, MotoCooling, MotoBrakeType, LeadCommunication } from '../types';
import { Switch } from './ui/switch';
import { motorcycleService } from '../services/motorcycleService';
import { supabase } from '../lib/supabaseClient';
import { resizeImage } from '../utils/imageProcessor';
import { CustomDatePicker } from './ui/CustomDatePicker';
import { formatCurrency, parseCurrency, formatKM, parseKM } from '../utils/formatters';
import { motoDatabase } from '../data/motoDb';
import AutocompleteInput from './ui/AutocompleteInput';
import PlanLimitAlert from './PlanLimitAlert';
import { useData } from '../contexts/DataContext';
import { consultaPlaca } from '../services/plateService';

// ─── Constantes ───────────────────────────────────────────────────────────────

const MOTO_CATEGORIES: MotorcycleCategory[] = ['Naked', 'Sport', 'Trail', 'Custom', 'Scooter', 'Touring', 'Elétrica', 'Street'];
const MOTO_ENGINES = ['110cc', '125cc', '150cc', '160cc', '190cc', '250cc', '300cc', '400cc', '600cc', '750cc', '1000cc', '1200cc+'];
const MOTO_BRANDS = ['Honda', 'Yamaha', 'Kawasaki', 'Suzuki', 'BMW', 'Ducati', 'Harley-Davidson', 'KTM', 'Royal Enfield', 'Triumph', 'Dafra', 'Shineray', 'Haojue', 'Traxx'];

const COMMON_OPTIONS = [
    'Baú', 'Alforje', 'Mala de Tanque', 'Protetor de Motor', 'Slider', 'Manoplas Aquecidas',
    'Painel Digital', 'Freio ABS', 'Controle de Tração', 'Airbag', 'BSS',
    'LED Full', 'GPS Integrado', 'Bluetooth', 'USB', 'Alarme',
    'Windshelf', 'Protetor de Carenagem', 'Guidão Regulável',
    'Amortecedor de Direção', 'Quick Shifter', 'Escapamento Esportivo',
    'Protetor de Mão', 'Modos de Pilotagem'
];

const MOTO_START_TYPES: MotoStartType[] = ['Elétrica', 'Pedal', 'Ambos'];
const MOTO_FUEL_SYSTEMS: MotoFuelSystem[] = ['Injeção Eletrônica', 'Carburador'];
const MOTO_COOLINGS: MotoCooling[] = ['Ar', 'Líquida'];
const MOTO_BRAKE_TYPES: MotoBrakeType[] = ['Disco', 'Tambor', 'ABS', 'CBS', 'Disco + ABS', 'Disco + CBS'];

const EMPTY_MOTO: Omit<Motorcycle, 'id'> = {
    brand: 'Honda', model: '', year: new Date().getFullYear(),
    modelYear: new Date().getFullYear(), plate: '', fipePrice: 0, price: 0,
    category: 'Naked', engine: '150cc', mileage: 0, color: '',
    isSingleOwner: false, hasWarranty: false, isIpvaPaid: false,
    optionals: [], imageUrl: '', galleryImages: [],
    startType: 'Elétrica', fuelSystem: 'Injeção Eletrônica', cooling: 'Ar', brakeType: 'Disco',
    hasSpareKey: false, hasOwnerManual: false,
    shortDescription: '', description: '',
    status: 'available',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
    motorcycles: Motorcycle[];
    leads: Lead[];
    userEmail?: string;
    onDataChange: () => void;
    onAddLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'lastUpdate' | 'funnelHistory'>) => Promise<Lead | null>;
    onViewLead: (id: string) => void;
}

// ──────────────────────────────────────────────────────────────────────────────

const MotorcycleInventory: React.FC<Props> = ({
    motorcycles, leads, userEmail, onDataChange, onAddLead, onViewLead
}) => {
    const navigate = useNavigate();
    const { profile, vehicles } = useData();

    const [selected, setSelected] = useState<Motorcycle | 'new' | null>(null);
    const [inventoryView, setInventoryView] = useState<'available' | 'sold'>('available');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState<'brand' | 'a-z' | 'z-a'>('brand');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({ query: '', priceMin: '', priceMax: '', category: '', yearMin: '', yearMax: '' });
    const clearFilters = useCallback(() => setFilters({ query: '', priceMin: '', priceMax: '', category: '', yearMin: '', yearMax: '' }), []);
    const [uploading, setUploading] = useState(false);
    const [galleryUploading, setGalleryUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [isSellModalOpen, setIsSellModalOpen] = useState(false);
    const [form, setForm] = useState<Omit<Motorcycle, 'id'>>(EMPTY_MOTO);
    const [walkInName, setWalkInName] = useState('');
    const [walkInPhone, setWalkInPhone] = useState('');
    // Guarda o ID do lead selecionado (nunca o nome) — com dois leads
    // homônimos, buscar de volta por nome podia atribuir a venda ao lead
    // errado. Mesmo bug já corrigido em Inventory.tsx.
    const [buyerSelectionId, setBuyerSelectionId] = useState('');
    const [sellData, setSellData] = useState<SaleDetails>({
        salePrice: 0, refurbishmentCosts: 0, saleDate: new Date().toISOString().split('T')[0],
        buyerName: '', buyerLeadId: '', isFollowUpSale: true
    });
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [msgTemplate, setMsgTemplate] = useState('');
    const [msgTargets, setMsgTargets] = useState<Lead[]>([]);
    const [communications, setCommunications] = useState<LeadCommunication[]>([]);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [selectorSearch, setSelectorSearch] = useState('');
    const [selectorSelectedIds, setSelectorSelectedIds] = useState<string[]>([]);
    const [websiteToggles, setWebsiteToggles] = useState<Record<string, boolean>>({});
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [plateError, setPlateError] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // ── Filtro de listagem ──────────────────────────────────────────────────────

    const handleSelectMoto = useCallback((m: Motorcycle) => setSelected(m), []);

    const displayed = useMemo(() => {
        const filtered = motorcycles.filter(m => {
            if (m.status !== inventoryView) return false;
            if (filters.query) {
                const q = filters.query.toLowerCase();
                if (!m.brand.toLowerCase().includes(q) && !m.model.toLowerCase().includes(q) && !m.plate?.toLowerCase().includes(q)) return false;
            }
            if (filters.category && m.category !== filters.category) return false;
            if (filters.priceMin && m.price < parseFloat(filters.priceMin)) return false;
            if (filters.priceMax && m.price > parseFloat(filters.priceMax)) return false;
            if (filters.yearMin && m.year < parseInt(filters.yearMin)) return false;
            if (filters.yearMax && m.year > parseInt(filters.yearMax)) return false;
            return true;
        });
        const sorted = [...filtered];
        if (sortBy === 'brand') sorted.sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model));
        else if (sortBy === 'a-z') sorted.sort((a, b) => a.model.localeCompare(b.model));
        else if (sortBy === 'z-a') sorted.sort((a, b) => b.model.localeCompare(a.model));
        return sorted;
    }, [motorcycles, inventoryView, filters, sortBy]);

    // ── Handle navigation state ────────────────────────────────────────────────
    const location = useLocation();
    React.useEffect(() => {
        if (location.state?.selectedMotorcycleId && motorcycles.length > 0) {
            const found = motorcycles.find(m => m.id === location.state.selectedMotorcycleId);
            if (found) {
                setSelected(found);
                // Clear state to avoid re-selecting on back navigation
                navigate(location.pathname, { replace: true, state: {} });
            }
        }
    }, [location.state, motorcycles, navigate, location.pathname]);

    // ── Leads compatíveis ───────────────────────────────────────────────────────
    const matchingLeads = useMemo(() => {
        if (!selected || selected === 'new') return [];
        const m = selected as Motorcycle;
        return leads.filter(l => {
            if (l.phase === LeadPhase.DISQUALIFIED || l.phase === LeadPhase.COMPLETED) return false;
            const pref = l.preferences;
            if (!pref.interesse_moto) return false;
            const matchesCategory = !pref.tipos_moto?.length || pref.tipos_moto.includes(m.category as any);
            const matchesBrand = !pref.marcas_moto?.length || pref.marcas_moto.some(b => m.brand.toLowerCase().includes(b.toLowerCase()));
            const matchesPrice = !pref.moto_valor_max || m.price <= pref.moto_valor_max;
            return matchesCategory && matchesBrand && matchesPrice;
        });
    }, [selected, leads]);

    // ── Fetch communications ────────────────────────────────────────────────────
    React.useEffect(() => {
        if (selected && selected !== 'new') {
            supabase.from('lead_communications').select('*').eq('vehicle_id', (selected as Motorcycle).id)
                .then(({ data }) => { if (data) setCommunications(data); });
        } else {
            setCommunications([]);
        }
    }, [selected]);

    // ── LocalStorage Draft Management ──────────────────────────────────────────
    React.useEffect(() => {
        const savedSelectedId = localStorage.getItem('moto_inventory_selected_id');
        if (savedSelectedId && !selected) {
            if (savedSelectedId === 'new') {
                setSelected('new');
            } else {
                const found = motorcycles.find(m => m.id === savedSelectedId);
                if (found) setSelected(found);
            }
        }

        const savedFormDraft = localStorage.getItem('moto_form_draft');
        if (savedFormDraft) {
            try {
                const parsed = JSON.parse(savedFormDraft);
                setForm(prev => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error("Error loading moto draft:", e);
            }
        }
    }, [motorcycles.length]);

    React.useEffect(() => {
        if (selected) {
            localStorage.setItem('moto_inventory_selected_id', typeof selected === 'string' ? selected : selected.id);
        } else {
            localStorage.removeItem('moto_inventory_selected_id');
        }
    }, [selected]);

    React.useEffect(() => {
        if (form.model || form.brand || form.price > 0) {
            localStorage.setItem('moto_form_draft', JSON.stringify(form));
        }
    }, [form]);

    const clearDraft = () => {
        localStorage.removeItem('moto_form_draft');
        localStorage.removeItem('moto_inventory_selected_id');
    };

    // ── Handlers ────────────────────────────────────────────────────────────────

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const resized = await resizeImage(file, 1200, 900);
            const { data: { user } } = await supabase.auth.getUser();
            const asFile = new File([resized], 'image.webp', { type: 'image/webp' });
            const url = await motorcycleService.uploadImage(asFile, user!.id);
            setForm(prev => ({ ...prev, imageUrl: url }));
        } catch (err: any) {
            console.error(err);
            alert('Erro ao enviar imagem: ' + (err.message || 'Erro desconhecido'));
        } finally {
            setUploading(false);
        }
    };

    const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const currentCount = form.galleryImages?.length || 0;
        const remaining = 6 - currentCount;
        if (remaining <= 0) return;
        const files = Array.from(e.target.files as FileList).slice(0, remaining) as File[];
        setGalleryUploading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const urls: string[] = [];
            for (const file of files) {
                const resized = await resizeImage(file, 600, 450, 0.82);
                const asFile = new File([resized], 'gallery.webp', { type: 'image/webp' });
                const url = await motorcycleService.uploadGalleryImage(asFile, user!.id);
                urls.push(url);
            }
            setForm(prev => ({ ...prev, galleryImages: [...(prev.galleryImages || []), ...urls] }));
        } catch (err: any) {
            alert('Erro ao enviar fotos da galeria: ' + (err.message || 'Erro desconhecido'));
        } finally {
            setGalleryUploading(false);
            e.target.value = '';
        }
    };

    const removeGalleryImage = (url: string) => {
        setForm(prev => ({ ...prev, galleryImages: (prev.galleryImages || []).filter(u => u !== url) }));
    };

    const getFieldClassName = (field: string, base: string) => `${base} ${formErrors[field] ? 'border-red-300 bg-red-50/60 focus:ring-red-500/10' : ''}`;

    const validateMotoForm = () => {
        const nextErrors: Record<string, string> = {};

        if (!form.brand.trim()) nextErrors.brand = 'Informe a marca.';
        if (!form.model.trim()) nextErrors.model = 'Informe o modelo.';
        if (!form.year) nextErrors.year = 'Informe o ano de fabricação.';
        if (!form.modelYear) nextErrors.modelYear = 'Informe o ano modelo.';
        if (form.modelYear && form.modelYear < form.year) nextErrors.modelYear = 'O ano modelo não pode ser menor que o ano de fabricação.';
        if (!form.price) nextErrors.price = 'Informe o preço de venda.';
        if (form.mileage < 0) nextErrors.mileage = 'A quilometragem não pode ser negativa.';


        setFormErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateMotoForm()) return;

        setSubmitting(true);
        try {
            if (selected === 'new') {
                await motorcycleService.create(form);
            } else if (selected) {
                await motorcycleService.update({ ...(selected as Motorcycle), ...form });
            }
            onDataChange();
            clearDraft();
            setSelected(null);
            setForm(EMPTY_MOTO);
            alert(selected === 'new' ? 'Moto cadastrada com sucesso!' : 'Moto atualizada com sucesso!');
        } catch (err: any) {
            console.error('Erro ao salvar:', err);
            const errorMsg = err.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
            alert('Erro ao salvar moto: ' + errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Excluir esta moto?')) return;
        await motorcycleService.delete(id);
        onDataChange();
        setSelected(null);
    };

    const lookupPlate = async () => {
        const rawPlate = form.plate.replace(/[-\s]/g, '').toUpperCase();
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
            const brand = data.MARCA || data.marca || '';
            const model = data.MODELO || data.modelo || '';
            const year = parseInt(data.ano) || form.year;
            const color = data.cor || extra.cor || '';

            let fipePrice = 0;
            if (data.fipe && data.fipe.dados && data.fipe.dados.length > 0) {
                const fipeItem = data.fipe.dados[0];
                if (fipeItem && fipeItem.texto_valor) {
                    const rawString = fipeItem.texto_valor.replace('R$', '').trim();
                    const numString = rawString.replace(/\./g, '').replace(',', '.');
                    fipePrice = parseFloat(numString);
                }
            }

            const cilindradas = parseInt(extra.cilindradas || '0');
            let engine = form.engine;
            if (cilindradas > 0) {
                const ccStr = cilindradas + 'cc';
                engine = MOTO_ENGINES.find(e => e === ccStr) || (cilindradas >= 1200 ? '1200cc+' : ccStr);
            }

            const seg = ((data.segmento || extra.segmento || '') + ' ' + (data.sub_segmento || extra.sub_segmento || '')).toUpperCase();
            let category = form.category;
            if (seg.includes('SCOOTER') || seg.includes('SCÚTER')) category = 'Scooter';
            else if (seg.includes('TRAIL') || seg.includes('ADVENTURE') || seg.includes('ENDURO')) category = 'Trail';
            else if (seg.includes('SPORT') || seg.includes('ESPORT') || seg.includes('SUPER')) category = 'Sport';
            else if (seg.includes('TOURING') || seg.includes('TURISMO')) category = 'Touring';
            else if (seg.includes('CUSTOM') || seg.includes('CRUISER')) category = 'Custom';
            else if (seg.includes('ELÉTRI') || seg.includes('ELETRI')) category = 'Elétrica';
            else if (seg.includes('STREET') || seg.includes('NAKED')) category = 'Naked';

            setForm(prev => ({
                ...prev,
                brand,
                model,
                year,
                color,
                engine,
                category,
                fipePrice: fipePrice > 0 ? fipePrice : prev.fipePrice,
            }));
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

    const handleOpenSell = () => {
        if (!selected || selected === 'new') return;
        setSellData({ salePrice: (selected as Motorcycle).price, refurbishmentCosts: 0, saleDate: new Date().toISOString().split('T')[0], buyerName: '', buyerLeadId: '', isFollowUpSale: true });
        setBuyerSelectionId('');
        setWalkInName(''); setWalkInPhone('');
        setIsSellModalOpen(true);
    };

    const handleSellSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selected || selected === 'new') return;
        if (!buyerSelectionId) { alert('Selecione um comprador antes de confirmar a venda.'); return; }

        let finalBuyerLeadId: string | undefined;
        let finalBuyerName: string;

        if (buyerSelectionId === 'Venda Avulsa') {
            if (!walkInName || !walkInPhone) { alert('Preencha nome e telefone.'); return; }
            const newLead = await onAddLead({
                name: walkInName, phone: walkInPhone, email: '',
                phase: LeadPhase.COMPLETED, temperature: LeadTemperature.HOT,
                preferences: { tipos_veiculo: [], marcas: [], modelos: [], transmissao: ['Qualquer Um(a)'], motorizacao: ['Qualquer Um(a)'], observacoes_adicionais: 'Venda Avulsa de Moto', possui_entrada: false, possui_troca: false, veiculo_troca: '' },
                presentedVehicles: [(selected as Motorcycle).id], source: 'Venda Avulsa', notes: ''
            });
            if (newLead) { finalBuyerLeadId = newLead.id; finalBuyerName = newLead.name; }
            else return;
        } else {
            const selectedLead = leads.find(l => l.id === buyerSelectionId);
            if (!selectedLead) { alert('Selecione um comprador válido.'); return; }
            finalBuyerLeadId = selectedLead.id;
            finalBuyerName = selectedLead.name;
        }

        await motorcycleService.sell((selected as Motorcycle).id, { ...sellData, buyerName: finalBuyerName, buyerLeadId: finalBuyerLeadId });
        onDataChange();
        setIsSellModalOpen(false);
        setBuyerSelectionId('');
        setSelected(null);
    };

    const handleToggleWebsite = (m: Motorcycle) => {
        const isNowVisible = m.showOnWebsite !== false;
        setWebsiteToggles(prev => ({ ...prev, [m.id]: isNowVisible }));
        motorcycleService.update(m).catch(console.error);
        setNotification({
            message: isNowVisible ? 'Moto adicionada ao site público!' : 'Moto removida do site público!',
            type: isNowVisible ? 'success' : 'error'
        });
        setTimeout(() => setNotification(null), 3000);
    };

    const prepareMessageModal = (target: 'single' | 'all' | 'new', lead?: Lead) => {
        let targets: Lead[] = [];
        if (target === 'single' && lead) targets = [lead];
        else if (target === 'all') targets = matchingLeads;
        else if (target === 'new') targets = matchingLeads.filter(l => !communications.some(c => c.lead_id === l.id));
        if (targets.length === 0) { alert('Nenhum lead encontrado para este envio.'); return; }
        setMsgTargets(targets);
        setMsgTemplate('Olá {{nome}}, temos uma moto incrível: {{marca}} {{modelo}} {{ano}} por R$ {{valor}}. Quer saber mais?');
        setIsMessageModalOpen(true);
    };

    const handleSendMsg = async () => {
        if (!selected || selected === 'new') return;
        const m = selected as Motorcycle;
        setUploading(true);
        try {
            for (const lead of msgTargets) {
                const msg = msgTemplate
                    .replace(/{{nome}}/g, lead.name)
                    .replace(/{{marca}}/g, m.brand)
                    .replace(/{{modelo}}/g, m.model)
                    .replace(/{{ano}}/g, String(m.year))
                    .replace(/{{valor}}/g, m.price.toLocaleString());
                const { data: inserted } = await supabase.from('lead_communications').insert({
                    lead_id: lead.id, vehicle_id: m.id,
                    contact_name: lead.name, contact_phone: lead.phone,
                    message_body: msg, is_sent: 'não', email_user: userEmail
                }).select('id').single();
                try {
                    await fetch('https://webhook.orvalhodigital.com.br/webhook/puxa-mensagem', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            message_id: inserted?.id, lead_id: lead.id,
                            name: lead.name, phone: lead.phone, message: msg, user_email: userEmail,
                            vehicle: { id: m.id, brand: m.brand, model: m.model }
                        })
                    });
                } catch { /* webhook não bloqueia */ }
            }
            const { data } = await supabase.from('lead_communications').select('*').eq('vehicle_id', m.id);
            if (data) setCommunications(data);
            setIsMessageModalOpen(false);
            alert(`Mensagem registrada para ${msgTargets.length} lead(s)!`);
        } catch { alert('Erro ao registrar mensagens.'); }
        finally { setUploading(false); }
    };

    const openEdit = (m: Motorcycle) => {
        setSelected(m);
        setForm({
            brand: m.brand, model: m.model, year: m.year, modelYear: m.modelYear ?? m.year,
            plate: m.plate ?? '', fipePrice: m.fipePrice, price: m.price,
            category: m.category, engine: m.engine, mileage: m.mileage, color: m.color,
            isSingleOwner: m.isSingleOwner, hasWarranty: m.hasWarranty, isIpvaPaid: m.isIpvaPaid,
            hasSpareKey: m.hasSpareKey ?? false, hasOwnerManual: m.hasOwnerManual ?? false,
            shortDescription: m.shortDescription || '', description: m.description || '',
            optionals: m.optionals, imageUrl: m.imageUrl, galleryImages: m.galleryImages ?? [],
            status: m.status, saleDetails: m.saleDetails,
            startType: m.startType || 'Elétrica',
            fuelSystem: m.fuelSystem || 'Injeção Eletrônica',
            cooling: m.cooling || 'Ar',
            brakeType: m.brakeType || 'Disco'
        });
        setSelected(m);
    };

    // ── DETAIL VIEW ─────────────────────────────────────────────────────────────
    if (selected && selected !== 'new') {
        const m = selected as Motorcycle;
        return (
            <div className="animate-fadeUp max-w-[1400px] mx-auto w-full pb-20">
                <div className="flex items-center justify-between mb-8">
                    <button onClick={() => setSelected(null)} className="flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-colors group">
                        <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center group-hover:bg-slate-50"><ChevronLeft size={20} /></div>
                        <span className="font-extrabold text-xs uppercase tracking-widest">Voltar ao Estoque</span>
                    </button>
                    <div className="flex gap-3">
                        {m.status === 'available' && (
                            <button onClick={handleOpenSell} className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 text-white rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-brand-500/20 hover:bg-brand-600 transition-all">
                                <DollarSign size={16} /> Registrar Venda
                            </button>
                        )}
                        <button onClick={() => openEdit(m)} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-100 rounded-xl text-slate-500 font-extrabold text-xs uppercase tracking-wider hover:text-blue-600 hover:border-blue-100 hover:bg-blue-50 transition-all">
                            <Edit3 size={16} /> Editar
                        </button>
                        <button onClick={() => handleDelete(m.id)} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-100 rounded-xl text-slate-500 font-extrabold text-xs uppercase tracking-wider hover:text-red-600 hover:border-red-100 hover:bg-red-50 transition-all">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className={`bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden ${m.status === 'sold' ? 'opacity-90' : ''}`}>
                            {m.imageUrl ? (
                                <div className="w-full aspect-square max-h-[600px] mb-8 rounded-[2rem] overflow-hidden relative group">
                                    <img src={m.imageUrl} alt={m.model} className="w-full h-full object-cover" />
                                    
                                    {/* Gallery Dots overlay */}
                                    {(m.galleryImages?.length ?? 0) > 0 && (
                                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                                            <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
                                            {m.galleryImages?.map((_, i) => (
                                                <div key={i} className="w-2.5 h-2.5 rounded-full bg-white/40" />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="absolute top-0 right-0 p-10 opacity-5"><Bike size={300} /></div>
                            )}

                            {/* Mini Gallery Row */}
                            {(m.galleryImages?.length ?? 0) > 0 && (
                                <div className="grid grid-cols-6 gap-3 mb-10">
                                    <div className="aspect-square rounded-xl overflow-hidden border-2 border-brand-500 shadow-lg shadow-brand-500/10 cursor-pointer">
                                        <img src={m.imageUrl} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    {m.galleryImages?.map((url, i) => (
                                        <div key={i} className="aspect-square rounded-xl overflow-hidden border border-slate-100 hover:border-brand-200 transition-all cursor-pointer opacity-60 hover:opacity-100">
                                            <img src={url} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="text-[10px] font-extrabold text-brand-600 uppercase tracking-widest bg-brand-50 px-4 py-1.5 rounded-lg border border-brand-100/50">{m.category}</span>
                                        {m.isSingleOwner && <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest bg-slate-100 px-4 py-1.5 rounded-lg">Único Dono</span>}
                                        {m.hasWarranty && <span className="text-[10px] font-extrabold text-blue-500 uppercase tracking-widest bg-blue-50 px-4 py-1.5 rounded-lg">Garantia</span>}
                                        {m.isIpvaPaid && <span className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-4 py-1.5 rounded-lg">IPVA Pago</span>}
                                    </div>
                                    {m.status === 'sold' && <span className="text-xs font-black text-white bg-red-500 px-4 py-2 rounded-lg uppercase tracking-widest shadow-lg shadow-red-500/20">Vendida</span>}
                                </div>

                                <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-[0.9] uppercase mb-4">
                                    {m.brand} <br /> {m.model}
                                </h1>
                                <div className="flex items-end gap-4 mb-4">
                                    <p className="text-4xl font-black text-brand-500 tracking-tighter">R$ {(m.price || 0).toLocaleString('pt-BR')}</p>
                                    {m.fipePrice ? (
                                        <div className="mb-1">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tabela FIPE</p>
                                            <p className="text-xs font-bold text-slate-400">R$ {(m.fipePrice || 0).toLocaleString('pt-BR')}</p>
                                        </div>
                                    ) : null}
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 mt-12 pt-12 border-t border-slate-50">
                                    {[
                                        { label: 'Quilometragem', value: `${m.mileage.toLocaleString()} km`, icon: Gauge },
                                        { label: 'Ano Modelo', value: `${m.year}${m.modelYear && m.modelYear !== m.year ? ' / ' + m.modelYear : ''}`, icon: Calendar },
                                        { label: 'Cilindrada', value: m.engine, icon: Zap },
                                        { label: 'Cor', value: m.color || 'N/A', icon: Palette },
                                        { label: 'Placa', value: m.plate || 'N/A', icon: Hash },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 shrink-0"><item.icon size={20} /></div>
                                            <div>
                                                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">{item.label}</p>
                                                <p className="text-lg font-bold text-slate-900 mt-0.5">{item.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-10 pt-8 border-t border-slate-50">
                                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Tag size={14} /> Opcionais</h3>
                                    <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-wrap gap-3">
                                        {m.optionals.length > 0 ? m.optionals.map((o, i) => (
                                            <span key={i} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 uppercase tracking-wide shadow-sm">{o}</span>
                                        )) : <span className="text-slate-400 text-sm font-medium italic">Nenhum opcional cadastrado.</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {m.status === 'sold' && m.saleDetails && (
                            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white">
                                <h3 className="text-lg font-extrabold tracking-tight mb-6 flex items-center gap-3"><Check size={24} className="text-brand-400" /> Detalhes da Venda</h3>
                                <div className="grid grid-cols-3 gap-8">
                                    <div><p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Valor</p><p className="text-3xl font-black text-brand-400">R$ {m.saleDetails.salePrice.toLocaleString()}</p></div>
                                    <div><p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Data</p><p className="text-xl font-bold">{new Date(m.saleDetails.saleDate).toLocaleDateString()}</p></div>
                                    <div><p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Comprador</p><p className="text-xl font-bold">{m.saleDetails.buyerName}</p></div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-2"><UserCheck size={24} className="text-brand-500" /><h3 className="text-lg font-extrabold text-slate-900">Leads Compatíveis</h3></div>
                            <p className="text-slate-400 text-sm font-medium mb-4">Encontramos <strong className="text-slate-900">{matchingLeads.length} leads</strong> com perfil de moto.</p>
                            <div className="flex gap-2 mb-2">
                                <button onClick={() => prepareMessageModal('all')} className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-widest hover:bg-slate-800 transition-all">Enviar p/ Todos</button>
                                <button onClick={() => prepareMessageModal('new')} className="flex-1 py-3 bg-brand-50 text-brand-600 border border-brand-100 rounded-xl text-[10px] font-extrabold uppercase tracking-widest hover:bg-brand-100 transition-all">Enviar p/ Novos</button>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {matchingLeads.map(lead => {
                                const hasReceived = communications.some(c => c.lead_id === lead.id);
                                return (
                                <div key={lead.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md hover:border-brand-200 transition-all group cursor-pointer relative">
                                    {hasReceived && (
                                        <div className="absolute top-6 right-6 w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-600" title="Mensagem já enviada">
                                            <Check size={16} strokeWidth={3} />
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-lg text-slate-300 group-hover:bg-brand-500 group-hover:text-white transition-colors">{lead.name.charAt(0)}</div>
                                        <div>
                                            <p className="font-extrabold text-slate-900 uppercase leading-none">{lead.name}</p>
                                            <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mt-1">Orçamento: R$ {lead.preferences.moto_valor_max?.toLocaleString() || '—'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => prepareMessageModal('single', lead)} className="flex-1 py-3 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-extrabold uppercase tracking-widest group-hover:bg-slate-900 group-hover:text-white transition-colors flex items-center justify-center gap-2">
                                            <Send size={14} /> Mensagem
                                        </button>
                                        <button onClick={() => onViewLead(lead.id)} className="flex-1 py-3 bg-white border border-slate-100 text-slate-400 rounded-xl text-[10px] font-extrabold uppercase tracking-widest hover:bg-slate-50 transition-colors">Ver Lead</button>
                                    </div>
                                </div>
                                );
                            })}
                            {matchingLeads.length === 0 && <div className="text-center py-10 opacity-50"><Users size={48} className="mx-auto text-slate-300 mb-4" /><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum lead compatível</p></div>}
                        </div>
                        <button onClick={() => { setSelectorSelectedIds([]); setSelectorSearch(''); setIsSelectorOpen(true); }} className="w-full py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-extrabold uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center justify-center gap-2">
                            <Users size={16} /> Enviar p/ Outro Lead
                        </button>
                    </div>
                </div>

                {isSellModalOpen && (
                    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[10000] flex items-center justify-center p-6" onClick={() => setIsSellModalOpen(false)}>
                        <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-fadeUp" onClick={e => e.stopPropagation()}>
                            <form onSubmit={handleSellSubmit}>
                                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                    <div><h2 className="text-lg font-extrabold text-slate-900 uppercase">Registrar Venda</h2><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.brand} {m.model}</p></div>
                                    <button type="button" onClick={() => setIsSellModalOpen(false)}><X size={24} className="text-slate-300" /></button>
                                </div>
                                <div className="p-10 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preço Final</label>
                                        <input type="text" required value={formatCurrency(sellData.salePrice)} onChange={e => setSellData({ ...sellData, salePrice: parseCurrency(e.target.value) })} className="w-full p-4 bg-brand-50 border border-brand-100 text-brand-700 rounded-2xl font-black outline-none text-lg" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data da Venda</label>
                                        <CustomDatePicker value={sellData.saleDate} onChange={date => setSellData({ ...sellData, saleDate: date })} className="w-full py-4 px-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none text-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Comprador</label>
                                        <select value={buyerSelectionId} onChange={e => setBuyerSelectionId(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none text-sm">
                                            <option value="">Selecionar lead...</option>
                                            <option value="Venda Avulsa">Venda Avulsa (Novo Cliente)</option>
                                            {leads.filter(l => l.phase !== LeadPhase.DISQUALIFIED).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                        </select>
                                    </div>
                                    {buyerSelectionId === 'Venda Avulsa' && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nome</label><input type="text" value={walkInName} onChange={e => setWalkInName(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 outline-none text-sm" /></div>
                                            <div className="space-y-2"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Telefone</label><input type="text" value={walkInPhone} onChange={e => setWalkInPhone(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 outline-none text-sm" /></div>
                                        </div>
                                    )}
                                </div>
                                <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                                    <button type="button" onClick={() => setIsSellModalOpen(false)} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Cancelar</button>
                                    <button type="submit" className="flex-[2] py-4 bg-brand-500 text-white rounded-2xl text-[11px] font-extrabold uppercase tracking-widest hover:bg-brand-600 transition-all shadow-xl shadow-brand-500/20">Confirmar Venda</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {isMessageModalOpen && (
                    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[10000] flex items-center justify-center p-6" onClick={() => setIsMessageModalOpen(false)}>
                        <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl animate-fadeUp overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                <div><h2 className="text-lg font-extrabold text-slate-900 uppercase">Enviar Mensagem</h2><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Para: {msgTargets.length > 1 ? `${msgTargets.length} leads` : msgTargets[0]?.name}</p></div>
                                <button onClick={() => setIsMessageModalOpen(false)}><X size={24} className="text-slate-300" /></button>
                            </div>
                            <div className="p-8 space-y-4">
                                <textarea value={msgTemplate} onChange={e => setMsgTemplate(e.target.value)} className="w-full h-36 p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium text-sm text-slate-700 resize-none leading-relaxed" />
                                <div className="flex gap-2 flex-wrap">
                                    {['{{nome}}', '{{marca}}', '{{modelo}}', '{{ano}}', '{{valor}}'].map(tag => (
                                        <button key={tag} onClick={() => setMsgTemplate(p => p + ' ' + tag)} className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-500 hover:bg-brand-50 hover:text-brand-600 transition-colors">{tag}</button>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium italic">* Clique nas tags para adicionar ao texto.</p>
                            </div>
                            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                                <button onClick={() => setIsMessageModalOpen(false)} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Cancelar</button>
                                <button onClick={handleSendMsg} disabled={uploading} className="flex-[2] py-4 bg-brand-500 text-white rounded-2xl text-[11px] font-extrabold uppercase tracking-widest hover:bg-brand-600 flex items-center justify-center gap-2 shadow-xl shadow-brand-500/20 disabled:opacity-60"><Send size={16} /> {uploading ? 'Enviando...' : 'Registrar Envio'}</button>
                            </div>
                        </div>
                    </div>
                )}

                {isSelectorOpen && (
                    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[10000] flex items-center justify-center p-6" onClick={() => setIsSelectorOpen(false)}>
                        <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl animate-fadeUp overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                <div><h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight">Selecionar Leads</h2><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selecione os contatos para enviar a mensagem</p></div>
                                <button onClick={() => setIsSelectorOpen(false)} className="text-slate-300 hover:text-slate-900 transition-colors"><X size={24} /></button>
                            </div>
                            <div className="p-6 border-b border-slate-50">
                                <div className="relative mb-4">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                    <input autoFocus type="text" placeholder="Buscar por nome ou telefone..." className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-brand-500 transition-colors" value={selectorSearch} onChange={e => setSelectorSearch(e.target.value)} />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2">
                                <div className="space-y-1">
                                    {leads.filter(l => l.name.toLowerCase().includes(selectorSearch.toLowerCase()) || l.phone.includes(selectorSearch)).map(lead => {
                                        const isSelected = selectorSelectedIds.includes(lead.id);
                                        return (
                                            <div key={lead.id} onClick={() => setSelectorSelectedIds(prev => isSelected ? prev.filter(id => id !== lead.id) : [...prev, lead.id])}
                                                className={`p-4 rounded-xl flex items-center gap-4 cursor-pointer transition-colors border ${isSelected ? 'bg-brand-50 border-brand-200' : 'bg-white border-transparent hover:bg-slate-50'}`}>
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-brand-500 border-brand-500 text-white' : 'border-slate-300 bg-white'}`}>
                                                    {isSelected && <Check size={12} strokeWidth={4} />}
                                                </div>
                                                <div className="flex-1"><p className="font-extrabold text-slate-900 uppercase text-xs">{lead.name}</p><p className="text-[10px] font-bold text-slate-400">{lead.phone}</p></div>
                                                <div className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${lead.phase === LeadPhase.DISQUALIFIED ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-500'}`}>{lead.phase}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{selectorSelectedIds.length} selecionados</div>
                                <div className="flex gap-3">
                                    {selectorSelectedIds.length > 0 && <button onClick={() => setSelectorSelectedIds([])} className="px-4 py-3 text-slate-400 hover:text-slate-600 font-extrabold text-[10px] uppercase tracking-widest transition-colors">Limpar</button>}
                                    <button disabled={selectorSelectedIds.length === 0}
                                        onClick={() => {
                                            const selected = leads.filter(l => selectorSelectedIds.includes(l.id));
                                            if (!selected.length) return;
                                            setMsgTargets(selected);
                                            setIsSelectorOpen(false);
                                            setMsgTemplate('Olá {{nome}}, temos uma moto incrível: {{marca}} {{modelo}} {{ano}} por R$ {{valor}}. Quer saber mais?');
                                            setIsMessageModalOpen(true);
                                        }}
                                        className="px-8 py-3 bg-brand-500 text-white rounded-xl font-extrabold text-[10px] uppercase tracking-widest hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                        Prosseguir
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ── FORM VIEW (new / edit) ───────────────────────────────────────────────────
    if (selected) {
        const isFreePlan = !profile?.plan || profile.plan === 'free' || profile.plan === 'trial';
        if (selected === 'new' && isFreePlan && (vehicles.length + motorcycles.length) >= 10) {
            return (
                <div className="animate-fadeUp max-w-4xl mx-auto w-full pb-20">
                    <div className="flex items-center justify-between mb-8">
                        <button onClick={() => { setSelected(null); setForm(EMPTY_MOTO); }} className="flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-colors group">
                            <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center group-hover:bg-slate-50"><ChevronLeft size={20} /></div>
                            <span className="font-extrabold text-xs uppercase tracking-widest">Cancelar</span>
                        </button>
                    </div>
                    <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
                        <PlanLimitAlert
                            plan={profile?.plan || 'free'}
                            featureName="Veículos"
                            currentCount={vehicles.length + motorcycles.length}
                            limit={10}
                            email={profile?.email}
                        />
                    </div>
                </div>
            );
        }

        return (
            <div className="animate-fadeUp max-w-4xl mx-auto w-full pb-20">
                <div className="flex items-center justify-between mb-8">
                    <button onClick={() => { setSelected(null); setForm(EMPTY_MOTO); }} className="flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-colors group">
                        <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center group-hover:bg-slate-50"><ChevronLeft size={20} /></div>
                        <span className="font-extrabold text-xs uppercase tracking-widest">Cancelar</span>
                    </button>
                </div>

                <form onSubmit={handleSave} className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-8">
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{selected === 'new' ? 'Nova Moto' : 'Editar Moto'}</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Marca</label>
                            <AutocompleteInput
                                value={form.brand}
                                onChangeValue={(val) => setForm({ ...form, brand: val })}
                                suggestions={Object.keys(motoDatabase)}
                                placeholder="Ex: Honda"
                                required
                                className={getFieldClassName('brand', 'w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none')}
                            />
                            {formErrors.brand && <p className="text-[10px] font-bold text-red-500 px-1">{formErrors.brand}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Modelo</label>
                            <AutocompleteInput
                                value={form.model}
                                onChangeValue={(val) => {
                                    const suggestions = motoDatabase[form.brand] || [];
                                    const match = suggestions.find(s => s.name === val);
                                    if (match) {
                                        setForm({
                                            ...form,
                                            model: val,
                                            category: match.category as MotorcycleCategory,
                                            engine: match.engine
                                        });
                                    } else {
                                        setForm({ ...form, model: val });
                                    }
                                }}
                                suggestions={(motoDatabase[form.brand] || []).map(m => m.name)}
                                placeholder="Ex: CB 300F"
                                className={getFieldClassName('model', 'w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none')}
                            />
                            {formErrors.model && <p className="text-[10px] font-bold text-red-500 px-1">{formErrors.model}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Categoria</label>
                            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value as MotorcycleCategory }))} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none text-sm focus:border-brand-400">
                                {MOTO_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Cilindrada</label>
                            <select value={form.engine} onChange={e => setForm(p => ({ ...p, engine: e.target.value }))} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none text-sm focus:border-brand-400">
                                {MOTO_ENGINES.map(e => <option key={e}>{e}</option>)}
                                {form.engine && !MOTO_ENGINES.includes(form.engine) && <option value={form.engine}>{form.engine}</option>}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Ano Fabr.</label>
                            <input type="number" required value={form.year} onChange={e => setForm(p => ({ ...p, year: +e.target.value }))} className={getFieldClassName('year', 'w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none text-sm focus:border-brand-400')} />
                            {formErrors.year && <p className="text-[10px] font-bold text-red-500 px-1">{formErrors.year}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Ano Modelo</label>
                            <input type="number" value={form.modelYear ?? form.year} onChange={e => setForm(p => ({ ...p, modelYear: +e.target.value }))} className={getFieldClassName('modelYear', 'w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none text-sm focus:border-brand-400')} />
                            {formErrors.modelYear && <p className="text-[10px] font-bold text-red-500 px-1">{formErrors.modelYear}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Quilometragem</label>
                            <input type="text" required value={formatKM(form.mileage)} onChange={e => setForm(p => ({ ...p, mileage: parseKM(e.target.value) }))} className={getFieldClassName('mileage', 'w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none text-sm focus:border-brand-400')} />
                            {formErrors.mileage && <p className="text-[10px] font-bold text-red-500 px-1">{formErrors.mileage}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Cor</label>
                            <input type="text" placeholder="Preta, Vermelha..." value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none text-sm focus:border-brand-400" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Placa</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="ABC1234"
                                    value={form.plate ?? ''}
                                    onChange={e => {
                                        setPlateError(null);
                                        setForm(p => ({ ...p, plate: e.target.value.toUpperCase() }));
                                    }}
                                    onKeyDown={handlePlateKeyDown}
                                    maxLength={8}
                                    className="flex-1 min-w-0 p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-500/5 transition-all font-semibold text-sm uppercase"
                                />
                                <button
                                    type="button"
                                    onClick={lookupPlate}
                                    disabled={lookupLoading}
                                    title="Consultar placa"
                                    className="shrink-0 w-14 h-14 flex items-center justify-center rounded-2xl bg-brand-500 hover:bg-brand-600 active:scale-95 text-white transition-all shadow-sm disabled:opacity-60"
                                >
                                    {lookupLoading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                                </button>
                            </div>
                            {plateError && (
                                <p className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 px-1 pt-1">
                                    <AlertCircle size={11} /> {plateError}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Preço de Venda</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 mt-[1px] text-brand-700 font-bold text-sm">R$</span>
                                <input
                                    type="text"
                                    required
                                    value={formatCurrency(form.price)}
                                    onChange={e => setForm(p => ({ ...p, price: parseCurrency(e.target.value) }))}
                                    className={getFieldClassName('price', 'w-full p-4 pl-12 bg-brand-50 text-brand-700 border border-brand-100 rounded-2xl outline-none font-bold text-sm')}
                                />
                            </div>
                            {formErrors.price && <p className="text-[10px] font-bold text-red-500 px-1">{formErrors.price}</p>}
                            {form.fipePrice ? (() => {
                                const diff = form.price && form.fipePrice ? ((form.price - form.fipePrice) / form.fipePrice) * 100 : 0;
                                const absDiff = Math.abs(diff).toFixed(1);
                                const isAbove = diff > 0.5;
                                const isBelow = diff < -0.5;
                                return (
                                    <div className="mt-2 grid grid-cols-2 gap-2">
                                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                                            <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-1">Tabela FIPE</p>
                                            <p className="text-sm font-bold text-blue-700">R$ {formatCurrency(form.fipePrice)}</p>
                                        </div>
                                        <div className={`p-3 rounded-xl border flex items-center gap-2 ${isAbove ? 'bg-orange-50 border-orange-100' : isBelow ? 'bg-brand-50 border-brand-100' : 'bg-slate-50 border-slate-100'}`}>
                                            {isAbove ? <TrendingUp size={16} className="text-orange-500 shrink-0" /> : isBelow ? <TrendingDown size={16} className="text-brand-500 shrink-0" /> : <Minus size={16} className="text-slate-400 shrink-0" />}
                                            <div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">vs FIPE</p>
                                                <p className={`text-sm font-black ${isAbove ? 'text-orange-600' : isBelow ? 'text-brand-600' : 'text-slate-500'}`}>
                                                    {isAbove ? '+' : isBelow ? '-' : ''}{absDiff}%
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })() : null}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                            { key: 'isSingleOwner', label: 'Único Dono' },
                            { key: 'hasWarranty', label: 'Garantia' },
                            { key: 'isIpvaPaid', label: 'IPVA Pago' },
                        ].map(({ key, label }) => (
                            <label key={key} className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${(form as any)[key] ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${(form as any)[key] ? 'bg-brand-500 border-brand-500 text-white' : 'border-slate-300'}`}>
                                    {(form as any)[key] && <Check size={12} strokeWidth={4} />}
                                </div>
                                <input type="checkbox" className="hidden" checked={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))} />
                                <span className="font-extrabold text-xs uppercase tracking-widest">{label}</span>
                            </label>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Zap size={13} /> Especificações Técnicas</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Partida</label>
                                <select value={form.startType || 'Elétrica'} onChange={e => setForm(p => ({ ...p, startType: e.target.value as MotoStartType }))} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm appearance-none cursor-pointer">
                                    {MOTO_START_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Freio</label>
                                <select value={form.brakeType || 'Disco'} onChange={e => setForm(p => ({ ...p, brakeType: e.target.value as MotoBrakeType }))} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm appearance-none cursor-pointer">
                                    {MOTO_BRAKE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Alimentação</label>
                                <select value={form.fuelSystem || 'Injeção Eletrônica'} onChange={e => setForm(p => ({ ...p, fuelSystem: e.target.value as MotoFuelSystem }))} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm appearance-none cursor-pointer">
                                    {MOTO_FUEL_SYSTEMS.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Refrigeração</label>
                                <select value={form.cooling || 'Ar'} onChange={e => setForm(p => ({ ...p, cooling: e.target.value as MotoCooling }))} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm appearance-none cursor-pointer">
                                    {MOTO_COOLINGS.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-4 bg-brand-500 rounded-full" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Descrições do Anúncio</h3>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Descrição Curta (SEO)</label>
                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{form.shortDescription?.length || 0}/160</span>
                            </div>
                            <textarea
                                value={form.shortDescription}
                                onChange={e => setForm({ ...form, shortDescription: e.target.value })}
                                placeholder="Ex: Oferta imperdível! Moto em excelente estado, revisada e com garantia. Confira agora!"
                                maxLength={160}
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-500/5 transition-all font-medium text-sm h-24 resize-none"
                            />
                            <p className="text-[9px] font-medium text-slate-400 px-1 italic">Dica: Este texto aparece abaixo do título nas pesquisas do Google.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1">Descrição Longa / Detalhes</label>
                            <textarea
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                placeholder="Descreva detalhadamente a moto, acessórios, histórico de manutenção, etc..."
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-brand-500/5 transition-all font-medium text-sm h-48 resize-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-4 bg-violet-500 rounded-full" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><FileText size={13} /> Documentação</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${form.hasSpareKey ? 'bg-violet-50 border-violet-200' : 'bg-white border-slate-100'}`}>
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Chave Reserva</p>
                                    <p className={`text-sm font-bold mt-0.5 ${form.hasSpareKey ? 'text-violet-700' : 'text-slate-400'}`}>{form.hasSpareKey ? 'Sim' : 'Não'}</p>
                                </div>
                                <Switch checked={!!form.hasSpareKey} onCheckedChange={(val) => setForm(p => ({ ...p, hasSpareKey: val }))} />
                            </div>
                            <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${form.hasOwnerManual ? 'bg-violet-50 border-violet-200' : 'bg-white border-slate-100'}`}>
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Manual do Proprietário</p>
                                    <p className={`text-sm font-bold mt-0.5 ${form.hasOwnerManual ? 'text-violet-700' : 'text-slate-400'}`}>{form.hasOwnerManual ? 'Sim' : 'Não'}</p>
                                </div>
                                <Switch checked={!!form.hasOwnerManual} onCheckedChange={(val) => setForm(p => ({ ...p, hasOwnerManual: val }))} />
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Final da Placa</p>
                                    <p className="text-2xl font-black text-slate-700 mt-0.5 tracking-widest">
                                        {form.plate?.replace(/[-\s]/g, '').slice(-1).toUpperCase() || '—'}
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                    <Hash size={18} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Shield size={13} /> Opcionais</label>
                        <div className="flex flex-wrap gap-2">
                            {COMMON_OPTIONS.map(opt => {
                                const active = form.optionals.includes(opt);
                                return (
                                    <button key={opt} type="button" onClick={() => setForm(p => ({ ...p, optionals: active ? p.optionals.filter(o => o !== opt) : [...p.optionals, opt] }))}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all border ${active ? 'bg-brand-500 text-white border-brand-500' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-brand-300'}`}>
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-4 bg-cyan-500 rounded-full" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><ImagePlus size={13} /> Mídia da Moto</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Foto Principal</label>
                                <div className="aspect-square max-w-[280px] rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden relative group">
                                    {form.imageUrl ? (
                                        <>
                                            <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button type="button" onClick={() => setForm(p => ({ ...p, imageUrl: '' }))} className="w-12 h-12 rounded-full bg-white text-red-500 flex items-center justify-center shadow-xl"><X size={20} /></button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-3">
                                            <Upload size={40} strokeWidth={1} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Nenhuma Foto</span>
                                        </div>
                                    )}
                                </div>
                                <label className="block w-full cursor-pointer group">
                                    <div className={`max-w-[280px] w-full py-3.5 px-6 rounded-2xl border transition-all text-center flex items-center justify-center gap-3 ${uploading ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200 hover:border-brand-500 hover:bg-brand-50'}`}>
                                        {uploading ? <Loader2 size={16} className="animate-spin text-brand-500" /> : <Upload size={16} className="text-slate-400 group-hover:text-brand-500" />}
                                        <span className={`text-[11px] font-black uppercase tracking-widest ${uploading ? 'text-slate-400' : 'text-slate-600 group-hover:text-brand-600'}`}>{uploading ? 'Enviando...' : 'Fazer Upload'}</span>
                                    </div>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                                </label>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Galeria</label>
                                    <span className="text-[10px] font-bold text-slate-300">{form.galleryImages?.length || 0}/6</span>
                                </div>
                                {(form.galleryImages?.length ?? 0) > 0 && (
                                    <div className="grid grid-cols-3 gap-2">
                                        {form.galleryImages!.map((url, i) => (
                                            <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100">
                                                <img src={url} alt={`Galeria ${i + 1}`} className="w-full h-full object-cover" />
                                                <button type="button" onClick={() => removeGalleryImage(url)} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <X size={16} className="text-white" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {(form.galleryImages?.length || 0) < 6 && (
                                    <label className="block max-w-[280px] w-full cursor-pointer group">
                                        <div className={`w-full py-3.5 px-6 rounded-2xl border transition-all text-center flex items-center justify-center gap-3 ${galleryUploading ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200 hover:border-indigo-500 hover:bg-indigo-50'}`}>
                                            {galleryUploading ? <Loader2 size={16} className="animate-spin text-indigo-500" /> : <ImagePlus size={16} className="text-slate-400 group-hover:text-indigo-500" />}
                                            <span className={`text-[11px] font-black uppercase tracking-widest ${galleryUploading ? 'text-slate-400' : 'text-slate-600 group-hover:text-indigo-600'}`}>{galleryUploading ? 'Enviando...' : 'Galeria (Max 6)'}</span>
                                        </div>
                                        <input type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} disabled={galleryUploading} />
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-8">
                        <button type="button" onClick={() => { clearDraft(); setSelected(null); setForm(EMPTY_MOTO); }} className="flex-1 py-4 bg-white border border-slate-200 rounded-[1.5rem] text-sm font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all">Cancelar</button>
                        <button type="submit" disabled={submitting} className="flex-[2] py-4 bg-slate-900 text-white rounded-[1.5rem] text-sm font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50">
                            {submitting ? <Loader2 className="animate-spin mx-auto" /> : (selected === 'new' ? 'Cadastrar Moto' : 'Salvar Alterações')}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    // ── LIST VIEW ───────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-full space-y-6 animate-fadeIn pb-10 px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 max-w-[1920px] mx-auto w-full">
            {/* Toast */}
            {notification && (
                <div className={`fixed top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-[9999] px-6 py-4 rounded-2xl font-bold text-sm uppercase tracking-wide shadow-2xl animate-fadeUp ${notification.type === 'success' ? 'bg-brand-500 text-white shadow-brand-500/30' : 'bg-rose-500 text-white shadow-rose-500/30'}`}>
                    {notification.type === 'success' ? '✓' : '!'} {notification.message}
                </div>
            )}

            <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-6 px-1">
                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-200/50 p-1 rounded-xl border border-slate-200/30 backdrop-blur-sm">
                            <button onClick={() => setInventoryView('available')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all duration-300 ${inventoryView === 'available' ? 'bg-white text-brand-600 shadow-md font-black ring-1 ring-brand-500/10' : 'text-slate-500 hover:text-slate-700 font-bold'}`}>
                                <div className={`w-2 h-2 rounded-full ${inventoryView === 'available' ? 'bg-brand-500 animate-pulse' : 'bg-slate-300'}`} />
                                <span className="text-[11px] uppercase tracking-[0.1em]">Em Estoque</span>
                                <span className={`ml-1 text-[9px] px-1.5 py-0.5 rounded-md ${inventoryView === 'available' ? 'bg-brand-50 text-brand-600' : 'bg-slate-200 text-slate-500'}`}>{motorcycles.filter(m => m.status === 'available').length}</span>
                            </button>
                            <button onClick={() => setInventoryView('sold')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all duration-300 ${inventoryView === 'sold' ? 'bg-white text-rose-600 shadow-md font-black ring-1 ring-rose-500/10' : 'text-slate-500 hover:text-slate-700 font-bold'}`}>
                                <div className={`w-2 h-2 rounded-full ${inventoryView === 'sold' ? 'bg-rose-500 animate-pulse' : 'bg-slate-300'}`} />
                                <span className="text-[11px] uppercase tracking-[0.1em]">Vendidas</span>
                                <span className={`ml-1 text-[9px] px-1.5 py-0.5 rounded-md ${inventoryView === 'sold' ? 'bg-rose-50 text-rose-600' : 'bg-slate-200 text-slate-500'}`}>{motorcycles.filter(m => m.status === 'sold').length}</span>
                            </button>
                        </div>

                        <div className="h-10 w-px bg-slate-200 mx-2 hidden md:block" />

                        <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
                            <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={16} strokeWidth={2.5} /></button>
                            <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}><List size={16} strokeWidth={2.5} /></button>
                        </div>

                        <button onClick={() => setIsFilterOpen(!isFilterOpen)} className={`flex items-center gap-2 px-5 py-3 border rounded-xl text-[11px] font-black uppercase tracking-[0.1em] transition-all shadow-sm ${isFilterOpen ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/10' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}>
                            <Filter size={15} strokeWidth={2.5} /> Filtrar
                        </button>

                        <select value={sortBy} onChange={e => setSortBy(e.target.value as 'brand' | 'a-z' | 'z-a')} className="px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-[11px] font-black uppercase tracking-[0.1em] hover:bg-slate-50 transition-all shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10">
                            <option value="brand">Ordenar: Marca</option>
                            <option value="a-z">Ordenar: A-Z</option>
                            <option value="z-a">Ordenar: Z-A</option>
                        </select>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => { setSelected('new'); setForm(EMPTY_MOTO); }} className="flex items-center gap-2 px-7 py-3 bg-brand-500 text-white rounded-xl text-[11px] font-black uppercase tracking-[0.12em] hover:bg-brand-600 transition-all shadow-xl shadow-brand-500/20 active:scale-95 ring-2 ring-brand-500/10 ring-offset-2 ring-offset-slate-50">
                            <Plus size={16} strokeWidth={3} /> Nova Moto
                        </button>
                    </div>
                </div>

                {isFilterOpen && (
                    <MotoFilters
                        filters={filters}
                        onChangeFilters={setFilters}
                        clearFilters={clearFilters}
                        motoCategories={MOTO_CATEGORIES}
                    />
                )}
            </div>

            {/* Grid/List de Cards */}
            <div className="flex-1 min-h-0 min-w-0">
                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                        {displayed.map(m => {
                            const mWithToggle = m.id in websiteToggles ? { ...m, showOnWebsite: websiteToggles[m.id] } : m;
                            return <MotoGridCard key={m.id} moto={mWithToggle} onSelect={handleSelectMoto} onToggleWebsite={handleToggleWebsite} />;
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {displayed.map(m => {
                            const mWithToggle = m.id in websiteToggles ? { ...m, showOnWebsite: websiteToggles[m.id] } : m;
                            return <MotoListCard key={m.id} moto={mWithToggle} onSelect={handleSelectMoto} onToggleWebsite={handleToggleWebsite} />;
                        })}
                    </div>
                )}

                {displayed.length === 0 && (
                    <div className="py-24 text-center bg-white rounded-[3rem] border border-slate-100 border-dashed mt-6 animate-fadeUp">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-6 border border-slate-50">
                            <Bike size={48} strokeWidth={1} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Nenhuma moto encontrada</h3>
                        <p className="text-slate-400 text-sm mt-3 max-w-xs mx-auto font-medium">Ajuste os filtros ou cadastre uma nova moto.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MotorcycleInventory;
