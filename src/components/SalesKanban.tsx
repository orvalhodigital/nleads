import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useKanbanTouchDrag } from '../hooks/useKanbanTouchDrag';
import { DragDropContext, Droppable, Draggable, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';
import {
    Car, Package, Clock, CheckCircle2,
    DollarSign, Plus, User, X, Tag, Navigation, Truck, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Vehicle, VehicleKanbanPhase, Lead, LeadPhase } from '../types';
import { vehicleService } from '../services/vehicleService';
import { formatCurrency } from '../utils/formatters';
import { useData } from '../contexts/DataContext';
import CustomSelect from './ui/CustomSelect';
import { supabase } from '../lib/supabaseClient';
import Modal from './ui/Modal';

interface SalesKanbanProps {
    vehicles: Vehicle[];
    leads: Lead[];
    onDataChange: () => void;
    onSellVehicle: (id: string, details: any) => void;
    onUpdateLead: (lead: Lead) => Promise<void>;
}

interface KanbanColumn {
    phase: VehicleKanbanPhase;
    label: string;
    icon: React.ReactNode;
    color: string;
    bgCol: string;
    headerBg: string;
    btnBg: string;
    border: string;
    textColor: string;
    badgeBg: string;
}

const COLUMNS: KanbanColumn[] = [
    {
        phase: 'em_transito',
        label: 'Em Trânsito',
        icon: <Navigation size={14} />,
        color: 'blue',
        bgCol: 'bg-blue-50/60',
        headerBg: 'bg-blue-100/80',
        btnBg: 'bg-blue-500',
        border: 'border-blue-200',
        textColor: 'text-blue-600',
        badgeBg: 'bg-blue-100 text-blue-600',
    },
    {
        phase: 'disponivel',
        label: 'Disponível',
        icon: <Package size={14} />,
        color: 'slate',
        bgCol: 'bg-slate-50/60',
        headerBg: 'bg-slate-100/80',
        btnBg: 'bg-slate-500',
        border: 'border-slate-200',
        textColor: 'text-slate-600',
        badgeBg: 'bg-slate-100 text-slate-600',
    },
    {
        phase: 'reservado',
        label: 'Reservado',
        icon: <Clock size={14} />,
        color: 'emerald',
        bgCol: 'bg-emerald-50/50',
        headerBg: 'bg-emerald-100/70',
        btnBg: 'bg-emerald-500',
        border: 'border-emerald-200',
        textColor: 'text-emerald-700',
        badgeBg: 'bg-emerald-100 text-emerald-700',
    },
    {
        phase: 'entregando',
        label: 'Entregando',
        icon: <Truck size={14} />,
        color: 'purple',
        bgCol: 'bg-purple-50/50',
        headerBg: 'bg-purple-100/70',
        btnBg: 'bg-purple-600',
        border: 'border-purple-200',
        textColor: 'text-purple-700',
        badgeBg: 'bg-purple-100 text-purple-700',
    },
    {
        phase: 'vendido',
        label: 'Vendido',
        icon: <CheckCircle2 size={14} />,
        color: 'teal',
        bgCol: 'bg-teal-50/40',
        headerBg: 'bg-teal-100/70',
        btnBg: 'bg-teal-600',
        border: 'border-teal-200',
        textColor: 'text-teal-700',
        badgeBg: 'bg-teal-100 text-teal-700',
    },
];

const SalesKanban: React.FC<SalesKanbanProps> = ({
    vehicles, leads, onDataChange, onSellVehicle, onUpdateLead
}) => {
    const navigate = useNavigate();
    const { showToast } = useData();
    const [isDraggingVehicle, setIsDraggingVehicle] = useState(false);
    const [overridePhases, setOverridePhases] = useState<Record<string, VehicleKanbanPhase>>({});
    const lastDragX = React.useRef<number | null>(null);
    const dragVelocityX = React.useRef(0);

    const [touchDraggingId, setTouchDraggingId] = useState<string | null>(null);
    const [touchHoveredPhase, setTouchHoveredPhase] = useState<string | null>(null);
    const [touchHoveredIndex, setTouchHoveredIndex] = useState<number | null>(null);
    const onDragEndRef = React.useRef<(result: any) => void>(() => { });

    const kanbanScrollRef = React.useRef<HTMLDivElement>(null);
    const dragScrollSpeed = React.useRef(0);

    const touchDragCallbacks = React.useMemo(() => ({
        onDragStart: (id: string, _phase: string) => {
            setTouchDraggingId(id);
        },
        onDragEnd: (id: string, fromPhase: string, toPhase: string | null, toIndex: number | null) => {
            setTouchDraggingId(null);
            setTouchHoveredPhase(null);
            setTouchHoveredIndex(null);
            if (!toPhase || toPhase === fromPhase) return;
            onDragEndRef.current({ draggableId: id, destination: { droppableId: toPhase, index: toIndex } });
        },
        onColumnHover: (phase: string | null, index: number | null) => {
            setTouchHoveredPhase(phase);
            setTouchHoveredIndex(index);
        },
    }), []);

    const { onTouchStart, onTouchMove, onTouchEnd } = useKanbanTouchDrag(
        kanbanScrollRef,
        touchDragCallbacks
    );

    const [thumbWidth, setThumbWidth] = useState(100);
    const [thumbLeft, setThumbLeft] = useState(0);
    const [showScrollbar, setShowScrollbar] = useState(false);
    const isDraggingThumb = React.useRef(false);
    const thumbDragStartX = React.useRef(0);
    const thumbDragStartScrollLeft = React.useRef(0);

    const updateThumb = useCallback(() => {
        const el = kanbanScrollRef.current;
        if (!el) return;
        const { scrollLeft, scrollWidth, clientWidth } = el;
        if (scrollWidth <= clientWidth) { setShowScrollbar(false); return; }
        setShowScrollbar(true);
        const tw = (clientWidth / scrollWidth) * 100;
        const tl = (scrollLeft / (scrollWidth - clientWidth)) * (100 - tw);
        setThumbWidth(tw);
        setThumbLeft(tl);
    }, []);

    React.useEffect(() => {
        const el = kanbanScrollRef.current;
        if (!el) return;
        el.addEventListener('scroll', updateThumb, { passive: true });
        const ro = new ResizeObserver(updateThumb);
        ro.observe(el);
        updateThumb();
        return () => { el.removeEventListener('scroll', updateThumb); ro.disconnect(); };
    }, [updateThumb]);

    const getVehiclePhase = (v: Vehicle): VehicleKanbanPhase => {
        if (overridePhases[v.id]) return overridePhases[v.id];
        if (v.sale_phase) return v.sale_phase as VehicleKanbanPhase;
        return v.status === 'sold' ? 'vendido' : 'disponivel';
    };

    const vehiclesInColumn = (phase: VehicleKanbanPhase) =>
        vehicles.filter(v => getVehiclePhase(v) === phase);

    const onDragStart = () => {
        setIsDraggingVehicle(true);
        lastDragX.current = null;
        dragVelocityX.current = 0;
    };

    const onDragEnd = useCallback(async (result: any) => {
        setIsDraggingVehicle(false);
        dragScrollSpeed.current = 0;
        lastDragX.current = null;
        dragVelocityX.current = 0;
        if (!result.destination) return;

        const { draggableId, destination } = result;
        const newPhase = destination.droppableId as VehicleKanbanPhase;
        const vehicle = vehicles.find(v => v.id === draggableId);

        if (!vehicle || getVehiclePhase(vehicle) === newPhase) return;

        const phaseLabels: Record<VehicleKanbanPhase, string> = {
            em_transito: 'Em Trânsito',
            disponivel: 'Disponível',
            reservado: 'Reservado',
            entregando: 'Entregando',
            vendido: 'Vendido',
        };

        setOverridePhases(prev => ({ ...prev, [vehicle.id]: newPhase }));
        showToast('success', `"${vehicle.brand} ${vehicle.model}" movido para ${phaseLabels[newPhase]}`);

        vehicleService.updateSalePhase(draggableId, newPhase, vehicle.saleDetails)
            .then(() => onDataChange())
            .catch(() => {
                setOverridePhases(prev => {
                    const next = { ...prev };
                    delete next[vehicle.id];
                    return next;
                });
                showToast('error', 'Erro ao mover veículo.');
            });
    }, [vehicles, onDataChange, showToast]);
    onDragEndRef.current = onDragEnd;

    React.useEffect(() => {
        if (!isDraggingVehicle) {
            dragScrollSpeed.current = 0;
            lastDragX.current = null;
            return;
        }

        let frame: number;
        const performScroll = () => {
            if (dragScrollSpeed.current !== 0 && kanbanScrollRef.current) {
                kanbanScrollRef.current.scrollLeft += dragScrollSpeed.current;
            }
            frame = requestAnimationFrame(performScroll);
        };
        frame = requestAnimationFrame(performScroll);

        const handlePointerMove = (e: MouseEvent | TouchEvent) => {
            const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
            const width = window.innerWidth;
            const edgeThreshold = 90;

            if (lastDragX.current !== null) {
                dragVelocityX.current = clientX - lastDragX.current;
            }
            lastDragX.current = clientX;

            if (clientX < edgeThreshold) {
                const intensity = (edgeThreshold - clientX) / edgeThreshold;
                dragScrollSpeed.current = -18 * intensity;
            } else if (clientX > width - edgeThreshold) {
                const intensity = (clientX - (width - edgeThreshold)) / edgeThreshold;
                dragScrollSpeed.current = 18 * intensity;
            } else {
                const velocity = dragVelocityX.current;
                if (Math.abs(velocity) > 3) {
                    dragScrollSpeed.current = velocity * 1.2;
                } else {
                    dragScrollSpeed.current = 0;
                }
            }
        };

        window.addEventListener('mousemove', handlePointerMove);
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('mousemove', handlePointerMove);
            dragScrollSpeed.current = 0;
        };
    }, [isDraggingVehicle]);

    const totalValue = (phase: VehicleKanbanPhase) =>
        vehiclesInColumn(phase).reduce((sum, v) => sum + v.price, 0);

    return (
        <div className="flex flex-col h-full">
            <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
                <style>{`
                    .kanban-scroll-hide::-webkit-scrollbar { display: none; }
                    .kanban-scroll-hide { scrollbar-width: none; -ms-overflow-style: none; }
                    .kanban-touch-over {
                        background: rgba(0, 0, 0, 0.05) !important;
                        box-shadow: inset 0 0 0 2px rgba(16, 185, 129, 0.2) !important;
                    }
                    .kanban-card-touch-source { opacity: 0.4; transform: scale(0.96); }
                    .kanban-thumb { transition: background 0.2s, transform 0.1s; }
                    .kanban-thumb:hover { background: linear-gradient(90deg, #94a3b8, #64748b) !important; transform: scaleY(1.3); }
                    .kanban-thumb:active { cursor: grabbing !important; }
                `}</style>
                <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
                <div
                    ref={kanbanScrollRef}
                    className="kanban-scrollbar flex gap-4 flex-1 min-h-0 overflow-x-auto pb-4 scroll-smooth"
                >
                    {COLUMNS.map(col => {
                        const colVehicles = vehiclesInColumn(col.phase);
                        const colTotal = totalValue(col.phase);

                        return (
                            <div
                                key={col.phase}
                                data-phase={col.phase}
                                className={`shrink-0 w-[270px] md:w-[280px] flex flex-col rounded-[22px] border ${col.border} ${col.bgCol} overflow-hidden transition-all duration-300 relative group/droppable`}
                            >
                                <div className={`${col.headerBg} px-4 py-3 border-b ${col.border} flex items-center justify-between`}>
                                    <div className="flex items-center gap-2">
                                        <div className={`p-2 rounded-lg bg-white/80 shadow-sm ${col.textColor}`}>
                                            {col.icon}
                                        </div>
                                        <div>
                                            <h3 className={`text-[11px] font-black uppercase tracking-wider ${col.textColor}`}>{col.label}</h3>
                                            {colTotal > 0 && (
                                                <p className="text-[9px] font-bold text-slate-400">R$ {formatCurrency(colTotal)}</p>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${col.badgeBg}`}>
                                        {colVehicles.length}
                                    </span>
                                </div>

                                <Droppable droppableId={col.phase}>
                                    {(provided, snapshot) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className={`flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 min-h-[200px] transition-colors ${snapshot.isDraggingOver ? 'bg-black/5' : ''}`}
                                            style={{ scrollbarWidth: 'none' }}
                                        >
                                            <div className={`h-1 rounded-full ${col.btnBg} opacity-40 shrink-0 mb-1`} />

                                            {colVehicles.length === 0 && !snapshot.isDraggingOver && (
                                                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                                                    <Car size={28} className="text-slate-200 mb-2" />
                                                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Vazio</p>
                                                </div>
                                            )}

                                            {colVehicles.map((vehicle, index) => {
                                                const buyerLead = vehicle.saleDetails?.buyerLeadId
                                                    ? leads.find(l => l.id === vehicle.saleDetails!.buyerLeadId)
                                                    : null;

                                                const isPlaceholderPosition = touchHoveredPhase === col.phase && touchHoveredIndex === index;

                                                return (
                                                    <React.Fragment key={vehicle.id}>
                                                        {isPlaceholderPosition && (
                                                            <div className="kanban-placeholder h-32 mb-2.5 animate-pulse" />
                                                        )}
                                                        <Draggable draggableId={vehicle.id} index={index}>
                                                        {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => {
                                                            const card = (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    style={provided.draggableProps.style}
                                                                    onClick={() => !snapshot.isDragging && !touchDraggingId && navigate(`/inventory`, { state: { selectedVehicleId: vehicle.id } })}
                                                                    onTouchStart={(e) => onTouchStart(e, vehicle.id, col.phase)}
                                                                    onTouchMove={onTouchMove}
                                                                    onTouchEnd={onTouchEnd}
                                                                    className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-3.5 cursor-grab active:cursor-grabbing group transition-all
                                                                        ${snapshot.isDragging ? 'shadow-xl ring-2 ring-emerald-500/30' : 'hover:shadow-md hover:border-slate-200'}
                                                                        ${touchDraggingId === vehicle.id ? 'kanban-card-touch-source' : ''}
                                                                    `}
                                                                >
                                                                    <div className="flex items-center gap-3 mb-2.5">
                                                                        {vehicle.imageUrl ? (
                                                                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-50 shrink-0 border border-slate-100">
                                                                                <img src={vehicle.imageUrl} alt={vehicle.model} className="w-full h-full object-contain" />
                                                                            </div>
                                                                        ) : (
                                                                            <div className={`w-10 h-10 rounded-xl ${col.btnBg} bg-opacity-10 flex items-center justify-center shrink-0`}>
                                                                                <Car size={16} className={col.textColor} />
                                                                            </div>
                                                                        )}
                                                                        <div className="min-w-0">
                                                                            <p className="text-[12px] font-black text-slate-900 leading-tight truncate group-hover:text-emerald-600 transition-colors">
                                                                                {vehicle.brand} {vehicle.model}
                                                                            </p>
                                                                            <div className="flex items-center gap-1 mt-0.5">
                                                                                <span className="text-[8px] font-bold text-slate-400 uppercase bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                                                                    {vehicle.year}
                                                                                </span>
                                                                                <span className="text-[8px] font-bold text-slate-400 uppercase bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                                                                    {vehicle.type}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <div className="flex flex-col gap-0.5">
                                                                            <div className="flex items-center gap-1">
                                                                                <DollarSign size={10} className="text-emerald-400" />
                                                                                <span className="text-[13px] font-black text-emerald-600">
                                                                                    R$ {formatCurrency(vehicle.price)}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        {vehicle.color && (
                                                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">{vehicle.color}</span>
                                                                        )}
                                                                    </div>

                                                                    {(col.phase !== 'disponivel') && (buyerLead || vehicle.saleDetails?.buyerName) && (
                                                                        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 rounded-xl border border-slate-100 mt-1">
                                                                            <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                                                                <User size={9} className="text-slate-500" />
                                                                            </div>
                                                                            <span className="text-[9px] font-bold text-slate-600 truncate">
                                                                                {buyerLead?.name || vehicle.saleDetails?.buyerName}
                                                                            </span>
                                                                            {col.phase === 'vendido' && vehicle.saleDetails?.saleDate && (
                                                                                <span className="ml-auto text-[8px] font-bold text-teal-600 shrink-0">
                                                                                    {new Date(vehicle.saleDetails.saleDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );

                                                            return <>{card}</>;
                                                        }}
                                                        </Draggable>
                                                    </React.Fragment>
                                                );
                                            })}

                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        );
                    })}
                </div>

                {showScrollbar && (
                    <div className="absolute bottom-1 left-4 right-4 h-1.5 bg-slate-200/30 rounded-full">
                        <div
                            className="kanban-thumb h-full bg-gradient-to-r from-slate-400 to-slate-500 rounded-full"
                            style={{ left: `${thumbLeft}%`, width: `${thumbWidth}%` }}
                            onPointerDown={e => {
                                e.preventDefault();
                                isDraggingThumb.current = true;
                                thumbDragStartX.current = e.clientX;
                                thumbDragStartScrollLeft.current = kanbanScrollRef.current?.scrollLeft ?? 0;
                                (e.target as HTMLDivElement).setPointerCapture(e.pointerId);
                            }}
                            onPointerMove={(e) => {
                                if (!isDraggingThumb.current || !kanbanScrollRef.current) return;
                                const el = kanbanScrollRef.current;
                                const trackWidth = el.parentElement?.clientWidth ?? el.clientWidth;
                                const dx = e.clientX - thumbDragStartX.current;
                                const scrollRatio = dx / (trackWidth * (1 - thumbWidth / 100));
                                el.scrollLeft = thumbDragStartScrollLeft.current + scrollRatio * (el.scrollWidth - el.clientWidth);
                            }}
                            onPointerUp={() => { isDraggingThumb.current = false; }}
                        />
                    </div>
                )}
                </div>
            </DragDropContext>
        </div>
    );
};

export default SalesKanban;
