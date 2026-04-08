import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Search, Filter, Gauge, Calendar, DollarSign,
    Edit3, Trash2, ChevronLeft, Upload, Loader2, X, Check,
    UserCheck, Users, Tag, Send, LayoutGrid, List,
    Bike, Hash, Palette, Zap
} from 'lucide-react';
import { Lead, LeadPhase, SaleDetails, LeadTemperature, Motorcycle, MotorcycleCategory } from '../types';
import { motorcycleService } from '../services/motorcycleService';
import { supabase } from '../lib/supabaseClient';
import { resizeImage } from '../utils/imageProcessor';
import { CustomDatePicker } from './ui/CustomDatePicker';
import { formatCurrency, parseCurrency } from '../utils/formatters';
import { motoDatabase } from '../data/motoDb';
import AutocompleteInput from './ui/AutocompleteInput';

// ─── Constantes ───────────────────────────────────────────────────────────────

const MOTO_CATEGORIES: MotorcycleCategory[] = ['Naked', 'Sport', 'Trail', 'Custom', 'Scooter', 'Touring', 'Elétrica', 'Street'];
const MOTO_ENGINES = ['110cc', '125cc', '150cc', '160cc', '190cc', '250cc', '300cc', '400cc', '600cc', '750cc', '1000cc', '1200cc+'];
const MOTO_BRANDS = ['Honda', 'Yamaha', 'Kawasaki', 'Suzuki', 'BMW', 'Ducati', 'Harley-Davidson', 'KTM', 'Royal Enfield', 'Triumph', 'Dafra', 'Shineray', 'Haojue', 'Traxx'];

const COMMON_OPTIONS = [
    'Baú', 'Alforje', 'Mala de Tanque', 'Protetor de Motor', 'Slider', 'Manoplas Aquecidas',
    'Painel Digital', 'Freio ABS', 'Controle de Tração', 'Airbag', 'BSS',
    'LED Full', 'GPS Integrado', 'Bluetooth', 'USB', 'Alarme',
    'Windshelf', 'Protetor de Carenagem', 'Guidão Regulável'
];

