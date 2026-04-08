
import React from 'react';
import { Truck, Plus, Search, Construction } from 'lucide-react';

const TrucksPage: React.FC = () => {
    return (
        <div className="flex flex-col space-y-8 animate-fadeIn pb-10">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Truck className="text-amber-500" size={32} />
                        Caminhões
                    </h1>
                    <p className="text-slate-400 font-medium mt-1 text-sm">
                        Gerenciamento de caminhões e utilitários em estoque
                    </p>
                </div>
            </div>

            {/* Placeholder */}
            <div className="bg-white rounded-3xl border border-dashed border-amber-200 shadow-sm p-20 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-amber-50 flex items-center justify-center mb-6">
                    <Construction size={36} className="text-amber-400" />
                </div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Em Construção</h2>
                <p className="text-sm text-slate-400 mt-2 max-w-md">
                    O módulo de caminhões está sendo preparado. Em breve você poderá gerenciar seu estoque de caminhões e utilitários com as mesmas funcionalidades do módulo de carros.
                </p>
                <div className="flex items-center gap-3 mt-8">
                    <div className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-xs font-bold flex items-center gap-2">
                        <Truck size={14} /> Estoque de Caminhões
                    </div>
                    <div className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-xs font-bold flex items-center gap-2">
                        <Search size={14} /> Busca e Filtros
                    </div>
                    <div className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-xs font-bold flex items-center gap-2">
                        <Plus size={14} /> Cadastro
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrucksPage;
