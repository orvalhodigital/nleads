import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, AlertTriangle, Check, CheckCircle, Database } from 'lucide-react';
import ExcelJS from 'exceljs';
import { supabase } from '../lib/supabaseClient';
import { Lead, LeadPhase, LeadTemperature, VehicleType } from '../types';
import { useToast } from '../contexts/ToastContext';

interface LeadImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    currentLeads: Lead[];
}

type Step = 'upload' | 'preview_leads';

interface ImportedLead {
    importId: string;
    name: string;
    phone: string;
    email: string;
    source: string;
    temperature: LeadTemperature;
    interestBrand: string;
    interestModel: string;
    notes: string;
    status: 'new' | 'duplicate';
}

export default function LeadImportModal({ isOpen, onClose, onSuccess, currentLeads }: LeadImportModalProps) {
    const { showToast } = useToast();
    const [step, setStep] = useState<Step>('upload');
    const [importedLeads, setImportedLeads] = useState<ImportedLead[]>([]);

    // Selection states
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const downloadTemplate = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Modelo Leads");

        // Headers
        worksheet.columns = [
            { header: 'Nome', key: 'Nome', width: 30 },
            { header: 'Telefone', key: 'Telefone', width: 20 },
            { header: 'Email', key: 'Email', width: 30 },
            { header: 'Origem', key: 'Origem', width: 15 },
            { header: 'Temperatura (Fria, Morna, Quente)', key: 'Temperatura', width: 25 },
            { header: 'Interesse Marca', key: 'Interesse Marca', width: 20 },
            { header: 'Interesse Modelo', key: 'Interesse Modelo', width: 20 },
            { header: 'Notas', key: 'Notas', width: 40 }
        ];

        // write file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = "modelo_leads.xlsx";
        anchor.click();
        window.URL.revokeObjectURL(url);
    };

    const normalizePhone = (phone: string) => {
        return phone.replace(/\D/g, '');
    };

    const parseTemperature = (temp: string): LeadTemperature => {
        const t = temp?.toLowerCase().trim();
        if (t === 'quente' || t === 'hot') return LeadTemperature.HOT;
        if (t === 'morna' || t === 'warm') return LeadTemperature.WARM;
        return LeadTemperature.COLD;
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            const buffer = await file.arrayBuffer();
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(buffer);
            const worksheet = workbook.worksheets[0];

            if (!worksheet) throw new Error("Planilha inválida ou vazia");

            const data: any[] = [];
            const headers: string[] = [];

            // Get headers from first row
            worksheet.getRow(1).eachCell((cell, colNumber) => {
                headers[colNumber] = cell.value?.toString() || '';
            });

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // Skip header

                const rowData: any = {};
                row.eachCell((cell, colNumber) => {
                    const header = headers[colNumber];
                    if (header) {
                        let val = cell.value;
                        // Handle rich text or formula results if any
                        if (val && typeof val === 'object') {
                            if ('text' in val) val = (val as any).text;
                            else if ('result' in val) val = (val as any).result;
                        }
                        rowData[header] = val;
                    }
                });
                data.push(rowData);
            });

            // Map of existing phones for fast lookup
            const existingPhones = new Set(currentLeads.map(l => normalizePhone(l.phone)));
            const existingEmails = new Set(currentLeads.map(l => l.email.toLowerCase().trim()).filter(Boolean));

            // Process data
            const processed: ImportedLead[] = data.map((row, index) => {
                const phone = String(row['Telefone'] || '').trim();
                const email = String(row['Email'] || '').trim();
                const normPhone = normalizePhone(phone);
                const normEmail = email.toLowerCase();

                let status: 'new' | 'duplicate' = 'new';
                if ((normPhone && existingPhones.has(normPhone)) || (normEmail && existingEmails.has(normEmail))) {
                    status = 'duplicate';
                }

                return {
                    importId: `lead-${index}`,
                    name: row['Nome'] || 'Sem Nome',
                    phone: phone,
                    email: email,
                    source: row['Origem'] || 'Importação',
                    temperature: parseTemperature(row['Temperatura'] || ''),
                    interestBrand: row['Interesse Marca'] || '',
                    interestModel: row['Interesse Modelo'] || '',
                    notes: row['Notas'] || '',
                    status: status
                };
            });

            setImportedLeads(processed);

            // Pre-select only new leads
            const newIds = processed.filter(l => l.status === 'new').map(l => l.importId);
            setSelectedIds(new Set(newIds));

            setStep('preview_leads');
        } catch (err) {
            console.error(err);
            showToast('error', "Erro ao processar arquivo. Verifique se o formato está correto.");
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        const toImport = importedLeads.filter(l => selectedIds.has(l.importId));

        if (toImport.length > 0) {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();

                const leadsToInsert = toImport.map(l => ({
                    name: l.name,
                    phone: l.phone,
                    email: l.email,
                    source: l.source,
                    temperature: l.temperature,
                    phase: LeadPhase.NEW,
                    tipos_veiculo: [],
                    marcas: l.interestBrand ? [l.interestBrand] : [],
                    modelos: l.interestModel ? [l.interestModel] : [],
                    transmissao: ['Qualquer Um(a)'],
                    motorizacao: ['Qualquer Um(a)'],
                    observacoes_adicionais: l.notes || '',
                    possui_entrada: false,
                    possui_troca: false,
                    veiculo_troca: '',
                    user_id: user?.id
                }));

                const { error } = await supabase.from('leads').insert(leadsToInsert);
                if (error) throw error;

                onSuccess();
                onClose();
                showToast('success', `${toImport.length} leads importados com sucesso!`);
            } catch (err: any) {
                console.error("Error importing leads:", err);
                const msg = err?.message || '';
                showToast('error', `Erro ao importar leads. ${msg}`);
            } finally {
                setLoading(false);
                setStep('upload');
            }
        }
    };

    const toggleSelection = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const toggleAll = () => {
        if (selectedIds.size === importedLeads.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(importedLeads.map(l => l.importId)));
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">

                {/* Header */}
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-3">
                            <Database className="text-emerald-500" />
                            Importação de Leads
                        </h2>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">
                            {step === 'upload' && 'Carregue sua lista de contatos'}
                            {step === 'preview_leads' && 'Revise os contatos encontrados'}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-all">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 bg-white min-h-[400px]">

                    {step === 'upload' && (
                        <div className="h-full flex flex-col items-center justify-center gap-8">
                            <div className="text-center space-y-2">
                                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-4">
                                    <FileSpreadsheet size={40} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">Faça o upload da sua planilha</h3>
                                <p className="text-slate-400 max-w-md mx-auto">
                                    Utilize nosso modelo padrão para importar nomes, telefones e interesses.
                                </p>
                                <button onClick={downloadTemplate} className="text-sm font-bold text-emerald-600 hover:underline">
                                    Baixar modelo (.xlsx)
                                </button>
                            </div>

                            <label className="cursor-pointer group">
                                <div className="px-10 py-16 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 group-hover:bg-emerald-50/30 group-hover:border-emerald-300 transition-all text-center">
                                    {loading ? (
                                        <span className="text-slate-400 font-bold animate-pulse">Processando arquivo...</span>
                                    ) : (
                                        <>
                                            <Upload className="mx-auto text-slate-300 group-hover:text-emerald-500 mb-4 transition-colors" size={32} />
                                            <span className="block text-slate-500 font-bold uppercase text-sm group-hover:text-emerald-700">Clique para selecionar arquivo</span>
                                        </>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx, .xls"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={loading}
                                />
                            </label>
                        </div>
                    )}

                    {step === 'preview_leads' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle size={20} className="text-emerald-500" />
                                        <span className="font-bold text-slate-700">{importedLeads.filter(l => l.status === 'new').length} Novos</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle size={20} className="text-amber-500" />
                                        <span className="font-bold text-slate-400">{importedLeads.filter(l => l.status === 'duplicate').length} Duplicados</span>
                                    </div>
                                </div>
                                <button
                                    onClick={toggleAll}
                                    className="text-xs font-bold text-emerald-600 hover:underline uppercase"
                                >
                                    {selectedIds.size === importedLeads.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                                </button>
                            </div>

                            <div className="space-y-3">
                                {importedLeads.map(lead => (
                                    <div key={lead.importId} className={`p-4 rounded-xl border flex items-center justify-between transition-all ${selectedIds.has(lead.importId) ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100 opacity-60'}`}>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(lead.importId)}
                                                onChange={() => toggleSelection(lead.importId)}
                                                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-slate-800">{lead.name}</p>
                                                    {lead.status === 'duplicate' && (
                                                        <span className="px-2 py-0.5 bg-amber-100 text-amber-600 text-[10px] font-bold rounded uppercase">Duplicado</span>
                                                    )}
                                                </div>
                                                <div className="flex gap-3 text-xs text-slate-500 font-medium mt-1">
                                                    <span className="flex items-center gap-1"><Check size={12} /> {lead.phone}</span>
                                                    {lead.interestBrand && <span>• {lead.interestBrand} {lead.interestModel}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${lead.temperature === 'Quente' ? 'text-red-500 bg-red-50 border-red-100' : 'text-blue-500 bg-blue-50 border-blue-100'}`}>
                                                {lead.temperature}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    {step === 'upload' && (
                        <button onClick={onClose} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-200 rounded-xl transition-colors">
                            Cancelar
                        </button>
                    )}

                    {step === 'preview_leads' && (
                        <>
                            <button onClick={() => setStep('upload')} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-200 rounded-xl transition-colors">
                                Voltar
                            </button>
                            <button onClick={handleImport} disabled={loading || selectedIds.size === 0} className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-900/10 transition-all disabled:opacity-50">
                                {loading ? 'Importando...' : `Importar ${selectedIds.size} Leads`}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
