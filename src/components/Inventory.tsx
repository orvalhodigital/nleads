
import React, { useState, useMemo, useEffect, lazy, Suspense, useCallback, memo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus, Search, Filter, MoreHorizontal, MapPin, Gauge, Calendar,
  DollarSign, Hash, Edit3, Trash2, ChevronLeft, ChevronRight, Upload, Loader2, X,
  Check, UserCheck, Users, Tag, Car, Zap, Send, LayoutGrid, List,
  ExternalLink
} from 'lucide-react';
import { Vehicle, VehicleType, TransmissionType, EngineType, Lead, LeadPhase, SaleDetails, LeadTemperature, LeadCommunication } from '../types';
import { leadCommunicationService } from '../services/leadCommunicationService';
import { resizeImage } from '../utils/imageProcessor';
import { carDatabase } from '../data/carDb';
import AutocompleteInput from './ui/AutocompleteInput';

import { CustomDatePicker } from './ui/CustomDatePicker';
import { formatCurrency, parseCurrency } from '../utils/formatters';
import { getMatchingInsights } from '../services/openaiService';
import { leadService } from '../services/leadService';
import { salesFlowService } from '../services/salesFlowService';


interface InventoryProps {
  vehicles: Vehicle[];
  onAddVehicle: (v: Omit<Vehicle, 'id'>) => void;
  onUpdateVehicle: (v: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
  onSellVehicle: (id: string, details: SaleDetails) => void;
  leads: Lead[];
  onAddLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'lastUpdate' | 'funnelHistory'>) => Promise<Lead | null>;
  onViewLead: (leadId: string) => void;
  userEmail?: string;
  onDataChange?: () => void;
}

const VEHICLE_TYPES: VehicleType[] = ['SUV', 'Sedan', 'Hatch', 'Picape', 'Esportivo', 'Conversível', 'Van'];
const TRANSMISSION_TYPES: TransmissionType[] = ['Manual', 'Automático'];
const ENGINE_TYPES: EngineType[] = ['1.0', '1.4', '1.6', '2.0+', 'Elétrico', 'Híbrido'];

const InventoryImportModal = lazy(() => import('./InventoryImportModal'));
import { VehicleGridCard, VehicleListCard } from './inventory/VehicleCards';
import { VehicleFilters } from './inventory/VehicleFilters';
import { SellVehicleModal } from './inventory/SellVehicleModal';
import { LeadInterestModal } from './inventory/LeadInterestModal';
import { InventoryHeader } from './inventory/InventoryHeader';

interface VehicleCardProps { vehicle: Vehicle; onSelect: (v: Vehicle) => void; onToggleWebsite?: (v: Vehicle) => void; }

