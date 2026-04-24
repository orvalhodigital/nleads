
import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Plus, Search, Filter, MoreHorizontal, MapPin, Gauge, Calendar,
  DollarSign, Hash, Edit3, Trash2, ChevronLeft, ChevronRight, Upload, Loader2, X,
  Check, UserCheck, Users, Tag, Car, Zap, Send, LayoutGrid, List, Table as TableIcon,
  ExternalLink
} from 'lucide-react';
import { Vehicle, VehicleType, TransmissionType, EngineType, Lead, LeadPhase, SaleDetails, LeadTemperature, LeadCommunication } from '../types';
import { supabase } from '../lib/supabaseClient';
import { resizeImage } from '../utils/imageProcessor';
import { carDatabase } from '../data/carDb';
import AutocompleteInput from './ui/AutocompleteInput';

import { CustomDatePicker } from './ui/CustomDatePicker';
import { formatCurrency, parseCurrency } from '../utils/formatters';


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

import InventoryImportModal from './InventoryImportModal';

const Inventory: React.FC<InventoryProps> = ({
  vehicles, onAddVehicle, onUpdateVehicle, onDeleteVehicle, onSellVehicle, leads, onAddLead, onViewLead, userEmail, onDataChange
}) => {
  const navigate = useNavigate();
  /* 
    State Logic:
    selectedVehicle can be:
    - null: List View
    - Vehicle object: Detail View
    - 'new': Create View
  */
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | 'new' | null>(null);

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Walk-in Sale State
  const [walkInLeadName, setWalkInLeadName] = useState('');
  const [walkInLeadPhone, setWalkInLeadPhone] = useState('');

  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Estado para alternar entre estoque disponível e vendidos
  const [inventoryView, setInventoryView] = useState<'available' | 'sold'>('available');

  // View Mode State
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('grid');

  // Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [filterYearMin, setFilterYearMin] = useState<string>('');
  const [filterYearMax, setFilterYearMax] = useState<string>('');
  const [filterPriceMin, setFilterPriceMin] = useState<string>('');
  const [filterPriceMax, setFilterPriceMax] = useState<string>('');

  // Sell Form State
  const [sellData, setSellData] = useState<SaleDetails>({
    salePrice: 0,

    saleDate: new Date().toISOString().split('T')[0],
    buyerName: '',
    buyerLeadId: '',
    isFollowUpSale: true
  });

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
  const location = useLocation();

  React.useEffect(() => {
    if (location.state?.selectedVehicleId && vehicles.length > 0) {
      const vehicle = vehicles.find(v => v.id === location.state.selectedVehicleId);
      if (vehicle) {
        setSelectedVehicle(vehicle);
        // Clean state
        window.history.replaceState({}, document.title);
      }
    }
    if (location.state?.search !== undefined) {
      setFilterQuery(location.state.search);
      // Clean state
      window.history.replaceState({}, document.title);
    }
  }, [location.state, vehicles]);

  // Fetch communications for the selected vehicle
  React.useEffect(() => {
    if (selectedVehicle && selectedVehicle !== 'new') {
      const fetchComms = async () => {
        const { data, error } = await supabase
          .from('lead_communications')
          .select('*')
          .eq('vehicle_id', selectedVehicle.id);
        if (data) setCommunications(data);
      };
      fetchComms();
    }
  }, [selectedVehicle]);

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

  const handleSendMessage = async () => {
    if (!selectedVehicle || selectedVehicle === 'new') return;

    setUploading(true); // Reusing uploading state for loading indicator
    try {
      for (const lead of targetLeadsList) {
        // Construct message
        let msg = messageTemplate
          .replace(/{{nome}}/g, lead.name)
          .replace(/{{marca}}/g, selectedVehicle.brand)
          .replace(/{{modelo}}/g, selectedVehicle.model)
          .replace(/{{ano}}/g, String(selectedVehicle.year))
          .replace(/{{valor}}/g, selectedVehicle.price.toLocaleString());

        // Simulate sending logic removed (as requested by user)
        // Only saving to Supabase DB for external processing

        // Save to Supabase
        const { data: insertedData, error: insertError } = await supabase.from('lead_communications').insert({
          lead_id: lead.id,
          vehicle_id: selectedVehicle.id,
          contact_name: lead.name,
          contact_phone: lead.phone,
          message_body: msg,
          is_sent: 'não',
          email_user: userEmail
        }).select('id').single();

        if (insertError) {
          console.error('Erro ao inserir comunicação:', insertError);
          continue;
        }

        // Disparar Webhook para o n8n
        try {
          await fetch('https://webhook.orvalhodigital.com.br/webhook/puxa-mensagem', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message_id: insertedData?.id,
              lead_id: lead.id,
              name: lead.name,
              phone: lead.phone,
              message: msg,
              user_email: userEmail,
              vehicle: {
                id: selectedVehicle.id,
                brand: selectedVehicle.brand,
                model: selectedVehicle.model
              }
            })
          });
        } catch (webhookError) {
          console.error('Erro ao acionar webhook n8n:', webhookError);
        }
      }

      // Refresh communications
      const { data } = await supabase.from('lead_communications').select('*').eq('vehicle_id', selectedVehicle.id);
      if (data) setCommunications(data);

      setIsMessageModalOpen(false);
      alert(`Mensagem registrada para ${targetLeadsList.length} lead(s)!`);
    } catch (err) {
      alert('Erro ao enviar mensagens.');
    } finally {
      setUploading(false);
    }
  };

  // Filtra os veículos baseado na aba selecionada e nos filtros ativos
  const displayedVehicles = useMemo(() => {
    return vehicles.filter(v => {
      // Status Check
      if (v.status !== inventoryView) return false;

      // Text Search
      if (filterQuery) {
        const q = filterQuery.toLowerCase();
        const textMatch =
          v.brand.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q) ||
          v.plate?.toLowerCase().includes(q);
        if (!textMatch) return false;
      }

      // Year Filter
      if (filterYearMin && v.year < parseInt(filterYearMin)) return false;
      if (filterYearMax && v.year > parseInt(filterYearMax)) return false;

      // Price Filter
      if (filterPriceMin && v.price < parseFloat(filterPriceMin)) return false;
      if (filterPriceMax && v.price > parseFloat(filterPriceMax)) return false;

      return true;
    });
  }, [vehicles, inventoryView, filterQuery, filterYearMin, filterYearMax, filterPriceMin, filterPriceMax]);

  const matchingLeads = useMemo(() => {
    if (!selectedVehicle || selectedVehicle === 'new') return [];
    const v = selectedVehicle as any;
    const isMoto = !!v.category; // Motorcycle interface uses category, Vehicle uses type
    
    return leads.filter(l => {
      // Ignore lost/completed leads
      if (l.phase === LeadPhase.DISQUALIFIED || l.phase === LeadPhase.COMPLETED) return false;
      
      const pref = l.preferences;
      
      if (isMoto) {
        if (!pref.interesse_moto) return false;
        
        const matchesCategory = pref.tipos_moto?.length === 0 || pref.tipos_moto?.includes(v.category);
        const matchesBrand = pref.marcas_moto?.length === 0 || pref.marcas_moto?.some(b => v.brand.toLowerCase().includes(b.toLowerCase()));
        const matchesPrice = !pref.moto_valor_max || v.price <= pref.moto_valor_max;
        
        return matchesCategory && matchesBrand && matchesPrice;
      } else {
        if (!pref.interesse_carro) return false;
        
        const matchesType = pref.tipos_veiculo?.length === 0 || pref.tipos_veiculo?.includes(v.type);
        const matchesBrand = pref.marcas?.length === 0 || pref.marcas?.some(b => v.brand.toLowerCase().includes(b.toLowerCase()));
        const matchesPrice = !pref.carro_valor_max || v.price <= pref.carro_valor_max;
        
        return matchesType && matchesBrand && matchesPrice;
      }
    });
  }, [selectedVehicle, leads]);

  // Manual Lead Selector Logic

  const handleSellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVehicle && selectedVehicle !== 'new') {
      let finalBuyerLeadId = sellData.buyerLeadId;
      let finalBuyerName = sellData.buyerName;

      if (sellData.buyerName === 'Venda Avulsa') {
        if (!walkInLeadName || !walkInLeadPhone) {
          alert("Por favor, preencha o nome e telefone do cliente para a venda avulsa.");
          return;
        }

        // Create Lead Automatically
        const newLead = await onAddLead({
          name: walkInLeadName,
          phone: walkInLeadPhone,
          email: '',
          phase: LeadPhase.COMPLETED,
          temperature: LeadTemperature.HOT,
          preferences: {
            tipos_veiculo: [], marcas: [], modelos: [],
            transmissao: ['Qualquer Um(a)'], motorizacao: ['Qualquer Um(a)'],
            observacoes_adicionais: 'Criado automaticamente via Venda Avulsa',
            possui_entrada: false, possui_troca: false, veiculo_troca: ''
          },
          presentedVehicles: [selectedVehicle.id],
          source: 'Venda Avulsa',
          notes: 'Lead criado automaticamente ao registrar venda avulsa.'
        });

        if (newLead) {
          finalBuyerLeadId = newLead.id;
          finalBuyerName = newLead.name;
        } else {
          return; // Error handled in onAddLead
        }
      } else {
        const selectedLead = leads.find(l => l.name === sellData.buyerName);
        finalBuyerLeadId = selectedLead?.id;
      }

      onSellVehicle(selectedVehicle.id, {
        ...sellData,
        buyerName: finalBuyerName,
        buyerLeadId: finalBuyerLeadId
      });

      setIsSellModalOpen(false);
      setSelectedVehicle(null);
      setWalkInLeadName('');
      setWalkInLeadPhone('');
    }
  };


  const handleEdit = (v: Vehicle) => {
    navigate(`/inventory/edit/${v.id}`);
  };


  const handleOpenSellModal = () => {
    if (selectedVehicle) {
      setSellData({
        salePrice: selectedVehicle.price,
        saleDate: new Date().toISOString().split('T')[0],
        buyerName: '',
        buyerLeadId: '',
        isFollowUpSale: true
      });
      setWalkInLeadName('');
      setWalkInLeadPhone('');
      setIsSellModalOpen(true);
    }
  }

  const handleDelete = (id: string) => {
    onDeleteVehicle(id);
    setSelectedVehicle(null);
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
          <button onClick={() => setSelectedVehicle(null)} className="flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-colors group">
            <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center group-hover:bg-slate-50 transition-colors">
              <ChevronLeft size={20} />
            </div>
            <span className="font-extrabold text-xs uppercase tracking-widest">Voltar para Estoque</span>
          </button>

          <div className="flex gap-3">
            {selectedVehicle.status === 'available' && (
              <button
                onClick={handleOpenSellModal}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
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
                <div className="w-full aspect-[4/5] max-h-[700px] mb-8 rounded-[2rem] overflow-hidden">
                  <img src={selectedVehicle.imageUrl} alt={selectedVehicle.model} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="absolute top-0 right-0 p-10 opacity-5">
                  <Car size={300} />
                </div>
              )}

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-4 py-1.5 rounded-lg border border-emerald-100/50">
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

                <p className="text-4xl font-black text-emerald-500 tracking-tighter">
                  R$ {selectedVehicle.price.toLocaleString('pt-BR')
                  }</p>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 mt-12 pt-12 border-t border-slate-50">
                  {[
                    { label: 'Quilometragem', value: `${selectedVehicle.mileage?.toLocaleString() || 0} km`, icon: Gauge },
                    { label: 'Ano Modelo', value: `${selectedVehicle.year}${selectedVehicle.modelYear && selectedVehicle.modelYear !== selectedVehicle.year ? ' / ' + selectedVehicle.modelYear : ''}`, icon: Calendar },
                    { label: 'Transmissão', value: selectedVehicle.transmission, icon: Car },
                    { label: 'Motorização', value: selectedVehicle.engine, icon: Zap },
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
                    <Check size={24} className="text-emerald-400" /> Detalhes da Venda
                  </h3>
                  <div className="grid grid-cols-3 gap-8">
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Valor da Venda</p>
                      <p className="text-3xl font-black text-emerald-400">R$ {selectedVehicle.saleDetails.salePrice.toLocaleString()}</p>
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
                  <UserCheck size={24} className="text-emerald-500" />
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
                  <button onClick={() => prepareMessageModal('new')} className="flex-1 py-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-[10px] font-extrabold uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center justify-center gap-2">
                    Enviar p/ Novos
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {matchingLeads.map(lead => {
                const hasReceived = communications.some(c => c.lead_id === lead.id);
                return (
                  <div key={lead.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group cursor-pointer relative">

                    {hasReceived && (
                      <div className="absolute top-6 right-6 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600" title="Mensagem já enviada">
                        <Check size={16} strokeWidth={3} />
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        {lead.foto_url ? (
                          <img src={lead.foto_url} alt="" className="w-12 h-12 rounded-2xl object-cover shadow-sm" />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-lg text-slate-300 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                            {lead.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-extrabold text-slate-900 uppercase leading-none">{lead.name}</p>
                          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Orçamento: R$ {lead.preferences.maxPrice?.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => prepareMessageModal('single', lead)} className="flex-1 py-3 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-extrabold uppercase tracking-widest group-hover:bg-slate-900 group-hover:text-white transition-colors flex items-center justify-center gap-2">
                        <Send size={14} /> Enviar Mensagem
                      </button>
                      <button onClick={() => onViewLead(lead.id)} className="flex-1 py-3 bg-white border border-slate-100 text-slate-400 rounded-xl text-[10px] font-extrabold uppercase tracking-widest hover:bg-slate-50 transition-colors">
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
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 transition-colors"
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
                    className="text-emerald-500 font-extrabold text-[10px] uppercase tracking-widest hover:text-emerald-600 transition-colors"
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
                            className={`p-4 rounded-xl flex items-center gap-4 cursor-pointer transition-colors border ${isSelected ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-transparent hover:bg-slate-50'}`}
                          >
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white'}`}>
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
                    className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-extrabold text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Prosseguir
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Message Modal */}
        {isMessageModalOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[10000] flex items-center justify-center p-6" onClick={() => setIsMessageModalOpen(false)}>
            <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl animate-fadeUp overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 tracking-tight uppercase">Enviar Mensagem</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Para: {targetLeadsList.length > 1 ? `${targetLeadsList.length} leads selecionados` : targetLeadsList[0]?.name}
                  </p>
                </div>
                <button onClick={() => setIsMessageModalOpen(false)} className="text-slate-300 hover:text-slate-900 transition-colors"><X size={24} /></button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mensagem do WhatsApp</label>
                  <textarea
                    value={messageTemplate}
                    onChange={e => setMessageTemplate(e.target.value)}
                    className="w-full h-40 p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all font-medium text-sm text-slate-700 resize-none leading-relaxed"
                  />
                  <div className="flex gap-2 flex-wrap">
                    {['{{nome}}', '{{marca}}', '{{modelo}}', '{{ano}}', '{{valor}}'].map(tag => (
                      <button
                        key={tag}
                        onClick={() => setMessageTemplate(prev => prev + ' ' + tag)}
                        className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-500 uppercase hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium italic">* Clique nas tags para adicionar ao texto.</p>
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                <button onClick={() => setIsMessageModalOpen(false)} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-extrabold text-slate-500 uppercase tracking-widest hover:bg-slate-50 transition-all">Cancelar</button>
                <button onClick={handleSendMessage} className="flex-[2] py-4 bg-emerald-500 text-white rounded-2xl text-[11px] font-extrabold uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2">
                  <Send size={16} /> {uploading ? 'Enviando...' : (messageTarget === 'single' ? 'Enviar Mensagem' : 'Registrar Envios')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sell Vehicle Modal */}
        {isSellModalOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[10000] flex items-center justify-center p-6" onClick={() => setIsSellModalOpen(false)}>
            <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-fadeUp" onClick={e => e.stopPropagation()}>
              <form onSubmit={handleSellSubmit}>
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 tracking-tight uppercase">Registrar Venda</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedVehicle?.brand} {selectedVehicle?.model}</p>
                  </div>
                  <button type="button" onClick={() => setIsSellModalOpen(false)} className="text-slate-300 hover:text-slate-900 transition-colors"><X size={24} /></button>
                </div>
                <div className="p-10 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preço Final de Venda</label>
                    <input
                      type="text"
                      required
                      value={formatCurrency(sellData.salePrice)}
                      onChange={e => setSellData({ ...sellData, salePrice: parseCurrency(e.target.value) })}
                      className="w-full p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl font-black outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all text-lg"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data da Venda</label>
                      <CustomDatePicker value={sellData.saleDate} onChange={date => setSellData({ ...sellData, saleDate: date })} className="w-full py-4 px-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none text-sm" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Comprador (Selecione o Lead)</label>
                    <select
                      value={sellData.buyerName}
                      onChange={e => setSellData({ ...sellData, buyerName: e.target.value })}
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none text-sm"
                    >
                      <option value="">Selecione um comprador...</option>
                      <option value="Venda Avulsa">-- Venda Avulsa (Sem Lead) --</option>
                      {leads.map(lead => <option key={lead.id} value={lead.name}>{lead.name}</option>)}
                    </select>
                  </div>

                  {sellData.buyerName === 'Venda Avulsa' && (
                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100 animate-fadeUp bg-slate-50 p-4 rounded-xl">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nome do Cliente *</label>
                        <input
                          required
                          value={walkInLeadName}
                          onChange={e => setWalkInLeadName(e.target.value)}
                          className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all text-sm font-semibold"
                          placeholder="Nome completo"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Telefone *</label>
                        <input
                          required
                          value={walkInLeadPhone}
                          onChange={e => setWalkInLeadPhone(e.target.value)}
                          className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all text-sm font-semibold"
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                  <button type="button" onClick={() => setIsSellModalOpen(false)} className="flex-1 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Cancelar</button>
                  <button type="submit" className="flex-[2] py-4 bg-emerald-500 text-white rounded-2xl text-[11px] font-extrabold uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20">Confirmar Venda</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Existing Create/Edit Vehicle Modal */}

      </div>
    );
  }


  // List View
  return (
    <div className="flex flex-col h-full space-y-6 animate-fadeIn pb-10">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-6 px-1">
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-200/50 p-1 rounded-xl border border-slate-200/30 backdrop-blur-sm">
              <button
                onClick={() => setInventoryView('available')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all duration-300 ${inventoryView === 'available' ? 'bg-white text-emerald-600 shadow-md font-black ring-1 ring-emerald-500/10' : 'text-slate-500 hover:text-slate-700 font-bold'}`}
              >
                <div className={`w-2 h-2 rounded-full ${inventoryView === 'available' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                <span className="text-[11px] uppercase tracking-[0.1em]">Em Estoque</span>
                <span className={`ml-1 text-[9px] px-1.5 py-0.5 rounded-md ${inventoryView === 'available' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                  {vehicles.filter(v => v.status === 'available').length}
                </span>
              </button>
              <button
                onClick={() => setInventoryView('sold')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all duration-300 ${inventoryView === 'sold' ? 'bg-white text-rose-600 shadow-md font-black ring-1 ring-rose-500/10' : 'text-slate-500 hover:text-slate-700 font-bold'}`}
              >
                <div className={`w-2 h-2 rounded-full ${inventoryView === 'sold' ? 'bg-rose-500 animate-pulse' : 'bg-slate-300'}`} />
                <span className="text-[11px] uppercase tracking-[0.1em]">Vendidos</span>
                <span className={`ml-1 text-[9px] px-1.5 py-0.5 rounded-md ${inventoryView === 'sold' ? 'bg-rose-50 text-rose-600' : 'bg-slate-200 text-slate-500'}`}>
                  {vehicles.filter(v => v.status === 'sold').length}
                </span>
              </button>
            </div>

            <div className="h-10 w-px bg-slate-200 mx-2 hidden md:block" />

            <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
              <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}>
                <LayoutGrid size={16} strokeWidth={2.5} />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}>
                <List size={16} strokeWidth={2.5} />
              </button>
              <button onClick={() => setViewMode('table')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}>
                <TableIcon size={16} strokeWidth={2.5} />
              </button>
            </div>

            <button onClick={() => setIsFilterOpen(!isFilterOpen)} className={`flex items-center gap-2 px-5 py-3 border rounded-xl text-[11px] font-black uppercase tracking-[0.1em] transition-all shadow-sm ${isFilterOpen ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/10' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}>
              <Filter size={15} strokeWidth={2.5} />
              Filtrar
            </button>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setIsImportModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl text-[11px] font-black uppercase tracking-[0.1em] hover:shadow-lg hover:shadow-slate-100 transition-all active:scale-95 shadow-sm">
              <Upload size={16} strokeWidth={2.5} /> Importar
            </button>
            <button onClick={() => navigate('/inventory/new')} className="flex items-center gap-2 px-7 py-3 bg-emerald-500 text-white rounded-xl text-[11px] font-black uppercase tracking-[0.12em] hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 ring-2 ring-emerald-500/10 ring-offset-2 ring-offset-slate-50">
              <Plus size={16} strokeWidth={3} /> Novo Veículo
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {isFilterOpen && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm animate-fadeUp">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400 px-1 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={e => setFilterQuery(e.target.value)}
                  placeholder="Marca, modelo ou placa..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500/5 transition-all outline-none"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400 px-1 block">Ano</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={filterYearMin}
                  onChange={e => setFilterYearMin(e.target.value)}
                  placeholder="De"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500/5 transition-all outline-none"
                />
                <input
                  type="number"
                  value={filterYearMax}
                  onChange={e => setFilterYearMax(e.target.value)}
                  placeholder="Até"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500/5 transition-all outline-none"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { setFilterQuery(''); setFilterYearMin(''); setFilterYearMax(''); setFilterPriceMax(''); }}
                className="w-full py-3.5 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-slate-200 transition-all"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 min-w-0">

        {/* GRID VIEW */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayedVehicles.map(vehicle => (
              <div
                key={vehicle.id}
                onClick={() => setSelectedVehicle(vehicle)}
                className={`bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col relative overflow-hidden ${vehicle.status === 'sold' ? 'opacity-90 grayscale-[0.2]' : 'hover:border-emerald-200/60'}`}
              >
                <div className="relative p-3 pb-0">
                  {vehicle.imageUrl ? (
                    <div className="w-full aspect-[4/5] rounded-xl overflow-hidden shadow-inner bg-slate-50">
                      <img src={vehicle.imageUrl} alt={vehicle.model} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    </div>
                  ) : (
                    <div className="w-full aspect-[4/5] rounded-xl bg-slate-50 flex flex-col items-center justify-center text-slate-200 gap-1.5 border border-slate-100/50">
                      <Car size={48} strokeWidth={1} />
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Sem Imagem</span>
                    </div>
                  )}

                  {vehicle.status === 'sold' ? (
                    <div className="absolute top-6 right-6 bg-rose-500 text-white text-[8px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-lg z-20 shadow-lg shadow-rose-500/30 animate-pulse">Vendido</div>
                  ) : (
                    <div className="absolute top-6 right-6 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-lg z-20 shadow-lg shadow-emerald-500/30">Em Estoque</div>
                  )}

                  <div className="absolute bottom-4 left-7 z-20">
                    <span className="text-[8px] font-extrabold text-white uppercase tracking-widest bg-slate-900/40 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 shadow-lg">{vehicle.type}</span>
                  </div>
                </div>

                <div className="p-5 pt-4 flex flex-col flex-1">
                  <div className="mb-4">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-tight mb-1.5 group-hover:text-emerald-600 transition-colors">{vehicle.brand} {vehicle.model}</h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-50 border border-slate-100">
                        <Calendar size={10} className="text-slate-300" />
                        <span>{vehicle.year}{vehicle.modelYear ? ` / ${String(vehicle.modelYear).slice(-2)}` : ''}</span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-50 border border-slate-100">
                        <Gauge size={10} className="text-slate-300" />
                        <span>{vehicle.mileage.toLocaleString()} km</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.15em] mb-0.5">Preço de Venda</span>
                      <p className={`text-lg font-black tracking-tighter ${vehicle.status === 'sold' ? 'text-slate-400 line-through' : 'text-emerald-500'}`}>
                        R$ {vehicle.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white group-hover:shadow-lg transition-all duration-300">
                      <ChevronRight size={16} strokeWidth={3} />
                    </div>
                  </div>
                </div>

                {/* Visual Accent Line */}
                <div className={`h-1 w-full ${vehicle.status === 'sold' ? 'bg-rose-500/20' : 'bg-emerald-500/20'} absolute bottom-0 left-0`} />
              </div>
            ))}
          </div>
        )}

        {/* LIST VIEW */}
        {viewMode === 'list' && (
          <div className="flex flex-col gap-5">
            {displayedVehicles.map(vehicle => (
              <div
                key={vehicle.id}
                onClick={() => setSelectedVehicle(vehicle)}
                className={`bg-white p-4 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all cursor-pointer group flex flex-col md:flex-row gap-8 relative overflow-hidden ${vehicle.status === 'sold' ? 'opacity-90 grayscale-[0.2]' : ''}`}
              >
                {/* Image */}
                <div className="w-full md:w-72 aspect-video md:aspect-[4/3] rounded-[1.8rem] overflow-hidden shrink-0 bg-slate-50 relative border border-slate-100 shadow-inner">
                  {vehicle.imageUrl ? (
                    <img src={vehicle.imageUrl} alt={vehicle.model} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-200">
                      <Car size={48} strokeWidth={1} />
                    </div>
                  )}
                  {vehicle.status === 'sold' && (
                    <div className="absolute top-4 right-4 bg-rose-500 text-white text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg z-10 shadow-lg shadow-rose-500/20">Vendido</div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col py-4 pr-4">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-md border border-emerald-100/50">{vehicle.type}</span>
                        {vehicle.plate && <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-2">{vehicle.plate}</span>}
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none group-hover:text-emerald-600 transition-colors uppercase">{vehicle.brand} {vehicle.model}</h3>
                      <div className="flex items-center gap-4 text-[13px] font-bold text-slate-400 mt-2.5">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-slate-200" />
                          <span>{vehicle.year} {vehicle.modelYear ? `/ ${vehicle.modelYear}` : ''}</span>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-100" />
                        <div className="flex items-center gap-2">
                          <Gauge size={14} className="text-slate-200" />
                          <span>{vehicle.mileage.toLocaleString()} km</span>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-100" />
                        <div className="flex items-center gap-2">
                          <Zap size={14} className="text-slate-200" />
                          <span>{vehicle.transmission}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Optionals */}
                  <div className="flex flex-wrap gap-2 mt-auto">
                    {vehicle.optionals?.slice(0, 5).map((opt, i) => (
                      <span key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-500 uppercase tracking-wide group-hover:bg-white transition-colors">
                        {opt}
                      </span>
                    ))}
                    {vehicle.optionals?.length > 5 && (
                      <span className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-wide">+{vehicle.optionals.length - 5}</span>
                    )}
                  </div>
                </div>

                {/* Price & Action */}
                <div className="flex flex-row md:flex-col justify-between items-end pl-0 md:pl-10 border-t md:border-t-0 md:border-l border-slate-50 pt-6 md:pt-4 md:pb-4 min-w-[200px]">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1.5">Preço de Venda</p>
                    <p className={`text-3xl font-black leading-none tracking-tighter ${vehicle.status === 'sold' ? 'text-slate-400 line-through' : 'text-emerald-500'}`}>R$ {vehicle.price.toLocaleString()}</p>
                    {vehicle.status === 'sold' && vehicle.saleDetails && (
                      <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-lg">
                        <DollarSign size={12} className="text-emerald-500" />
                        <p className="text-xs font-black text-emerald-600">R$ {vehicle.saleDetails.salePrice.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                  <div className="w-14 h-14 rounded-[1.2rem] bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white group-hover:shadow-lg transition-all duration-300">
                    <ChevronRight size={24} strokeWidth={3} />
                  </div>
                </div>

                {/* Visual Accent Line */}
                <div className={`h-1.5 w-full ${vehicle.status === 'sold' ? 'bg-rose-500/20' : 'bg-emerald-500/20'} absolute bottom-0 left-0`} />
              </div>
            ))}
          </div>
        )}

        {/* TABLE VIEW */}
        {viewMode === 'table' && (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-fadeIn">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-50 bg-slate-50/50">
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-32">Veículo</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Especificações</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ano / KM</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Preço</th>
                    <th className="p-6 w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {displayedVehicles.map(vehicle => (
                    <tr key={vehicle.id} onClick={() => setSelectedVehicle(vehicle)} className="group hover:bg-slate-50 transition-colors cursor-pointer">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-12 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 shadow-inner">
                            {vehicle.imageUrl ? (
                              <img src={vehicle.imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-200">
                                <Car size={16} />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 uppercase text-xs group-hover:text-emerald-600 transition-colors">{vehicle.brand} {vehicle.model}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{vehicle.plate || 'S/ PLACA'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-tighter">{vehicle.transmission}</span>
                          <span className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-tighter">{vehicle.engine}</span>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex flex-col">
                          <p className="font-black text-slate-700 text-xs">{vehicle.year}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase">{vehicle.mileage.toLocaleString()} km</p>
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <p className={`font-black text-sm ${vehicle.status === 'sold' ? 'text-slate-400 line-through' : 'text-emerald-500'}`}>R$ {vehicle.price.toLocaleString()}</p>
                        {vehicle.status === 'sold' && vehicle.saleDetails && (
                          <p className="text-[9px] text-emerald-600 font-black mt-1 uppercase tracking-tighter">Vendido: R$ {vehicle.saleDetails.salePrice.toLocaleString()}</p>
                        )}
                      </td>
                      <td className="p-6 text-right">
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all">
                          <ChevronRight size={14} strokeWidth={3} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
              {filterQuery || filterYearMin || filterPriceMax
                ? 'Os critérios de busca não retornaram resultados. Tente ajustar os filtros.'
                : (inventoryView === 'available' ? 'Seu estoque está vazio. Adicione novos veículos para começar.' : 'Ainda não há veículos registrados como vendidos.')}
            </p>
            {(filterQuery || filterYearMin || filterPriceMax) && (
              <button
                onClick={() => { setFilterQuery(''); setFilterYearMin(''); setFilterYearMax(''); setFilterPriceMin(''); setFilterPriceMax(''); }}
                className="mt-8 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg"
              >
                Limpar Todos os Filtros
              </button>
            )}
          </div>
        )}

        <InventoryImportModal
          isOpen={isImportModalOpen}
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
      </div>

    </div>
  );
};

export default Inventory;
