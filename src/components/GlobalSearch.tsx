import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Car, Bike, X, ArrowRight, Command } from 'lucide-react';
import { useData } from '../contexts/DataContext';

interface SearchResult {
    id: string;
    type: 'lead' | 'vehicle' | 'motorcycle';
    title: string;
    subtitle: string;
    tag?: string;
    tagColor?: string;
    href: string;
}

interface GlobalSearchProps {
    isOpen: boolean;
    onClose: () => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const { leads, vehicles, motorcycles } = useData() as any;
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelected(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const results: SearchResult[] = React.useMemo(() => {
        if (!query.trim() || query.length < 2) return [];
        const q = query.toLowerCase();
        const out: SearchResult[] = [];

        // Leads
        (leads || []).forEach((l: any) => {
            if (
                l.name?.toLowerCase().includes(q) ||
                l.phone?.toLowerCase().includes(q) ||
                l.email?.toLowerCase().includes(q)
            ) {
                out.push({
                    id: l.id,
                    type: 'lead',
                    title: l.name,
                    subtitle: `${l.phone} · ${l.phase}`,
                    tag: l.phase,
                    tagColor: 'bg-sky-100 text-sky-700',
                    href: `/leads/${l.id}`,
                });
            }
        });

        // Vehicles
        (vehicles || []).forEach((v: any) => {
            if (
                v.brand?.toLowerCase().includes(q) ||
                v.model?.toLowerCase().includes(q) ||
                v.plate?.toLowerCase().includes(q)
            ) {
                out.push({
                    id: v.id,
                    type: 'vehicle',
                    title: `${v.brand} ${v.model}`,
                    subtitle: `${v.year} · ${v.transmission} · R$ ${v.price?.toLocaleString('pt-BR')}`,
                    tag: v.status === 'sold' ? 'Vendido' : 'Disponível',
                    tagColor: v.status === 'sold' ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-600',
                    href: `/inventory`,
                });
            }
        });

        // Motorcycles
        (motorcycles || []).forEach((m: any) => {
            if (
                m.brand?.toLowerCase().includes(q) ||
                m.model?.toLowerCase().includes(q) ||
                m.category?.toLowerCase().includes(q)
            ) {
                out.push({
                    id: m.id,
                    type: 'motorcycle',
                    title: `${m.brand} ${m.model}`,
                    subtitle: `${m.year} · ${m.category} · R$ ${m.price?.toLocaleString('pt-BR')}`,
                    tag: m.status === 'sold' ? 'Vendido' : 'Disponível',
                    tagColor: m.status === 'sold' ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-600',
                    href: `/motorcycles`,
                });
            }
        });

        return out.slice(0, 12);
    }, [query, leads, vehicles, motorcycles]);

    const handleSelect = useCallback((result: SearchResult) => {
        navigate(result.href);
        onClose();
    }, [navigate, onClose]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'Escape') { onClose(); return; }
            if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
            if (e.key === 'Enter' && results[selected]) { handleSelect(results[selected]); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, results, selected, handleSelect, onClose]);

    const typeIcon = (type: string) => {
        if (type === 'lead') return <Users size={13} className="text-sky-500" />;
        if (type === 'vehicle') return <Car size={13} className="text-emerald-500" />;
        return <Bike size={13} className="text-emerald-500" />;
    };

    const typeLabel = (type: string) => {
        if (type === 'lead') return 'Lead';
        if (type === 'vehicle') return 'Veículo';
        return 'Moto';
    };

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[10000] flex items-start justify-center pt-[15vh] px-4"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
                style={{ animation: 'fadeUp 0.15s ease' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Input */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
                    <Search size={18} className="text-slate-400 shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => { setQuery(e.target.value); setSelected(0); }}
                        placeholder="Buscar leads, veículos, motos..."
                        className="flex-1 text-sm font-medium text-slate-800 placeholder:text-slate-300 outline-none bg-transparent"
                    />
                    {query && (
                        <button onClick={() => setQuery('')} className="p-1 text-slate-300 hover:text-slate-500 rounded-lg transition-colors">
                            <X size={14} />
                        </button>
                    )}
                    <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-400 rounded-lg text-[10px] font-bold border border-slate-200">
                        ESC
                    </kbd>
                </div>

                {/* Results */}
                {results.length > 0 ? (
                    <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-50 py-2">
                        {results.map((r, i) => (
                            <button
                                key={r.id + r.type}
                                onClick={() => handleSelect(r)}
                                onMouseEnter={() => setSelected(i)}
                                className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${i === selected ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}
                            >
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${r.type === 'lead' ? 'bg-sky-50' :
                                        r.type === 'vehicle' ? 'bg-emerald-50' : 'bg-emerald-50'
                                    }`}>
                                    {typeIcon(r.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-[13px] font-bold text-slate-900 truncate">{r.title}</p>
                                        {r.tag && (
                                            <span className={`shrink-0 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md ${r.tagColor}`}>
                                                {r.tag}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] font-medium text-slate-400 truncate mt-0.5">{r.subtitle}</p>
                                </div>
                                <span className="text-[9px] font-bold text-slate-300 uppercase shrink-0">{typeLabel(r.type)}</span>
                                {i === selected && <ArrowRight size={12} className="text-emerald-400 shrink-0" />}
                            </button>
                        ))}
                    </div>
                ) : query.length >= 2 ? (
                    <div className="py-12 text-center">
                        <Search size={28} className="text-slate-200 mx-auto mb-3" />
                        <p className="text-sm font-bold text-slate-400">Nenhum resultado para "{query}"</p>
                        <p className="text-[11px] text-slate-300 mt-1">Tente outro nome, telefone ou modelo</p>
                    </div>
                ) : (
                    <div className="px-5 py-4">
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-3">Dicas rápidas</p>
                        <div className="flex flex-wrap gap-2">
                            {['João', 'Toyota', 'Honda', 'Leads'].map(hint => (
                                <button key={hint} onClick={() => setQuery(hint)} className="px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 rounded-xl text-[11px] font-bold border border-slate-100 transition-colors">
                                    {hint}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="border-t border-slate-50 px-5 py-2.5 flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300">
                        <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200">↑↓</kbd> navegar
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300">
                        <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200">↵</kbd> abrir
                    </div>
                    <div className="ml-auto flex items-center gap-1 text-[10px] font-bold text-slate-300">
                        <Command size={10} />
                        <span>K</span>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default GlobalSearch;
