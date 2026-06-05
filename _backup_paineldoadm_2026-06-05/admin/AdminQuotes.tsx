import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Plus, Edit2, Trash2, Check, X, Quote as QuoteIcon } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface MotivationQuote {
    id: string;
    quote: string;
    author: string | null;
    is_active: boolean;
    created_at: string;
}

export default function AdminQuotes() {
    const [quotes, setQuotes] = useState<MotivationQuote[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { showToast } = useToast();

    const [formState, setFormState] = useState<{ id?: string, quote: string, author: string, is_active: boolean }>({
        quote: '',
        author: '',
        is_active: true
    });

    useEffect(() => {
        fetchQuotes();
    }, []);

    const fetchQuotes = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('motivation_quotes').select('*').order('created_at', { ascending: false });
            if (error && error.code !== '42P01') {
                showToast('error', 'Erro ao carregar frases.');
            } else if (data) {
                setQuotes(data);
            }
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!formState.quote.trim()) {
            showToast('error', 'O texto da frase é obrigatório.');
            return;
        }
        try {
            if (formState.id) {
                const { error } = await supabase.from('motivation_quotes').update({
                    quote: formState.quote,
                    author: formState.author,
                    is_active: formState.is_active
                }).eq('id', formState.id);
                if (error) throw error;
                showToast('success', 'Frase atualizada com sucesso.');
            } else {
                const { error } = await supabase.from('motivation_quotes').insert([{
                    quote: formState.quote,
                    author: formState.author,
                    is_active: true
                }]);
                if (error) throw error;
                showToast('success', 'Frase criada com sucesso.');
            }
            setIsModalOpen(false);
            fetchQuotes();
        } catch (e) {
            showToast('error', 'Ocorreu um erro.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Excluir esta frase permanentemente?')) return;
        try {
            const { error } = await supabase.from('motivation_quotes').delete().eq('id', id);
            if (error) throw error;
            showToast('success', 'Excluído com sucesso.');
            fetchQuotes();
        } catch (e) {
            showToast('error', 'Erro ao excluir.');
        }
    };

    const toggleStatus = async (quote: MotivationQuote) => {
        try {
            const { error } = await supabase.from('motivation_quotes').update({ is_active: !quote.is_active }).eq('id', quote.id);
            if (error) throw error;
            fetchQuotes();
        } catch (e) {
            showToast('error', 'Erro ao atualizar status.');
        }
    };

    const openForm = (q?: MotivationQuote) => {
        if (q) setFormState({ id: q.id, quote: q.quote, author: q.author || '', is_active: q.is_active });
        else setFormState({ quote: '', author: '', is_active: true });
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center">
                        <QuoteIcon size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Frases de Motivação</h1>
                        <p className="text-sm font-semibold text-slate-400">Gerencie as frases que aparecem no dashboard dos usuários</p>
                    </div>
                </div>
                <button
                    onClick={() => openForm()}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-colors shadow-md shadow-indigo-500/20 active:scale-95"
                >
                    <Plus size={16} /> Nova Frase
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                    </div>
                ) : quotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                        <QuoteIcon size={48} className="mb-4 opacity-20" />
                        <p className="text-sm font-semibold">Nenhuma frase encontrada. Crie uma para começar.</p>
                        <p className="text-xs font-medium text-slate-400 mt-2 max-w-sm text-center">Nota: Se a tabela no banco de dados ainda não tiver sido criada, execute o script SQL disponibilizado em SUPABASE_QUERIES_PARA_RODAR.sql no terminal do Supabase.</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest w-[50%]">Frase</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest w-[20%]">Autor</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest w-[15%] text-center">Visível</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest w-[15%] text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {quotes.map(q => (
                                <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4">
                                        <p className="text-sm font-medium text-slate-700 italic">"{q.quote}"</p>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-sm font-bold text-slate-600">{q.author || 'Desconhecido'}</span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => toggleStatus(q)}
                                            className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors ${q.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                        >
                                            {q.is_active ? 'Sim' : 'Não'}
                                        </button>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => openForm(q)} className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(q.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-black text-slate-800 tracking-tight">{formState.id ? 'Editar Frase' : 'Nova Frase'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Frase</label>
                                <textarea
                                    value={formState.quote}
                                    onChange={e => setFormState({ ...formState, quote: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                    rows={4}
                                    placeholder="Ex: Vender é construir relacionamento."
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Autor (Opcional)</label>
                                <input
                                    type="text"
                                    value={formState.author}
                                    onChange={e => setFormState({ ...formState, author: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Nome do autor"
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-8">
                                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
                                <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-500 text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-indigo-600 shadow-md shadow-indigo-500/20 active:scale-95 transition-all">
                                    <Check size={16} /> Salvar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
