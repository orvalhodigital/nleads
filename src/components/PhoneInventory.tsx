import React, { useState } from 'react';
import { Smartphone, Plus, Search, Filter, MoreVertical, Edit2, Trash2, Tag, Battery, Cpu, CheckCircle2 } from 'lucide-react';
import { Phone, SaleDetails } from '../types';

interface PhoneInventoryProps {
    phones: Phone[];
    onAddPhone: (phone: Omit<Phone, 'id' | 'createdAt'>) => void;
    onUpdatePhone: (phone: Phone) => void;
    onDeletePhone: (id: string) => void;
    onSellPhone: (id: string, saleDetails: SaleDetails) => void;
}

const PhoneInventory: React.FC<PhoneInventoryProps> = ({
    phones,
    onAddPhone,
    onUpdatePhone,
    onDeletePhone,
    onSellPhone
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const filteredPhones = phones.filter(p =>
        p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.model.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Estoque de Celulares</h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">Gerencie seu inventário de dispositivos</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-500 transition-all shadow-xl shadow-slate-200 active:scale-95"
                >
                    <Plus size={18} />
                    Adicionar Aparelho
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPhones.map(phone => (
                    <div key={phone.id} className="bg-white rounded-[2rem] border border-slate-100 p-6 hover:shadow-2xl hover:shadow-slate-200 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900">
                                <MoreVertical size={20} />
                            </button>
                        </div>

                        <div className="flex items-start gap-6">
                            <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all overflow-hidden shrink-0">
                                {phone.imageUrl ? (
                                    <img src={phone.imageUrl} alt={phone.model} className="w-full h-full object-cover" />
                                ) : (
                                    <Smartphone size={40} />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="inline-block px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                                    {phone.brand}
                                </span>
                                <h3 className="text-xl font-black text-slate-900 truncate tracking-tight">{phone.model}</h3>
                                <div className="flex items-center gap-4 mt-4">
                                    <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                                        <Cpu size={14} />
                                        {phone.capacity || 'N/A'}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                                        <Battery size={14} />
                                        {phone.batteryHealth ? `${phone.batteryHealth}%` : 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-50">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Preço de Venda</p>
                                <p className="text-2xl font-black text-slate-900 tracking-tight">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(phone.price)}
                                </p>
                            </div>
                            <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${phone.status === 'available' ? 'bg-emerald-50 text-emerald-600' :
                                    phone.status === 'reserved' ? 'bg-amber-50 text-amber-600' :
                                        'bg-slate-100 text-slate-500'
                                }`}>
                                {phone.status === 'available' ? 'Disponível' :
                                    phone.status === 'reserved' ? 'Reservado' : 'Vendido'}
                            </div>
                        </div>
                    </div>
                ))}

                {filteredPhones.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mb-6">
                            <Search size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Nenhum aparelho encontrado</h3>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2">Tente ajustar sua busca ou adicione um novo item</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PhoneInventory;
