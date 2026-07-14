import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Gauge, Bike, ChevronLeft, Zap } from 'lucide-react';
import { Motorcycle } from '../../types';

interface MotoCardProps {
    moto: Motorcycle;
    onSelect: (m: Motorcycle) => void;
    onToggleWebsite?: (m: Motorcycle) => void;
}

export const MotoGridCard = memo(({ moto: m, onSelect, onToggleWebsite }: MotoCardProps) => {
    const isOnWebsite = m.showOnWebsite !== false;

    const handleToggleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleWebsite?.({ ...m, showOnWebsite: !isOnWebsite });
    };

    return (
        <div className={`bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col relative overflow-hidden ${m.status === 'sold' ? 'opacity-90 grayscale-[0.2]' : 'hover:border-brand-200/60'}`}>
            <div className="relative p-3 pb-0">
                {m.imageUrl ? (
                    <div onClick={() => onSelect(m)} className="w-full aspect-square rounded-xl overflow-hidden shadow-inner bg-slate-50 cursor-pointer">
                        <img src={m.imageUrl} alt={m.model} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    </div>
                ) : (
                    <div onClick={() => onSelect(m)} className="w-full aspect-square rounded-xl bg-slate-50 flex flex-col items-center justify-center text-slate-200 gap-1.5 border border-slate-100/50 cursor-pointer">
                        <Bike size={48} strokeWidth={1} />
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Sem Imagem</span>
                    </div>
                )}
                {m.status === 'sold' ? (
                    <div className="absolute top-6 right-6 bg-rose-500 text-white text-[8px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-lg z-20 shadow-lg shadow-rose-500/30 animate-pulse">Vendida</div>
                ) : (
                    <div className="absolute top-6 right-6 bg-brand-500 text-white text-[8px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-lg z-20 shadow-lg shadow-brand-500/30">Em Estoque</div>
                )}
                <div className="absolute bottom-4 left-7 z-20">
                    <span className="text-[8px] font-extrabold text-white uppercase tracking-widest bg-slate-900/40 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 shadow-lg">{m.category}</span>
                </div>
                {onToggleWebsite && (
                    <div className="absolute bottom-3 right-4 z-20 flex items-center gap-2">
                        <span className={`text-[8px] font-black uppercase tracking-wider transition-colors duration-300 drop-shadow-sm ${isOnWebsite ? 'text-brand-300' : 'text-rose-300'}`}>
                            {isOnWebsite ? 'Site' : 'Oculto'}
                        </span>
                        <button onClick={handleToggleClick} role="switch" aria-checked={isOnWebsite}
                            className={`relative w-9 h-5 rounded-full transition-colors duration-300 shadow-lg focus:outline-none ${isOnWebsite ? 'bg-brand-500' : 'bg-rose-500'}`}>
                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${isOnWebsite ? 'left-4' : 'left-0.5'}`} />
                        </button>
                    </div>
                )}
            </div>
            <div className="p-5 pt-4 flex flex-col flex-1">
                <div className="mb-4">
                    <h3 onClick={() => onSelect(m)} className="text-sm font-black text-slate-900 uppercase tracking-tight leading-tight mb-1.5 group-hover:text-brand-600 transition-colors cursor-pointer">
                        {m.brand} {m.model}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-50 border border-slate-100">
                            <Calendar size={10} className="text-slate-300" />
                            <span>{m.year}{m.modelYear && m.modelYear !== m.year ? ` / ${String(m.modelYear).slice(-2)}` : ''}</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-50 border border-slate-100">
                            <Gauge size={10} className="text-slate-300" />
                            <span>{m.mileage > 0 ? `${m.mileage.toLocaleString()} km` : '---'}</span>
                        </div>
                    </div>
                </div>
                <div onClick={() => onSelect(m)} className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50 cursor-pointer">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.15em] mb-0.5">Preço de Venda</span>
                        <p className={`text-lg font-black tracking-tighter ${m.status === 'sold' ? 'text-slate-400 line-through' : 'text-brand-500'}`}>
                            R$ {m.price.toLocaleString()}
                        </p>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white group-hover:shadow-lg transition-all duration-300">
                        <ChevronLeft className="rotate-180" size={16} strokeWidth={3} />
                    </div>
                </div>
            </div>
            <div className={`h-1 w-full ${m.status === 'sold' ? 'bg-rose-500/20' : 'bg-brand-500/20'} absolute bottom-0 left-0`} />
        </div>
    );
});

export const MotoListCard = memo(({ moto: m, onSelect, onToggleWebsite }: MotoCardProps) => {
    const navigate = useNavigate();
    const isOnWebsite = m.showOnWebsite !== false;

    const handleToggleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleWebsite?.({ ...m, showOnWebsite: !isOnWebsite });
    };

    return (
        <div className={`bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-brand-100 transition-all group flex flex-col sm:flex-row gap-4 relative overflow-hidden ${m.status === 'sold' ? 'opacity-90 grayscale-[0.2]' : ''}`}>
            <div onClick={() => onSelect(m)} className="w-full sm:w-40 h-28 sm:h-28 rounded-xl overflow-hidden shrink-0 bg-slate-50 relative border border-slate-100 shadow-inner cursor-pointer">
                {m.imageUrl ? (
                    <img src={m.imageUrl} alt={m.model} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-200"><Bike size={32} strokeWidth={1} /></div>
                )}
                {m.status === 'sold' && (
                    <div className="absolute top-2 right-2 bg-rose-500 text-white text-[7px] font-black uppercase tracking-wide px-2 py-1 rounded z-10 shadow-lg">Vendida</div>
                )}
            </div>
            <div onClick={() => onSelect(m)} className="flex-1 flex flex-col py-1 cursor-pointer min-w-0">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] font-black text-brand-600 uppercase tracking-wider bg-brand-50 px-2 py-0.5 rounded border border-brand-100/50">{m.category}</span>
                    {m.plate && <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{m.plate}</span>}
                </div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight leading-tight group-hover:text-brand-600 transition-colors truncate">
                    {m.brand} {m.model}
                </h3>
                <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400 mt-1.5 flex-wrap">
                    <div className="flex items-center gap-1"><Calendar size={12} className="text-slate-300" /><span>{m.year}</span></div>
                    <div className="flex items-center gap-1"><Gauge size={12} className="text-slate-300" /><span>{m.mileage > 0 ? `${m.mileage.toLocaleString()} km` : '---'}</span></div>
                    <div className="flex items-center gap-1"><Zap size={12} className="text-slate-300" /><span>{m.engine}</span></div>
                </div>
            </div>
            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-between gap-4 pl-0 sm:pl-4 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-1 sm:pb-1 min-w-max">
                <div className="text-right">
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Preço</p>
                    <p className={`text-xl font-black leading-none tracking-tighter ${m.status === 'sold' ? 'text-slate-400 line-through' : 'text-brand-500'}`}>
                        R$ {m.price.toLocaleString()}
                    </p>
                </div>
                {onToggleWebsite && (
                    <div className="flex flex-col items-end gap-1.5">
                        <span className={`text-[9px] font-black uppercase tracking-widest transition-colors duration-300 ${isOnWebsite ? 'text-brand-600' : 'text-rose-500'}`}>
                            {isOnWebsite ? 'No Site' : 'Oculto'}
                        </span>
                        <button onClick={handleToggleClick} role="switch" aria-checked={isOnWebsite}
                            className={`relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${isOnWebsite ? 'bg-brand-500 focus:ring-brand-400' : 'bg-rose-500 focus:ring-rose-400'}`}>
                            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${isOnWebsite ? 'left-6' : 'left-1'}`} />
                        </button>
                    </div>
                )}
            </div>
            <div className={`h-1 w-full ${m.status === 'sold' ? 'bg-rose-500/20' : 'bg-brand-500/20'} absolute bottom-0 left-0`} />
        </div>
    );
});