const EMPTY_MOTO: Omit<Motorcycle, 'id'> = {
    brand: 'Honda', model: '', year: new Date().getFullYear(),
    modelYear: new Date().getFullYear(), plate: '', price: 0,
    category: 'Naked', engine: '150cc', mileage: 0, color: '',
    isSingleOwner: false, hasWarranty: false, isIpvaPaid: false,
    optionals: [], imageUrl: '', status: 'available',
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

// ─── Component ────────────────────────────────────────────────────────────────

const MotorcycleInventory: React.FC<Props> = ({
    motorcycles, leads, userEmail, onDataChange, onAddLead, onViewLead
}) => {
    const navigate = useNavigate();

    const [selected, setSelected] = useState<Motorcycle | 'new' | null>(null);
    const [inventoryView, setInventoryView] = useState<'available' | 'sold'>('available');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [filterQuery, setFilterQuery] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filterPriceMin, setFilterPriceMin] = useState('');
    const [filterPriceMax, setFilterPriceMax] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [uploading, setUploading] = useState(false);
    const [isSellModalOpen, setIsSellModalOpen] = useState(false);
    const [form, setForm] = useState<Omit<Motorcycle, 'id'>>(EMPTY_MOTO);
    const [walkInName, setWalkInName] = useState('');
    const [walkInPhone, setWalkInPhone] = useState('');
    const [sellData, setSellData] = useState<SaleDetails>({
        salePrice: 0, saleDate: new Date().toISOString().split('T')[0],
        buyerName: '', buyerLeadId: '', isFollowUpSale: true
    });
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [msgTemplate, setMsgTemplate] = useState('');
    const [msgTargets, setMsgTargets] = useState<Lead[]>([]);

    // ── Filtro de listagem ──────────────────────────────────────────────────────

    const displayed = useMemo(() => motorcycles.filter(m => {
        if (m.status !== inventoryView) return false;
        if (filterQuery) {
            const q = filterQuery.toLowerCase();
            if (!m.brand.toLowerCase().includes(q) && !m.model.toLowerCase().includes(q) && !m.plate?.toLowerCase().includes(q)) return false;
        }
        if (filterCategory && m.category !== filterCategory) return false;
        if (filterPriceMin && m.price < parseFloat(filterPriceMin)) return false;
        if (filterPriceMax && m.price > parseFloat(filterPriceMax)) return false;
        return true;
    }), [motorcycles, inventoryView, filterQuery, filterCategory, filterPriceMin, filterPriceMax]);

    // ── Leads compatíveis ───────────────────────────────────────────────────────
    const matchingLeads = useMemo(() => {
        if (!selected || selected === 'new') return [];
        const m = selected as Motorcycle;
        return leads.filter(l =>
            l.phase !== LeadPhase.DISQUALIFIED && l.phase !== LeadPhase.COMPLETED &&
            (l.preferences.marcas.some(b => m.brand.toLowerCase().includes(b.toLowerCase())) ||
                l.preferences.tipos_veiculo.includes('Naked' as any)) &&
            (!l.preferences.valor_maximo || m.price <= l.preferences.valor_maximo)
        );
    }, [selected, leads]);

    // ── Handlers ────────────────────────────────────────────────────────────────

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const resized = await resizeImage(file, 1200, 900);
            const { data: { user } } = await supabase.auth.getUser();
            // resizeImage returns a Blob; wrap it as File for the service
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

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        try {
            if (selected === 'new') {
                await motorcycleService.create(form);
            } else if (selected) {
                await motorcycleService.update({ ...(selected as Motorcycle), ...form });
            }
            onDataChange();
            setSelected(null);
            setForm(EMPTY_MOTO);
        } catch (err: any) {
            console.error('Erro ao salvar:', err);
            const errorMsg = err.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
            alert('Erro ao salvar moto: ' + errorMsg);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Excluir esta moto?')) return;
        await motorcycleService.delete(id);
        onDataChange();
        setSelected(null);
    };

    const handleOpenSell = () => {
        if (!selected || selected === 'new') return;
        setSellData({ salePrice: (selected as Motorcycle).price, saleDate: new Date().toISOString().split('T')[0], buyerName: '', buyerLeadId: '', isFollowUpSale: true });
        setWalkInName(''); setWalkInPhone('');
        setIsSellModalOpen(true);
    };

    const handleSellSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selected || selected === 'new') return;
        let finalBuyerLeadId = sellData.buyerLeadId;
        let finalBuyerName = sellData.buyerName;

        if (sellData.buyerName === 'Venda Avulsa') {
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
            finalBuyerLeadId = leads.find(l => l.name === sellData.buyerName)?.id;
        }

        await motorcycleService.sell((selected as Motorcycle).id, { ...sellData, buyerName: finalBuyerName, buyerLeadId: finalBuyerLeadId });
        onDataChange();
        setIsSellModalOpen(false);
        setSelected(null);
    };

    const handleSendMsg = async () => {
        if (!selected || selected === 'new') return;
        const m = selected as Motorcycle;
        for (const lead of msgTargets) {
            const msg = msgTemplate
                .replace(/{{nome}}/g, lead.name)
                .replace(/{{marca}}/g, m.brand)
                .replace(/{{modelo}}/g, m.model)
                .replace(/{{ano}}/g, String(m.year))
                .replace(/{{valor}}/g, m.price.toLocaleString());
            await supabase.from('lead_communications').insert({
                lead_id: lead.id, vehicle_id: m.id,
                contact_name: lead.name, contact_phone: lead.phone,
                message_body: msg, is_sent: 'não', email_user: userEmail
            });
        }
        setIsMessageModalOpen(false);
        alert(`Mensagem registrada para ${msgTargets.length} lead(s)!`);
    };

    const openEdit = (m: Motorcycle) => {
        setForm({ brand: m.brand, model: m.model, year: m.year, modelYear: m.modelYear ?? m.year, plate: m.plate ?? '', price: m.price, category: m.category, engine: m.engine, mileage: m.mileage, color: m.color, isSingleOwner: m.isSingleOwner, hasWarranty: m.hasWarranty, isIpvaPaid: m.isIpvaPaid, optionals: m.optionals, imageUrl: m.imageUrl, status: m.status, saleDetails: m.saleDetails });
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
                            <button onClick={handleOpenSell} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all">
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
                                <div className="w-full h-96 mb-8 rounded-[2rem] overflow-hidden">
                                    <img src={m.imageUrl} alt={m.model} className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="absolute top-0 right-0 p-10 opacity-5"><Bike size={300} /></div>
                            )}
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-4 py-1.5 rounded-lg border border-emerald-100/50">{m.category}</span>
                                        {m.isSingleOwner && <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest bg-slate-100 px-4 py-1.5 rounded-lg">Único Dono</span>}
                                        {m.hasWarranty && <span className="text-[10px] font-extrabold text-blue-500 uppercase tracking-widest bg-blue-50 px-4 py-1.5 rounded-lg">Garantia</span>}
                                        {m.isIpvaPaid && <span className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-4 py-1.5 rounded-lg">IPVA Pago</span>}
                                    </div>
                                    {m.status === 'sold' && <span className="text-xs font-black text-white bg-red-500 px-4 py-2 rounded-lg uppercase tracking-widest shadow-lg shadow-red-500/20">Vendida</span>}
                                </div>

                                <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-[0.9] uppercase mb-4">
                                    {m.brand} <br /> {m.model}
                                </h1>
                                <p className="text-4xl font-black text-emerald-500 tracking-tighter">R$ {m.price.toLocaleString('pt-BR')}</p>

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
                                <h3 className="text-lg font-extrabold tracking-tight mb-6 flex items-center gap-3"><Check size={24} className="text-emerald-400" /> Detalhes da Venda</h3>
                                <div className="grid grid-cols-3 gap-8">
                                    <div><p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Valor</p><p className="text-3xl font-black text-emerald-400">R$ {m.saleDetails.salePrice.toLocaleString()}</p></div>
                                    <div><p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Data</p><p className="text-xl font-bold">{new Date(m.saleDetails.saleDate).toLocaleDateString()}</p></div>
                                    <div><p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Comprador</p><p className="text-xl font-bold">{m.saleDetails.buyerName}</p></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Leads Compatíveis */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-2"><UserCheck size={24} className="text-emerald-500" /><h3 className="text-lg font-extrabold text-slate-900">Leads Compatíveis</h3></div>
                            <p className="text-slate-400 text-sm font-medium mb-4">Encontramos <strong className="text-slate-900">{matchingLeads.length} leads</strong> com perfil de moto.</p>
                            <div className="flex gap-2">
                                <button onClick={() => { setMsgTargets(matchingLeads); setMsgTemplate(`Olá {{nome}}, chegou uma moto: {{marca}} {{modelo}} {{ano}} por R$ {{valor}}!`); setIsMessageModalOpen(true); }} className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-widest hover:bg-slate-800 transition-all">Avisar Todos</button>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {matchingLeads.map(lead => (
                                <div key={lead.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group cursor-pointer">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-lg text-slate-300 group-hover:bg-emerald-500 group-hover:text-white transition-colors">{lead.name.charAt(0)}</div>
                                        <div><p className="font-extrabold text-slate-900 uppercase leading-none">{lead.name}</p></div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => { setMsgTargets([lead]); setMsgTemplate(`Olá {{nome}}, temos uma moto: {{marca}} {{modelo}} {{ano}} por R$ {{valor}}!`); setIsMessageModalOpen(true); }} className="flex-1 py-3 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-extrabold uppercase tracking-widest group-hover:bg-slate-900 group-hover:text-white transition-colors flex items-center justify-center gap-2">
                                            <Send size={14} /> Mensagem
                                        </button>
                                        <button onClick={() => onViewLead(lead.id)} className="flex-1 py-3 bg-white border border-slate-100 text-slate-400 rounded-xl text-[10px] font-extrabold uppercase tracking-widest hover:bg-slate-50 transition-colors">Ver Lead</button>
                                    </div>
                                </div>
                            ))}
                            {matchingLeads.length === 0 && <div className="text-center py-10 opacity-50"><Users size={48} className="mx-auto text-slate-300 mb-4" /><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum lead compatível</p></div>}
                        </div>
                    </div>
                </div>

                {/* Sell Modal */}
                {isSellModalOpen && (
                    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[90] flex items-center justify-center p-6" onClick={() => setIsSellModalOpen(false)}>
                        <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-fadeUp" onClick={e => e.stopPropagation()}>
                            <form onSubmit={handleSellSubmit}>
                                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                    <div><h2 className="text-lg font-extrabold text-slate-900 uppercase">Registrar Venda</h2><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.brand} {m.model}</p></div>
                                    <button type="button" onClick={() => setIsSellModalOpen(false)}><X size={24} className="text-slate-300" /></button>
                                </div>
                                <div className="p-10 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preço Final</label>
                                        <input type="text" required value={formatCurrency(sellData.salePrice)} onChange={e => setSellData({ ...sellData, salePrice: parseCurrency(e.target.value) })} className="w-full p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl font-black outline-none text-lg" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data da Venda</label>
                                        <CustomDatePicker value={sellData.saleDate} onChange={date => setSellData({ ...sellData, saleDate: date })} className="w-full py-4 px-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none text-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Comprador</label>
                                        <select value={sellData.buyerName} onChange={e => setSellData({ ...sellData, buyerName: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none text-sm">
                                            <option value="">Selecionar lead...</option>
                                            <option value="Venda Avulsa">Venda Avulsa (Novo Cliente)</option>
                                            {leads.filter(l => l.phase !== LeadPhase.DISQUALIFIED).map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                                        </select>
                                    </div>
                                    {sellData.buyerName === 'Venda Avulsa' && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nome</label><input type="text" value={walkInName} onChange={e => setWalkInName(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 outline-none text-sm" /></div>
                                            <div className="space-y-2"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Telefone</label><input type="text" value={walkInPhone} onChange={e => setWalkInPhone(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 outline-none text-sm" /></div>
                                        </div>
                                    )}
                                </div>
                                <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                                    <button type="button" onClick={() => setIsSellModalOpen(false)} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Cancelar</button>
                                    <button type="submit" className="flex-[2] py-4 bg-emerald-500 text-white rounded-2xl text-[11px] font-extrabold uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20">Confirmar Venda</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Message Modal */}
                {isMessageModalOpen && (
                    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[100] flex items-center justify-center p-6" onClick={() => setIsMessageModalOpen(false)}>
                        <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl animate-fadeUp overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                <div><h2 className="text-lg font-extrabold text-slate-900 uppercase">Enviar Mensagem</h2><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Para: {msgTargets.length > 1 ? `${msgTargets.length} leads` : msgTargets[0]?.name}</p></div>
                                <button onClick={() => setIsMessageModalOpen(false)}><X size={24} className="text-slate-300" /></button>
                            </div>
                            <div className="p-8 space-y-4">
                                <textarea value={msgTemplate} onChange={e => setMsgTemplate(e.target.value)} className="w-full h-36 p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium text-sm text-slate-700 resize-none leading-relaxed" />
                                <div className="flex gap-2 flex-wrap">
                                    {['{{nome}}', '{{marca}}', '{{modelo}}', '{{ano}}', '{{valor}}'].map(tag => (
                                        <button key={tag} onClick={() => setMsgTemplate(p => p + ' ' + tag)} className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">{tag}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                                <button onClick={() => setIsMessageModalOpen(false)} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Cancelar</button>
                                <button onClick={handleSendMsg} className="flex-[2] py-4 bg-emerald-500 text-white rounded-2xl text-[11px] font-extrabold uppercase tracking-widest hover:bg-emerald-600 flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20"><Send size={16} /> Registrar Envio</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ── FORM VIEW (new / edit) ───────────────────────────────────────────────────
    if (selected === 'new') {
        return (
            <div className="animate-fadeUp max-w-4xl mx-auto w-full pb-20">
                <div className="flex items-center justify-between mb-8">
                    <button onClick={() => { setSelected(null); setForm(EMPTY_MOTO); }} className="flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-colors group">
                        <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center group-hover:bg-slate-50"><ChevronLeft size={20} /></div>
                        <span className="font-extrabold text-xs uppercase tracking-widest">Cancelar</span>
                    </button>
                </div>

                <form onSubmit={handleSave} className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-8">
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Nova Moto</h2>

                    {/* Imagem */}
                    <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Foto da Moto</label>
                        {form.imageUrl ? (
                            <div className="relative w-full h-64 rounded-2xl overflow-hidden">
                                <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                <button type="button" onClick={() => setForm(p => ({ ...p, imageUrl: '' }))} className="absolute top-4 right-4 w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-500 hover:text-red-500 shadow"><X size={16} /></button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all">
                                {uploading ? <Loader2 size={32} className="text-emerald-500 animate-spin" /> : <><Upload size={32} className="text-slate-300 mb-3" /><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Clique para enviar</p></>}
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                            </label>
                        )}
                    </div>

                    {/* Identificação */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Marca</label>
                            <AutocompleteInput
                                value={form.brand}
                                onChangeValue={(val) => setForm({ ...form, brand: val })}
                                suggestions={Object.keys(motoDatabase)}
                                placeholder="Ex: Honda"
                                required
                                className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                            />
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
                                className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Categoria</label>
                            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value as MotorcycleCategory }))} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none text-sm focus:border-emerald-400">
                                {MOTO_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Cilindrada</label>
                            <select value={form.engine} onChange={e => setForm(p => ({ ...p, engine: e.target.value }))} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none text-sm focus:border-emerald-400">
                                {MOTO_ENGINES.map(e => <option key={e}>{e}</option>)}
                                {form.engine && !MOTO_ENGINES.includes(form.engine) && <option value={form.engine}>{form.engine}</option>}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Ano Fabr.</label>
                            <input type="number" required value={form.year} onChange={e => setForm(p => ({ ...p, year: +e.target.value }))} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none text-sm focus:border-emerald-400" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Ano Modelo</label>
                            <input type="number" value={form.modelYear ?? form.year} onChange={e => setForm(p => ({ ...p, modelYear: +e.target.value }))} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none text-sm focus:border-emerald-400" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Quilometragem</label>
                            <input type="number" required value={form.mileage} onChange={e => setForm(p => ({ ...p, mileage: +e.target.value }))} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none text-sm focus:border-emerald-400" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Cor</label>
                            <input type="text" placeholder="Preta, Vermelha..." value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none text-sm focus:border-emerald-400" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Placa</label>
                            <input type="text" placeholder="ABC-1234" value={form.plate ?? ''} onChange={e => setForm(p => ({ ...p, plate: e.target.value }))} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none text-sm focus:border-emerald-400" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Preço</label>
                            <input type="text" required value={formatCurrency(form.price)} onChange={e => setForm(p => ({ ...p, price: parseCurrency(e.target.value) }))} className="w-full p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl font-black outline-none text-lg focus:border-emerald-400" />
                        </div>
                    </div>

                    {/* Boleanos */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                            { key: 'isSingleOwner', label: 'Único Dono' },
                            { key: 'hasWarranty', label: 'Garantia' },
                            { key: 'isIpvaPaid', label: 'IPVA Pago' },
                        ].map(({ key, label }) => (
                            <label key={key} className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${(form as any)[key] ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${(form as any)[key] ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'}`}>
                                    {(form as any)[key] && <Check size={12} strokeWidth={4} />}
                                </div>
                                <input type="checkbox" className="hidden" checked={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))} />
                                <span className="font-extrabold text-xs uppercase tracking-widest">{label}</span>
                            </label>
                        ))}
                    </div>

                    {/* Opcionais */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Opcionais</label>
                        <div className="flex flex-wrap gap-2">
                            {COMMON_OPTIONS.map(opt => {
                                const active = form.optionals.includes(opt);
                                return (
                                    <button key={opt} type="button" onClick={() => setForm(p => ({ ...p, optionals: active ? p.optionals.filter(o => o !== opt) : [...p.optionals, opt] }))}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all border ${active ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-emerald-300'}`}>
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => { setSelected(null); setForm(EMPTY_MOTO); }} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-extrabold text-slate-500 uppercase tracking-widest text-sm hover:bg-slate-50">Cancelar</button>
                        <button type="submit" disabled={uploading} className="flex-[2] py-4 bg-emerald-500 text-white rounded-2xl font-extrabold uppercase tracking-widest text-sm hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2">
                            {uploading ? <Loader2 size={18} className="animate-spin" /> : <><Bike size={18} /> Salvar Moto</>}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    // ── LIST VIEW ────────────────────────────────────────────────────────────────

    return (
        <div className="animate-fadeUp w-full pb-20">
            {/* Header */}
            <div className="flex flex-wrap items-center gap-4 mb-8">
                <div className="flex bg-white/40 backdrop-blur-xl p-1 rounded-[18px] border border-white/60 shadow-sm">
                    <button onClick={() => setInventoryView('available')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${inventoryView === 'available' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-white/50'}`}>Disponíveis ({motorcycles.filter(m => m.status === 'available').length})</button>
                    <button onClick={() => setInventoryView('sold')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${inventoryView === 'sold' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-white/50'}`}>Vendidas ({motorcycles.filter(m => m.status === 'sold').length})</button>
                </div>

                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-4 top-0 bottom-0 my-auto text-slate-300" size={16} />
                    <input type="text" placeholder="Buscar moto..." value={filterQuery} onChange={e => setFilterQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white/60 backdrop-blur-xl border border-white/60 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-emerald-400 shadow-sm" />
                </div>

                <button onClick={() => setIsFilterOpen(!isFilterOpen)} className={`flex items-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${isFilterOpen ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg' : 'bg-white/60 text-slate-500 border-white/60 hover:bg-white'}`}>
                    <Filter size={14} /> Filtros
                </button>

                <div className="flex bg-white/40 backdrop-blur-xl p-1 rounded-[18px] border border-white/60 shadow-sm ml-auto">
                    <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-white/50'}`}><LayoutGrid size={16} /></button>
                    <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-white/50'}`}><List size={16} /></button>
                </div>

                <button onClick={() => { setForm(EMPTY_MOTO); setSelected('new'); }} className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all">
                    <Plus size={18} /> Nova Moto
                </button>
            </div>

            {/* Filtros extras */}
            {isFilterOpen && (
                <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[24px] p-6 mb-6 shadow-sm animate-fadeUp flex flex-wrap gap-4">
                    <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Categoria</label>
                        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 outline-none text-sm">
                            <option value="">Todas</option>
                            {MOTO_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Preço Mín</label>
                        <input type="number" value={filterPriceMin} onChange={e => setFilterPriceMin(e.target.value)} placeholder="0" className="p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 outline-none text-sm w-32" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Preço Máx</label>
                        <input type="number" value={filterPriceMax} onChange={e => setFilterPriceMax(e.target.value)} placeholder="999999" className="p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 outline-none text-sm w-32" />
                    </div>
                    <button onClick={() => { setFilterCategory(''); setFilterPriceMin(''); setFilterPriceMax(''); }} className="self-end px-4 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors">Limpar</button>
                </div>
            )}

            {/* Grid / List */}
            {displayed.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6"><Bike size={40} className="text-slate-300" /></div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">Nenhuma moto encontrada</h3>
                    <p className="text-slate-400 font-medium text-sm mb-8">Adicione a primeira moto ao seu estoque.</p>
                    <button onClick={() => { setForm(EMPTY_MOTO); setSelected('new'); }} className="flex items-center gap-2 px-8 py-4 bg-emerald-500 text-white rounded-2xl font-extrabold uppercase tracking-wider shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all">
                        <Plus size={20} /> Cadastrar Moto
                    </button>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {displayed.map(m => (
                        <div key={m.id} onClick={() => setSelected(m)} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group overflow-hidden">
                            {m.imageUrl ? (
                                <div className="h-48 overflow-hidden"><img src={m.imageUrl} alt={m.model} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div>
                            ) : (
                                <div className="h-48 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center"><Bike size={64} className="text-slate-200" /></div>
                            )}
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-lg">{m.category}</span>
                                    {m.status === 'sold' && <span className="text-[9px] font-black text-white bg-red-500 px-3 py-1 rounded-lg uppercase">Vendida</span>}
                                </div>
                                <h3 className="font-black text-slate-900 uppercase tracking-tight leading-tight text-lg">{m.brand}</h3>
                                <p className="text-sm font-bold text-slate-500 mb-4">{m.model} • {m.year}</p>
                                <div className="flex items-center justify-between">
                                    <p className="text-xl font-black text-emerald-500">R$ {m.price.toLocaleString('pt-BR')}</p>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                        <Gauge size={12} />{m.mileage.toLocaleString()} km
                                    </div>
                                </div>
                                <p className="text-[10px] font-bold text-slate-300 mt-2 uppercase tracking-widest">{m.engine} • {m.color}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    {displayed.map(m => (
                        <div key={m.id} onClick={() => setSelected(m)} className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group flex items-center gap-6 p-5">
                            {m.imageUrl ? (
                                <div className="w-20 h-16 rounded-2xl overflow-hidden shrink-0"><img src={m.imageUrl} alt={m.model} className="w-full h-full object-cover" /></div>
                            ) : (
                                <div className="w-20 h-16 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0"><Bike size={28} className="text-slate-200" /></div>
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2"><h3 className="font-black text-slate-900 uppercase">{m.brand} {m.model}</h3><span className="text-[10px] font-extrabold text-slate-400">{m.year}</span></div>
                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                    <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg uppercase tracking-widest">{m.category}</span>
                                    <span className="text-[10px] font-bold text-slate-400">{m.engine}</span>
                                    <span className="text-[10px] font-bold text-slate-400">{m.mileage.toLocaleString()} km</span>
                                    <span className="text-[10px] font-bold text-slate-400">{m.color}</span>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-xl font-black text-emerald-500">R$ {m.price.toLocaleString('pt-BR')}</p>
                                {m.status === 'sold' && <span className="text-[9px] font-black text-white bg-red-500 px-2.5 py-1 rounded-lg uppercase">Vendida</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MotorcycleInventory;