const Inventory: React.FC<InventoryProps> = ({
  vehicles, onAddVehicle, onUpdateVehicle, onDeleteVehicle, onSellVehicle, leads, onAddLead, onViewLead, userEmail, onDataChange
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlVehicleId = searchParams.get('vehicleId') || searchParams.get('id');

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | 'new' | null>(null);

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Estado para alternar entre estoque disponível e vendidos
  const [inventoryView, setInventoryView] = useState<'available' | 'sold'>('available');

  // View Mode State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Sort State
  const [sortBy, setSortBy] = useState<'brand' | 'a-z' | 'z-a'>('brand');

  // Toast Notification State
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Estado local otimista para showOnWebsite — garante resposta imediata na UI
  // independente do banco de dados ainda ter ou não a coluna
  const [websiteToggles, setWebsiteToggles] = useState<Record<string, boolean>>({});

  // Filter State — consolidado para reduzir re-renders
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ query: '', yearMin: '', yearMax: '', priceMin: '', priceMax: '' });
  const clearFilters = useCallback(() => setFilters({ query: '', yearMin: '', yearMax: '', priceMin: '', priceMax: '' }), []);

  // Message Sending State
  const [communications, setCommunications] = useState<LeadCommunication[]>([]);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [messageTemplate, setMessageTemplate] = useState('');
  const [messageTarget, setMessageTarget] = useState<'single' | 'all' | 'new'>('single');
  const [targetLeadsList, setTargetLeadsList] = useState<Lead[]>([]);

  // Manual Lead Selector State
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [selectorSearch, setSelectorSearch] = useState('');
  const [selectorSelectedIds, setSelectorSelectedIds] = useState<string[]>([]);
  const [iaMatches, setIaMatches] = useState<Array<{ leadId: string; reason: string; whatsappPitch: string }>>([]);
  const [loadingIa, setLoadingIa] = useState(false);

  const prepareIaMessageModal = (lead: Lead, pitch: string) => {
    setMessageTarget('single');
    setTargetLeadsList([lead]);
    setMessageTemplate(pitch);
    setIsMessageModalOpen(true);
  };
  const location = useLocation();
    useEffect(() => {
        if (location.state?.selectedVehicleId && vehicles.length > 0) {
            const found = vehicles.find(v => v.id === location.state.selectedVehicleId);
            if (found) {
                setSelectedVehicle(found);
                window.history.replaceState({}, document.title);
            }
        }
        if (location.state?.search !== undefined) {
            setFilters(f => ({ ...f, query: location.state.search }));
            window.history.replaceState({}, document.title);
        }
    }, [location.state, vehicles]);

    useEffect(() => {
        if (urlVehicleId && vehicles.length > 0) {
            const found = vehicles.find(v => v.id === urlVehicleId);
            if (found) {
                setSelectedVehicle(found);
            }
        }
    }, [urlVehicleId, vehicles]);

    useEffect(() => {
        if (selectedVehicle && typeof selectedVehicle === 'object') {
            localStorage.setItem('inventory_selected_id', selectedVehicle.id);
        } else if (selectedVehicle === null) {
            localStorage.removeItem('inventory_selected_id');
        }
    }, [selectedVehicle]);

  // Fetch communications for the selected vehicle
  React.useEffect(() => {
    if (selectedVehicle && selectedVehicle !== 'new') {
      const fetchComms = async () => {
        setCommunications(await leadCommunicationService.listByVehicle(selectedVehicle.id));
      };
      fetchComms();
    }
  }, [selectedVehicle]);

  // Fetch AI matching recommendations
  useEffect(() => {
    if (selectedVehicle && selectedVehicle !== 'new') {
      const fetchIaMatches = async () => {
        setLoadingIa(true);
        setIaMatches([]);
        try {
          const activeLeads = leads.filter(l => l.phase !== LeadPhase.COMPLETED && l.phase !== LeadPhase.DISQUALIFIED);
          if (activeLeads.length > 0) {
            const res = await getMatchingInsights(selectedVehicle as Vehicle, activeLeads);
            if (res && res.matches) {
              setIaMatches(res.matches);
            }
          }
        } catch (err) {
          console.error("Erro ao carregar matching de IA:", err);
        } finally {
          setLoadingIa(false);
        }
      };
      fetchIaMatches();
    } else {
      setIaMatches([]);
    }
  }, [selectedVehicle, leads]);

  const handleSelectVehicle = useCallback((v: Vehicle) => {
    setSelectedVehicle(v);
    setSearchParams({ vehicleId: v.id });
  }, [setSearchParams]);

  const handleCloseVehicleDetails = useCallback(() => {
    setSelectedVehicle(null);
    setSearchParams({});
  }, [setSearchParams]);

  const prepareMessageModal = (target: 'single' | 'all' | 'new', lead?: Lead) => {
    setMessageTarget(target);

    let leadsToTarget: Lead[] = [];
    if (target === 'single' && lead) {
      leadsToTarget = [lead];
    } else if (target === 'all') {
      leadsToTarget = matchingLeads;
    } else if (target === 'new') {
      // Leads that have NOT received a message for this vehicle
      leadsToTarget = matchingLeads.filter(l => !communications.some(c => c.lead_id === l.id));
    }

    if (leadsToTarget.length === 0) {
      alert("Nenhum lead encontrado para este envio.");
      return;
    }

    setTargetLeadsList(leadsToTarget);

    // Default Template
    const defaultTemplate = `Olá {{nome}}, chegou em nosso estoque esse veículo: {{marca}} {{modelo}} {{ano}} por R$ {{valor}}, quer mais detalhes sobre ele?`;
    setMessageTemplate(defaultTemplate);

    setIsMessageModalOpen(true);
  };

  // Filtra os veículos baseado na aba selecionada e nos filtros ativos
  const displayedVehicles = useMemo(() => {
    const filtered = vehicles.filter(v => {
      if (v.status !== inventoryView) return false;
      if (filters.query) {
        const q = filters.query.toLowerCase();
        if (!v.brand.toLowerCase().includes(q) && !v.model.toLowerCase().includes(q) && !v.plate?.toLowerCase().includes(q)) return false;
      }
      if (filters.yearMin && v.year < parseInt(filters.yearMin)) return false;
      if (filters.yearMax && v.year > parseInt(filters.yearMax)) return false;
      if (filters.priceMin && v.price < parseFloat(filters.priceMin)) return false;
      if (filters.priceMax && v.price > parseFloat(filters.priceMax)) return false;
      return true;
    });

    // Aplicar ordenação
    const sorted = [...filtered];
    if (sortBy === 'brand') {
      sorted.sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model));
    } else if (sortBy === 'a-z') {
      sorted.sort((a, b) => a.model.localeCompare(b.model));
    } else if (sortBy === 'z-a') {
      sorted.sort((a, b) => b.model.localeCompare(a.model));
    }

    return sorted;
  }, [vehicles, inventoryView, filters, sortBy]);

  const matchingLeads = useMemo(() => {
    if (!selectedVehicle || selectedVehicle === 'new') return [];
    const v = selectedVehicle as any;
    const isMoto = v.vehicleCategory === 'moto' || (v.category && !v.vehicleCategory);
    const isCaminhao = v.vehicleCategory === 'caminhao';
    
    return leads.filter(l => {
      // Ignore lost/completed leads
      if (l.phase === LeadPhase.DISQUALIFIED || l.phase === LeadPhase.COMPLETED) return false;
      
      const pref = l.preferences;
      
      if (isMoto) {
        if (!pref.interesse_moto) return false;
        
        const matchesCategory = !pref.tipos_moto || pref.tipos_moto.length === 0 || pref.tipos_moto.includes(v.category);
        const matchesBrand = !pref.marcas_moto || pref.marcas_moto.length === 0 || pref.marcas_moto.some(b => v.brand.toLowerCase().includes(b.toLowerCase()));
        const matchesPrice = !pref.moto_valor_max || v.price <= pref.moto_valor_max;
        
        return matchesCategory && matchesBrand && matchesPrice;
      } else if (isCaminhao) {
        if (!pref.interesse_caminhao) return false;
        
        const matchesType = !pref.tipos_caminhao || pref.tipos_caminhao.length === 0 || pref.tipos_caminhao.includes(v.type);
        const matchesBrand = !pref.marcas_caminhao || pref.marcas_caminhao.length === 0 || pref.marcas_caminhao.some(b => v.brand.toLowerCase().includes(b.toLowerCase()));
        const matchesPrice = !pref.caminhao_valor_max || v.price <= pref.caminhao_valor_max;
        
        return matchesType && matchesBrand && matchesPrice;
      } else {
        if (!pref.interesse_carro) return false;
        
        const matchesType = !pref.tipos_veiculo || pref.tipos_veiculo.length === 0 || pref.tipos_veiculo.includes(v.type);
        const matchesBrand = !pref.marcas || pref.marcas.length === 0 || pref.marcas.some(b => v.brand.toLowerCase().includes(b.toLowerCase()));
        const matchesPrice = !pref.carro_valor_max || v.price <= pref.carro_valor_max;
        
        return matchesType && matchesBrand && matchesPrice;
      }
    });
  }, [selectedVehicle, leads]);

  // Manual Lead Selector Logic

  const handleOpenSellModal = () => {
    if (selectedVehicle && typeof selectedVehicle === 'object') {
      setIsSellModalOpen(true);
    }
  };

  const handleEdit = (v: Vehicle) => {
    navigate(`/inventory/edit/${v.id}`);
  };

  const handleDelete = (id: string) => {
    onDeleteVehicle(id);
    setSelectedVehicle(null);
  };

  const handleToggleWebsite = (v: Vehicle) => {
    const isNowVisible = v.showOnWebsite !== false;

    // Atualiza estado local imediatamente (otimista)
    setWebsiteToggles(prev => ({ ...prev, [v.id]: isNowVisible }));

    // Persiste no banco em background
    onUpdateVehicle(v);

    setNotification({
      message: isNowVisible
        ? 'Veículo adicionado ao site público!'
        : 'Veículo removido do site público!',
      type: isNowVisible ? 'success' : 'error'
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const COMMON_OPTIONS = [
    'Ar Condicionado', 'Direção Hidráulica', 'Vidros Elétricos', 'Travas Elétricas',
    'Alarme', 'Airbag', 'Freios ABS', 'Som Multimídia', 'Rodas de Liga Leve',
    'Bancos de Couro', 'Teto Solar', 'Câmera de Ré', 'Sensor de Estacionamento',
    'Piloto Automático', 'Computador de Bordo', 'Tração 4x4', 'Farol de Neblina',
    'Controle de Estabilidade', 'Controle de Tração', 'Chave Presencial'
  ];

  // New Screen for Create/Edit
  // Vehicle form is now a slide-over rendered in the main return

  if (selectedVehicle && selectedVehicle !== 'new') {
    return (
      <div className="animate-fadeUp max-w-[1600px] mx-auto w-full pb-20">
        {/* Detail View Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={handleCloseVehicleDetails} className="flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-colors group">
            <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center group-hover:bg-slate-50 transition-colors">
              <ChevronLeft size={20} />
            </div>
            <span className="font-extrabold text-xs uppercase tracking-widest">Voltar para Estoque</span>
          </button>

          <div className="flex gap-3">
            {selectedVehicle.status === 'available' && (
              <button
                onClick={handleOpenSellModal}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 text-white rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-brand-500/20 hover:bg-brand-600 transition-all"
              >
                <DollarSign size={16} /> Registrar Venda
              </button>
            )}
            <button onClick={() => handleEdit(selectedVehicle)} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-100 rounded-xl text-slate-500 font-extrabold text-xs uppercase tracking-wider hover:text-blue-600 hover:border-blue-100 hover:bg-blue-50 transition-all">
              <Edit3 size={16} /> Editar
            </button>
            <button onClick={() => handleDelete(selectedVehicle.id)} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-100 rounded-xl text-slate-500 font-extrabold text-xs uppercase tracking-wider hover:text-red-600 hover:border-red-100 hover:bg-red-50 transition-all">
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Card */}
          <div className="lg:col-span-2 space-y-8">
            <div className={`bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden ${selectedVehicle.status === 'sold' ? 'opacity-90' : ''}`}>
              {selectedVehicle.imageUrl ? (
                <div className="w-full aspect-square max-h-[700px] mb-8 rounded-[2rem] overflow-hidden group relative">
                  <img src={selectedVehicle.imageUrl} alt={selectedVehicle.model} className="w-full h-full object-cover" />
                  
                  {/* Gallery Overlays if more than one image */}
                  {(selectedVehicle.galleryImages?.length ?? 0) > 0 && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                      <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
                      {selectedVehicle.galleryImages?.map((_, i) => (
                        <div key={i} className="w-2.5 h-2.5 rounded-full bg-white/40" />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="absolute top-0 right-0 p-10 opacity-5">
                  <Car size={300} />
                </div>
              )}

              {/* Mini Gallery Row */}
              {(selectedVehicle.galleryImages?.length ?? 0) > 0 && (
                <div className="grid grid-cols-6 gap-3 mb-10">
                  <div className="aspect-square rounded-xl overflow-hidden border-2 border-brand-500 shadow-lg shadow-brand-500/10 cursor-pointer">
                    <img src={selectedVehicle.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                  {selectedVehicle.galleryImages?.map((url, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden border border-slate-100 hover:border-brand-200 transition-all cursor-pointer opacity-60 hover:opacity-100" 
                         onClick={() => {
                           // Swap logic or open lightbox could go here, for now just visual
                         }}>
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[10px] font-extrabold text-brand-600 uppercase tracking-widest bg-brand-50 px-4 py-1.5 rounded-lg border border-brand-100/50">
                      {selectedVehicle.type}
                    </span>
                    {selectedVehicle.isSingleOwner && (
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest bg-slate-100 px-4 py-1.5 rounded-lg border border-slate-200/50">
                        Único Dono
                      </span>
                    )}
                    {selectedVehicle.hasWarranty && (
                      <span className="text-[10px] font-extrabold text-blue-500 uppercase tracking-widest bg-blue-50 px-4 py-1.5 rounded-lg border border-blue-200/50">
                        Garantia
                      </span>
                    )}
                    {selectedVehicle.isIpvaPaid && (
                      <span className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-4 py-1.5 rounded-lg border border-indigo-200/50">
                        IPVA Pago
                      </span>
                    )}
                    {selectedVehicle.isServiceHistoryComplete && (
                      <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest bg-amber-50 px-4 py-1.5 rounded-lg border border-amber-200/50">
                        Revisões ok
                      </span>
                    )}
                    {selectedVehicle.hasSpareKey && (
                      <span className="text-[10px] font-extrabold text-violet-500 uppercase tracking-widest bg-violet-50 px-4 py-1.5 rounded-lg border border-violet-200/50">
                        Chave Reserva
                      </span>
                    )}
                    {selectedVehicle.hasOwnerManual && (
                      <span className="text-[10px] font-extrabold text-pink-500 uppercase tracking-widest bg-pink-50 px-4 py-1.5 rounded-lg border border-pink-200/50">
                        Manual
                      </span>
                    )}
                  </div>
                  {selectedVehicle.status === 'sold' && (
                    <span className="text-xs font-black text-white bg-red-500 px-4 py-2 rounded-lg uppercase tracking-widest shadow-lg shadow-red-500/20">
                      Vendido
                    </span>
                  )}
                </div>

                <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-[0.9] uppercase mb-4">
                  {selectedVehicle.brand} <br /> {selectedVehicle.model}
                </h1>

                <div className="flex items-end gap-4 mb-4">
                  <p className="text-4xl font-black text-brand-500 tracking-tighter">
                    R$ {(selectedVehicle.price || 0).toLocaleString('pt-BR')}
                  </p>
                  {selectedVehicle.fipePrice ? (
                    <div className="mb-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tabela FIPE</p>
                      <p className="text-xs font-bold text-slate-400">R$ {(selectedVehicle.fipePrice || 0).toLocaleString('pt-BR')}</p>
                    </div>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 mt-12 pt-12 border-t border-slate-50">
                  {[
                    { label: 'Quilometragem', value: selectedVehicle.mileage > 0 ? `${selectedVehicle.mileage.toLocaleString()} km` : '---', icon: Gauge },
                    { label: 'Ano Modelo', value: `${selectedVehicle.year}${selectedVehicle.modelYear && selectedVehicle.modelYear !== selectedVehicle.year ? ' / ' + selectedVehicle.modelYear : ''}`, icon: Calendar },
                    { label: 'Transmissão', value: selectedVehicle.transmission, icon: Car },
                    { label: 'Motorização', value: selectedVehicle.engine, icon: Zap },
                    { label: 'Combustível', value: selectedVehicle.fuelType || 'N/A', icon: Search },
                    { label: 'Portas', value: selectedVehicle.doors ? `${selectedVehicle.doors} Portas` : 'N/A', icon: Hash },
                    { label: 'Cor', value: selectedVehicle.color || 'N/A', icon: Search },
                    { label: 'Placa', value: selectedVehicle.plate || 'N/A', icon: Hash },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 shrink-0">
                        <item.icon size={20} />
                      </div>
                      <div>
                        <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">{item.label}</p>
                        <p className="text-lg font-bold text-slate-900 mt-0.5">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Opcionais movidos para dentro do card principal com borda tracejada */}
                <div className="mt-10 pt-8 border-t border-slate-50">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Tag size={14} /> Opcionais & Detalhes
                  </h3>
                  <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
                    <div className="flex flex-wrap gap-3">
                      {selectedVehicle.optionals && selectedVehicle.optionals.length > 0 ? (
                        selectedVehicle.optionals.flatMap(opt => opt.split('|')).map(s => s.trim()).filter(s => s).map((opt, i) => (
                          <span key={i} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 uppercase tracking-wide shadow-sm">
                            {opt}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-sm font-medium italic">Nenhum opcional cadastrado.</span>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {selectedVehicle.status === 'sold' && selectedVehicle.saleDetails && (
              <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-lg font-extrabold tracking-tight mb-6 flex items-center gap-3">
                    <Check size={24} className="text-brand-400" /> Detalhes da Venda
                  </h3>
                  <div className="grid grid-cols-3 gap-8">
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Valor da Venda</p>
                      <p className="text-3xl font-black text-brand-400">R$ {selectedVehicle.saleDetails.salePrice.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Data</p>
                      <p className="text-xl font-bold">{new Date(selectedVehicle.saleDetails.saleDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Comprador</p>
                      <p className="text-xl font-bold">{selectedVehicle.saleDetails.buyerName}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Matches Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <UserCheck size={24} className="text-brand-500" />
                  <h3 className="text-lg font-extrabold tracking-tight text-slate-900">Leads Compatíveis</h3>
                </div>
                <p className="text-slate-400 text-sm font-medium leading-relaxed mb-4">
                  Encontramos <strong className="text-slate-900">{matchingLeads.length} leads</strong> que buscam um veículo com estas características.
                </p>

                {/* Bulk Actions */}
                <div className="flex gap-2 mb-6">
                  <button onClick={() => prepareMessageModal('all')} className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                    Enviar p/ Todos
                  </button>
                  <button onClick={() => prepareMessageModal('new')} className="flex-1 py-3 bg-brand-50 text-brand-600 border border-brand-100 rounded-xl text-[10px] font-extrabold uppercase tracking-widest hover:bg-brand-100 transition-all flex items-center justify-center gap-2">
                    Enviar p/ Novos
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {matchingLeads.map(lead => {
                const hasReceived = communications.some(c => c.lead_id === lead.id);
                return (
                  <div key={lead.id} onClick={() => onViewLead(lead.id)} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md hover:border-brand-200 transition-all group cursor-pointer relative">

                    {hasReceived && (
                      <div className="absolute top-6 right-6 w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-600" title="Mensagem já enviada">
                        <Check size={16} strokeWidth={3} />
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        {lead.foto_url ? (
                          <img src={lead.foto_url} alt="" className="w-12 h-12 rounded-2xl object-cover shadow-sm" />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-lg text-slate-300 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                            {lead.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-extrabold text-slate-900 uppercase leading-none">{lead.name}</p>
                          <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mt-1">Orçamento: R$ {lead.preferences.carro_valor_max?.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); prepareMessageModal('single', lead); }} className="flex-1 py-3 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-extrabold uppercase tracking-widest group-hover:bg-slate-900 group-hover:text-white transition-colors flex items-center justify-center gap-2">
                        <Send size={14} /> Enviar Mensagem
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onViewLead(lead.id); }} className="flex-1 py-3 bg-white border border-slate-100 text-slate-400 rounded-xl text-[10px] font-extrabold uppercase tracking-widest hover:bg-slate-50 transition-colors">
                        Ver Detalhes
                      </button>
                    </div>
                  </div>
                )
              })}

              {matchingLeads.length === 0 && (
                <div className="text-center py-10 opacity-50">
                  <Users size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum lead compatível</p>
                </div>
              )}
            </div>

            {/* IA Recommendations Section */}
            <div className="bg-gradient-to-br from-indigo-50/50 to-brand-50/30 dark:from-slate-900/60 dark:to-slate-800/40 rounded-[2.5rem] p-8 border border-indigo-100/70 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <Zap size={24} className="text-indigo-600 dark:text-brand-400 animate-pulse" />
                  <h3 className="text-lg font-extrabold tracking-tight text-indigo-950 dark:text-foreground">Recomendações por IA ✨</h3>
                </div>
                <p className="text-indigo-900/60 dark:text-muted-foreground text-sm font-medium leading-relaxed mb-4">
                  A IA analisou o perfil dos leads ativos e gerou argumentos e pitches personalizados.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {loadingIa ? (
                <div className="flex items-center justify-center p-8 bg-white dark:bg-slate-900/40 rounded-[2rem] border border-slate-100 dark:border-border/80 shadow-sm">
                  <Loader2 className="animate-spin text-indigo-500 mr-2.5" size={20} />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Processando...</span>
                </div>
              ) : (
                iaMatches.map(match => {
                  const lead = leads.find(l => l.id === match.leadId);
                  if (!lead) return null;
                  const hasReceived = communications.some(c => c.lead_id === lead.id);
                  
                  return (
                    <div key={match.leadId} onClick={() => onViewLead(lead.id)} className="bg-white dark:bg-card p-6 rounded-[2rem] border border-indigo-100/50 dark:border-border shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-primary/50 transition-all group cursor-pointer relative">
                      {hasReceived && (
                        <div className="absolute top-6 right-6 w-8 h-8 bg-indigo-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-indigo-600 dark:text-brand-400" title="Mensagem já enviada">
                          <Check size={16} strokeWidth={3} />
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50/50 dark:bg-slate-800 flex items-center justify-center font-black text-lg text-indigo-600 dark:text-brand-400 group-hover:bg-indigo-600 group-hover:text-white dark:group-hover:bg-brand-500 transition-colors">
                            {lead.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-extrabold text-indigo-950 dark:text-foreground uppercase leading-none">{lead.name}</p>
                            <p className="text-[9px] font-bold text-indigo-500 dark:text-brand-400 uppercase tracking-widest mt-1">Sugerido por IA</p>
                          </div>
                        </div>
                      </div>
                      <div className="mb-4 p-3 bg-indigo-50/30 dark:bg-slate-800/40 rounded-xl border border-indigo-100/30 dark:border-border/60 text-xs text-indigo-950 dark:text-muted-foreground leading-relaxed font-semibold">
                        {match.reason}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); prepareIaMessageModal(lead, match.whatsappPitch); }} className="flex-1 py-3 bg-indigo-600 dark:bg-primary text-white rounded-xl text-[10px] font-extrabold uppercase tracking-widest hover:bg-indigo-700 dark:hover:bg-primary/95 transition-colors flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10 dark:shadow-none">
                          <Send size={14} /> Abordagem de IA
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onViewLead(lead.id); }} className="flex-1 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-border text-slate-400 rounded-xl text-[10px] font-extrabold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          Detalhes
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
              {!loadingIa && iaMatches.length === 0 && (
                <div className="text-center py-6 bg-white dark:bg-card rounded-[2rem] border border-slate-100 dark:border-border border-dashed opacity-50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nenhuma recomendação de IA</p>
                </div>
              )}
            </div>

            {/* Manual Send Button */}
            <button
              onClick={() => {
                setSelectorSelectedIds([]);
                setSelectorSearch('');
                setIsSelectorOpen(true);
              }}
              className="w-full py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-extrabold uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center justify-center gap-2"
            >
              <Users size={16} /> Enviar p/ Outro Lead
            </button>
          </div>
        </div>

        {/* Lead Selector Modal */}
        {isSelectorOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[10000] flex items-center justify-center p-6" onClick={() => setIsSelectorOpen(false)}>
            <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl animate-fadeUp overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 tracking-tight uppercase">Selecionar Leads</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Selecione os contatos para enviar a mensagem
                  </p>
                </div>
                <button onClick={() => setIsSelectorOpen(false)} className="text-slate-300 hover:text-slate-900 transition-colors"><X size={24} /></button>
              </div>

              <div className="p-6 border-b border-slate-50">
                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Buscar por nome ou telefone..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-brand-500 transition-colors"
                    value={selectorSearch}
                    onChange={e => setSelectorSearch(e.target.value)}
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      const filtered = leads.filter(l =>
                        l.name.toLowerCase().includes(selectorSearch.toLowerCase()) ||
                        l.phone.includes(selectorSearch)
                      );
                      const allFilteredIds = filtered.map(l => l.id);
                      const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectorSelectedIds.includes(id));

                      if (allSelected) {
                        setSelectorSelectedIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
                      } else {
                        setSelectorSelectedIds(prev => [...new Set([...prev, ...allFilteredIds])]);
                      }
                    }}
                    className="text-brand-500 font-extrabold text-[10px] uppercase tracking-widest hover:text-brand-600 transition-colors"
                  >
                    Selecionar / Deselecionar Todos ({leads.filter(l => l.name.toLowerCase().includes(selectorSearch.toLowerCase()) || l.phone.includes(selectorSearch)).length})
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                {(() => {
                  const filtered = leads.filter(l =>
                    l.name.toLowerCase().includes(selectorSearch.toLowerCase()) ||
                    l.phone.includes(selectorSearch)
                  );

                  return (
                    <div className="space-y-1">
                      {filtered.length > 0 ? filtered.map(lead => {
                        const isSelected = selectorSelectedIds.includes(lead.id);
                        return (
                          <div key={lead.id}
                            onClick={() => {
                              if (isSelected) setSelectorSelectedIds(prev => prev.filter(id => id !== lead.id));
                              else setSelectorSelectedIds(prev => [...prev, lead.id]);
                            }}
                            className={`p-4 rounded-xl flex items-center gap-4 cursor-pointer transition-colors border ${isSelected ? 'bg-brand-50 border-brand-200' : 'bg-white border-transparent hover:bg-slate-50'}`}
                          >
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-brand-500 border-brand-500 text-white' : 'border-slate-300 bg-white'}`}>
                              {isSelected && <Check size={12} strokeWidth={4} />}
                            </div>
                            <div className="flex-1">
                              <p className="font-extrabold text-slate-900 uppercase text-xs">{lead.name}</p>
                              <p className="text-[10px] font-bold text-slate-400">{lead.phone}</p>
                            </div>
                            <div className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${lead.phase === LeadPhase.DISQUALIFIED ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-500'}`}>
                              {lead.phase}
                            </div>
                          </div>
                        )
                      }) : (
                        <div className="text-center py-10 text-slate-300 text-xs font-bold uppercase tracking-widest">
                          Nenhum lead encontrado
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  {selectorSelectedIds.length} selecionados
                </div>
                <div className="flex gap-3">
                  {selectorSelectedIds.length > 0 && (
                    <button onClick={() => setSelectorSelectedIds([])} className="px-4 py-3 text-slate-400 hover:text-slate-600 font-extrabold text-[10px] uppercase tracking-widest transition-colors">
                      Limpar
                    </button>
                  )}
                  <button
                    disabled={selectorSelectedIds.length === 0}
                    onClick={() => {
                      const selected = leads.filter(l => selectorSelectedIds.includes(l.id));
                      if (selected.length === 0) return;
                      setTargetLeadsList(selected);
                      setMessageTarget('all'); // Treated as bulk
                      setIsSelectorOpen(false);

                      // Ensure template is set
                      const defaultTemplate = `Olá {{nome}}, chegou em nosso estoque esse veículo: {{marca}} {{modelo}} {{ano}} por R$ {{valor}}, quer mais detalhes sobre ele?`;
                      setMessageTemplate(defaultTemplate);

                      setIsMessageModalOpen(true);
                    }}
                    className="px-8 py-3 bg-brand-500 text-white rounded-xl font-extrabold text-[10px] uppercase tracking-widest hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Prosseguir
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Message Modal */}
        <LeadInterestModal
          isOpen={isMessageModalOpen}
          onClose={() => setIsMessageModalOpen(false)}
          item={selectedVehicle && typeof selectedVehicle === 'object' ? selectedVehicle : null}
          targetLeads={targetLeadsList}
          userEmail={userEmail}
          initialTemplate={messageTemplate}
          onSendComplete={async () => {
            if (selectedVehicle && typeof selectedVehicle === 'object') {
              setCommunications(await leadCommunicationService.listByVehicle(selectedVehicle.id));
            }
          }}
        />

        {/* Sell Vehicle Modal */}
        <SellVehicleModal
          isOpen={isSellModalOpen}
          onClose={() => {
            setIsSellModalOpen(false);
            setSelectedVehicle(null);
          }}
          item={selectedVehicle && typeof selectedVehicle === 'object' ? selectedVehicle : null}
          leads={leads}
          onAddLead={onAddLead}
          onConfirmSell={async (itemId, details) => {
            await onSellVehicle(itemId, details);
            setSelectedVehicle(null);
          }}
        />

        {/* Existing Create/Edit Vehicle Modal */}

      </div>
    );
  }


  // List View
  return (
    <div className="flex flex-col h-full space-y-6 animate-fadeIn pb-10 px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 max-w-[1920px] mx-auto w-full">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-[9999] px-6 py-4 rounded-2xl font-bold text-sm uppercase tracking-wide shadow-2xl animate-fadeUp ${
          notification.type === 'success'
            ? 'bg-brand-500 text-white shadow-brand-500/30'
            : 'bg-rose-500 text-white shadow-rose-500/30'
        }`}>
          {notification.type === 'success' ? '✓' : '!'} {notification.message}
        </div>
      )}

      <div className="flex flex-col gap-6">
        <InventoryHeader
          inventoryView={inventoryView}
          onInventoryViewChange={setInventoryView}
          availableCount={vehicles.filter(v => v.status === 'available').length}
          soldCount={vehicles.filter(v => v.status === 'sold').length}
          availableLabel="Em Estoque"
          soldLabel="Vendidos"
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          isFilterOpen={isFilterOpen}
          onToggleFilter={() => setIsFilterOpen(!isFilterOpen)}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          onNewItem={() => navigate('/inventory/new')}
          newItemLabel="Novo Veículo"
        />

        {/* Filter Panel */}
        {isFilterOpen && (
          <VehicleFilters
            filters={filters}
            onChangeFilters={setFilters}
            clearFilters={clearFilters}
          />
        )}
      </div>

      <div className="flex-1 min-h-0 min-w-0">

        {/* GRID VIEW */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
            {displayedVehicles.map(vehicle => {
              const v = vehicle.id in websiteToggles ? { ...vehicle, showOnWebsite: websiteToggles[vehicle.id] } : vehicle;
              return <VehicleGridCard key={vehicle.id} vehicle={v} onSelect={handleSelectVehicle} onToggleWebsite={handleToggleWebsite} />;
            })}
          </div>
        )}

        {/* LIST VIEW */}
        {viewMode === 'list' && (
          <div className="flex flex-col gap-3">
            {displayedVehicles.map(vehicle => {
              const v = vehicle.id in websiteToggles ? { ...vehicle, showOnWebsite: websiteToggles[vehicle.id] } : vehicle;
              return <VehicleListCard key={vehicle.id} vehicle={v} onSelect={handleSelectVehicle} onToggleWebsite={handleToggleWebsite} />;
            })}
          </div>
        )}

        {/* EMPTY STATE */}
        {displayedVehicles.length === 0 && (
          <div className="py-24 text-center bg-white rounded-[3rem] border border-slate-100 border-dashed mt-6 animate-fadeUp">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-6 border border-slate-50">
              <Car size={48} strokeWidth={1} />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Nenhum veículo encontrado</h3>
            <p className="text-slate-400 text-sm mt-3 max-w-xs mx-auto font-medium">
              {(filters.query || filters.yearMin || filters.priceMax)
                ? 'Os critérios de busca não retornaram resultados. Tente ajustar os filtros.'
                : (inventoryView === 'available' ? 'Seu estoque está vazio. Adicione novos veículos para começar.' : 'Ainda não há veículos registrados como vendidos.')}
            </p>
            {(filters.query || filters.yearMin || filters.priceMax) && (
              <button
                onClick={clearFilters}
                className="mt-8 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-500 transition-all shadow-lg"
              >
                Limpar Todos os Filtros
              </button>
            )}
          </div>
        )}

        <Suspense fallback={null}>
          {isImportModalOpen && (
            <InventoryImportModal
              isOpen={true}
              onClose={() => { if (onDataChange) onDataChange(); setIsImportModalOpen(false); }}
              onSuccess={() => {
                if (onDataChange) onDataChange();
                else window.location.reload();
                setIsImportModalOpen(false);
              }}
              currentVehicles={vehicles}
              leads={leads}
              onSellVehicle={onSellVehicle}
            />
          )}
        </Suspense>
      </div>

    </div>
  );
};

export default Inventory;
