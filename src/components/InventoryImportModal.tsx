import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, AlertTriangle, Check, CheckCircle, Database } from 'lucide-react';
import ExcelJS from 'exceljs';
import { supabase } from '../lib/supabaseClient';
import { vehicleService } from '../services/vehicleService';
import { Vehicle, Lead, SaleDetails, LeadPhase, LeadTemperature } from '../types';
import { carDatabase } from '../data/carDb';
import { motoDatabase } from '../data/motoDb';
import { useToast } from '../contexts/ToastContext';
import { useData } from '../contexts/DataContext';
import { CustomDatePicker } from './ui/CustomDatePicker';
import { formatCurrency, parseCurrency } from '../utils/formatters';


interface InventoryImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    currentVehicles: Vehicle[];
    leads: Lead[];
    onSellVehicle: (id: string, details: SaleDetails) => void;
}

type Step = 'upload' | 'new_vehicles' | 'existing_vehicles' | 'missing_vehicles';

interface ImportedVehicle extends Omit<Vehicle, 'id'> {
    importId: string; // Temporary ID for tracking
}

// Helper: Parse adaptive year formats (e.g., "22/23", "2022/23", "2022/2023", "2022")
const parseYears = (yearStr: string | number): { year: number, modelYear: number } => {
    const currentYear = new Date().getFullYear();
    if (!yearStr) return { year: currentYear, modelYear: currentYear };

    const s = String(yearStr).trim();

    // Handle simple 4 digit year
    if (/^\d{4}$/.test(s)) {
        const y = parseInt(s);
        return { year: y, modelYear: y };
    }

    // Handle separators /, -, or space
    const parts = s.split(/[\/\-\s]+/);
    if (parts.length >= 2) {
        let y1 = parseInt(parts[0]);
        let y2 = parseInt(parts[1]);

        // Handle 2-digit years -> 20xx
        if (y1 < 100) y1 += 2000;
        if (y2 < 100) y2 += 2000;

        return { year: y1, modelYear: y2 };
    }

    // Default fallback
    const parsed = parseInt(s);
    if (!parsed || isNaN(parsed)) return { year: currentYear, modelYear: currentYear };

    return { year: parsed, modelYear: parsed };
};

// Helper: Infer Brand from Model
const inferBrand = (model: string, enableCars: boolean, enableMotos: boolean): string => {
    if (!model) return '';
    const modelLower = model.toLowerCase();

    if (enableCars) {
        for (const [brand, models] of Object.entries(carDatabase)) {
            if (models.some(m => modelLower.includes(m.toLowerCase()) || m.toLowerCase().includes(modelLower))) {
                return brand;
            }
        }
    }

    if (enableMotos) {
        for (const [brand, models] of Object.entries(motoDatabase)) {
            if (models.some(m => modelLower.includes(m.name.toLowerCase()) || m.name.toLowerCase().includes(modelLower))) {
                return brand;
            }
        }
    }
    return '';
};

// Helper: Infer Type from Model (Heuristic)
const inferType = (model: string, enableCars: boolean, enableMotos: boolean): string => {
    if (!model) return 'Em aberto';
    const m = model.toLowerCase();

    if (enableCars) {
        if (m.includes('cross') || m.includes('suv') || m.includes('jeep') || m.includes('tracker') || m.includes('hr-v') || m.includes('creta') || m.includes('kicks')) return 'SUV';
        if (m.includes('sedan') || m.includes('plus') || m.includes('virtus') || m.includes('corolla') || m.includes('civic') || m.includes('hb20s')) return 'Sedan';
        if (m.includes('hatch') || m.includes('hb20') || m.includes('onix') || m.includes('gol') || m.includes('polo') || m.includes('arg') || m.includes('mobi')) return 'Hatch';
        if (m.includes('picape') || m.includes('strada') || m.includes('toro') || m.includes('hilux') || m.includes('s10') || m.includes('ranger') || m.includes('montana')) return 'Picape';
        if (m.includes('van') || m.includes('spin') || m.includes('doblo')) return 'Van';
    }

    if (enableMotos) {
        if (m.includes('scooter') || m.includes('biz') || m.includes('pcx') || m.includes('nmax')) return 'Scooter';
        if (m.includes('sport') || m.includes('ninja') || m.includes('cbr') || m.includes('yzf')) return 'Sport';
        if (m.includes('naked') || m.includes('cb ') || m.includes('mt-') || m.includes('z ')) return 'Naked';
        if (m.includes('trail') || m.includes('bros') || m.includes('xre') || m.includes('tenere')) return 'Trail';
        if (m.includes('custom') || m.includes('chopper') || m.includes('vulcan') || m.includes('fat boy')) return 'Custom';
        if (m.includes('street') || m.includes('cg ') || m.includes('ybr') || m.includes('fazer')) return 'Street';
    }

    return 'Em aberto'; // Default
};

export default function InventoryImportModal({ isOpen, onClose, onSuccess, currentVehicles, leads, onSellVehicle }: InventoryImportModalProps) {
    const { showToast } = useToast();
    const { profile } = useData();
    const [step, setStep] = useState<Step>('upload');
    const [importedVehicles, setImportedVehicles] = useState<ImportedVehicle[]>([]);

    // Categorized vehicles
    const [newVehicles, setNewVehicles] = useState<ImportedVehicle[]>([]);
    const [existingVehicles, setExistingVehicles] = useState<ImportedVehicle[]>([]);
    const [missingVehicles, setMissingVehicles] = useState<Vehicle[]>([]);

    // Selection states
    const [selectedNewIds, setSelectedNewIds] = useState<Set<string>>(new Set());
    const [selectedMissingIds, setSelectedMissingIds] = useState<Set<string>>(new Set());

    // Sales config for missing vehicles
    const [salesConfig, setSalesConfig] = useState<Record<string, { leadId: string; price: number; date: string }>>({});

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const downloadTemplate = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Modelo Importação");

        // Headers
        worksheet.columns = [
            { header: 'Marca', key: 'Marca', width: 15 },
            { header: 'Modelo', key: 'Modelo', width: 20 },
            { header: 'Ano Fab.', key: 'Ano Fab.', width: 10 },
            { header: 'Ano Mod.', key: 'Ano Mod.', width: 10 },
            { header: 'Placa', key: 'Placa', width: 12 },
            { header: 'Preço', key: 'Preço', width: 15 },
            { header: 'Tipo', key: 'Tipo', width: 15 },
            { header: 'Câmbio', key: 'Câmbio', width: 15 },
            { header: 'Motor', key: 'Motor', width: 10 },
            { header: 'Quilometragem', key: 'Quilometragem', width: 15 },
            { header: 'Cor', key: 'Cor', width: 15 },
            { header: 'Opcionais', key: 'Opcionais', width: 30 }
        ];

        // write file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = "modelo_estoque.xlsx";
        anchor.click();
        window.URL.revokeObjectURL(url);
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
                headers[colNumber] = cell.value?.toString().trim() || '';
            });

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // Skip header

                const rowData: any = {};
                row.eachCell((cell, colNumber) => {
                    const header = headers[colNumber];
                    if (header) {
                        let val = cell.value;
                        if (val && typeof val === 'object') {
                            if ('text' in val) val = (val as any).text;
                            else if ('result' in val) val = (val as any).result;
                        }
                        rowData[header] = val;
                    }
                });
                data.push(rowData);
            });

            // Process data
            const processed: ImportedVehicle[] = data.map((row, index) => {
                // Adaptive Year Parsing
                const rawYear = row['Ano'] || row['Ano Fab.'] || row['Ano/Modelo'] || '';
                const { year, modelYear } = parseYears(rawYear);

                // If explicit 'Ano Mod.' exists, override
                const explicitModelYear = row['Ano Mod.'] || row['Modelo Ano'];
                const finalModelYear = explicitModelYear ? (parseInt(explicitModelYear) < 100 ? parseInt(explicitModelYear) + 2000 : parseInt(explicitModelYear)) : modelYear;

                // Brand Inference
                let brand = row['Marca'];
                const model = row['Modelo'] || '';
                if (!brand && model) {
                    brand = inferBrand(model, profile?.enable_cars !== false, !!profile?.enable_motorcycles);
                }

                // Type Inference
                let type = row['Tipo'];
                if (!type && model) {
                    type = inferType(model, profile?.enable_cars !== false, !!profile?.enable_motorcycles);
                }

                return {
                    importId: `imp-${index}`,
                    brand: brand || '',
                    model: model,
                    year: year,
                    modelYear: finalModelYear,
                    plate: (row['Placa'] || '').toUpperCase().replace(/[^A-Z0-9]/g, ''),
                    price: parseFloat(row['Preço']) || 0,
                    type: type || 'Em aberto',
                    transmission: row['Câmbio'] || 'Em aberto',
                    engine: row['Motor'] || 'Em aberto',
                    mileage: parseInt(row['Quilometragem']) || 0,
                    color: row['Cor'] || '',
                    isSingleOwner: false,
                    isServiceHistoryComplete: false,
                    isIpvaPaid: true,
                    hasWarranty: false,
                    optionals: (row['Opcionais'] || '').split(/[,;\/-]+/).map((s: string) => s.trim()).filter(Boolean),
                    imageUrl: '',
                    status: 'available'
                };
            });

            // Compare with current Inventory
            const newV: ImportedVehicle[] = [];
            const existingV: ImportedVehicle[] = [];

            // Use existing vehicle items for comparison map
            // Assuming PLATES are unique identifiers. If plate is missing in import or DB, we might have dupes.
            // Ideally we need plates.

            // Create a map of current DB vehicles by Plate
            const dbMap = new Map();
            currentVehicles.forEach(v => {
                if (v.plate && v.status === 'available') dbMap.set(v.plate.replace(/[^A-Z0-9]/g, ''), v);
            });

            processed.forEach(imp => {
                if (imp.plate && dbMap.has(imp.plate)) {
                    existingV.push(imp);
                    // Remove from map to see what is missing later
                    dbMap.delete(imp.plate);
                } else {
                    newV.push(imp);
                }
            });

            // Whatever remains in dbMap are "Missing" (potentially sold)
            const missing = Array.from(dbMap.values());

            setImportedVehicles(processed);
            setNewVehicles(newV);
            setExistingVehicles(existingV);
            setMissingVehicles(missing);

            // Pre-select all new vehicles
            setSelectedNewIds(new Set(newV.map(v => v.importId)));

            setStep('new_vehicles');
        } catch (err) {
            console.error(err);
            showToast('error', "Erro ao processar arquivo. Verifique o formato.");
        } finally {
            setLoading(false);
        }
    };

    const handleImportNew = async () => {
        // Filter selected
        const toImport = newVehicles.filter(v => selectedNewIds.has(v.importId));

        if (toImport.length > 0) {
            setLoading(true);
            try {
                let successCount = 0;
                let failCount = 0;

                // Loop sequential to avoid overwhelming the RPC fallback mechanism if needed
                for (const v of toImport) {
                    try {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const { importId, ...vehicleData } = v;

                        // Ensure we pass only what vehicleService expects
                        await vehicleService.create({
                            ...vehicleData,
                            status: 'available'
                        });
                        successCount++;
                    } catch (innerErr) {
                        console.error(`Failed to import ${v.brand} ${v.model}:`, innerErr);
                        failCount++;
                    }
                }

                if (successCount === 0 && failCount > 0) {
                    throw new Error("Falha ao importar todos os veículos selecionados. Verifique o console.");
                }

                showToast(
                    failCount > 0 ? 'error' : 'success',
                    `${successCount} importados com suceso.${failCount > 0 ? ` ${failCount} falhas.` : ''}`
                );

            } catch (err: any) {
                console.error("Error importing new:", err);
                const msg = err?.message || err?.details || JSON.stringify(err) || "Erro desconhecido";
                showToast('error', `Erro ao importar: ${msg}`);
                // Don't close/reset on error, let user retry
                setLoading(false);
                return;
            }
            setLoading(false);
        }

        // Next step
        setStep('existing_vehicles');
    };

    const handleExistingNext = () => {
        // We are currently doing nothing with existing vehicles (Default: do not update)
        // If we wanted to update, we'd add logic here.
        setStep('missing_vehicles');
    };

    const handleProcessMissing = async () => {
        const toSell = missingVehicles.filter(v => selectedMissingIds.has(v.id));

        if (toSell.length > 0) {
            setLoading(true);
            try {
                // Determine missing data for auto-sales if user didn't config
                // Or force them? The prompt says "Opção para selecionar um lead".

                for (const v of toSell) {
                    const config = salesConfig[v.id];
                    let details: SaleDetails = {
                        salePrice: v.price,
                        saleDate: new Date().toISOString().split('T')[0],
                        buyerName: 'Não Informado',
                        isFollowUpSale: false
                    };

                    if (config?.leadId) {
                        const lead = leads.find(l => l.id === config.leadId);
                        if (lead) {
                            details.buyerName = lead.name;
                            details.buyerLeadId = lead.id;
                            details.salePrice = config.price || v.price;
                            details.saleDate = config.date || details.saleDate;
                        }
                    }

                    // Call the parent handler or supabase directly
                    // Parent handler onSellVehicle handles local state update + specific logic
                    // But doing it explicitly here might be safer for bulk operations or we call the prop?
                    // The prop onSellVehicle updates the DB. Let's assume it's async but currently typed purely void? 
                    // Let's check Inventory.tsx... it calls `onSellVehicle` which calls Supabase. 
                    // Actually Inventory.tsx `onSellVehicle` prop comes from `App.tsx` or `UserApp.tsx`.
                    // Let's look at `UserApp.tsx`? We don't have visibility, but usually it updates state.
                    // To be safe and atomic, we should do DB calls here and then reload/trigger success.

                    await supabase.from('vehicles').update({
                        status: 'sold',
                        sale_details: details
                    }).eq('id', v.id);

                    // Also if we have a lead ID, update lead status?
                    if (details.buyerLeadId) {
                        await supabase.from('leads').update({ phase: LeadPhase.COMPLETED }).eq('id', details.buyerLeadId);
                    }
                }

            } catch (err) {
                console.error(err);
                showToast('error', "Erro ao processar vendas.");
            } finally {
                setLoading(false);
            }
        }

        onSuccess();
        onClose();
        // Reset
        setStep('upload');
    };

    const toggleNewSelection = (id: string) => {
        const next = new Set(selectedNewIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedNewIds(next);
    };

    const toggleMissingSelection = (id: string) => {
        const next = new Set(selectedMissingIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedMissingIds(next);
    };

    const updateSalesConfig = (vId: string, field: string, val: any) => {
        setSalesConfig(prev => ({
            ...prev,
            [vId]: { ...prev[vId], [field]: val }
        }));
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">

                {/* Header */}
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-3">
                            <Database className="text-emerald-500" />
                            Importação de Estoque
                        </h2>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">
                            {step === 'upload' && 'Carregue sua planilha para começar'}
                            {step === 'new_vehicles' && 'Veículos novos encontrados'}
                            {step === 'existing_vehicles' && 'Veículos já cadastrados'}
                            {step === 'missing_vehicles' && 'Veículos não encontrados (Prováveis vendas)'}
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
                                    Para garantir a importação correta, utilize nosso modelo padrão.
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

                    {step === 'new_vehicles' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckCircle size={20} className="text-emerald-500" />
                                    <span className="font-bold text-slate-700">{newVehicles.length} Novos Veículos Detectados</span>
                                </div>
                                <button
                                    onClick={() => setSelectedNewIds(selectedNewIds.size === newVehicles.length ? new Set() : new Set(newVehicles.map(v => v.importId)))}
                                    className="text-xs font-bold text-emerald-600 hover:underline uppercase"
                                >
                                    {selectedNewIds.size === newVehicles.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                                </button>
                            </div>

                            <div className="space-y-3">
                                {newVehicles.map(v => (
                                    <div key={v.importId} className={`p-4 rounded-xl border flex items-center justify-between transition-all ${selectedNewIds.has(v.importId) ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100 opacity-60'}`}>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedNewIds.has(v.importId)}
                                                onChange={() => toggleNewSelection(v.importId)}
                                                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <div>
                                                <p className="font-bold text-slate-800">{v.brand} {v.model}</p>
                                                <div className="flex gap-3 text-xs text-slate-500 font-medium">
                                                    <span>{v.year}</span>
                                                    <span>{v.plate}</span>
                                                    <span className="text-emerald-600">R$ {formatCurrency(v.price)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="px-3 py-1 bg-white text-emerald-600 text-[10px] font-bold uppercase rounded border border-emerald-100">
                                            Importar
                                        </div>
                                    </div>
                                ))}
                                {newVehicles.length === 0 && <p className="text-center text-slate-400 py-10">Nenhum veículo novo encontrado na planilha.</p>}
                            </div>
                        </div>
                    )}

                    {step === 'existing_vehicles' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-4 bg-amber-50 p-4 rounded-xl border border-amber-100 text-amber-800">
                                <AlertTriangle size={20} />
                                <p className="text-sm font-medium">Estes veículos já existem no banco de dados e <strong>não serão atualizados</strong> para preservar o histórico.</p>
                            </div>

                            <div className="space-y-3">
                                {existingVehicles.map(v => (
                                    <div key={v.importId} className="p-4 rounded-xl border border-slate-100 bg-slate-50 opacity-70 flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-slate-700">{v.brand} {v.model}</p>
                                            <div className="flex gap-3 text-xs text-slate-500 font-medium">
                                                <span>{v.year}</span>
                                                <span>{v.plate}</span>
                                            </div>
                                        </div>
                                        <div className="px-3 py-1 bg-slate-200 text-slate-500 text-[10px] font-bold uppercase rounded">
                                            Ignorado
                                        </div>
                                    </div>
                                ))}
                                {existingVehicles.length === 0 && <p className="text-center text-slate-400 py-10">Nenhum veículo duplicado encontrado.</p>}
                            </div>
                        </div>
                    )}

                    {step === 'missing_vehicles' && (
                        <div className="space-y-6">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <p className="text-sm text-slate-600 mb-2">
                                    Os veículos abaixo existem no sistema mas <strong>não estão na planilha</strong>.
                                    Isso geralmente indica que foram vendidos.
                                </p>
                                <p className="text-xs text-slate-400">
                                    Selecione os veículos para marcar como vendidos e vincular a um comprador.
                                </p>
                            </div>

                            <div className="space-y-4">
                                {missingVehicles.map(v => {
                                    const isSelected = selectedMissingIds.has(v.id);
                                    return (
                                        <div key={v.id} className={`p-4 rounded-xl border transition-all ${isSelected ? 'bg-white border-slate-300 shadow-md' : 'bg-slate-50 border-slate-100'}`}>
                                            <div className="flex items-start gap-4 mb-4">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleMissingSelection(v.id)}
                                                    className="mt-1 w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex justify-between">
                                                        <div>
                                                            <p className="font-bold text-slate-800">{v.brand} {v.model}</p>
                                                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{v.plate}</span>
                                                        </div>
                                                        <p className="font-bold text-emerald-600">R$ {formatCurrency(v.price)}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {isSelected && (
                                                <div className="ml-9 pl-4 border-l-2 border-slate-100 space-y-3 animate-fadeDown">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Comprador (Lead)</label>
                                                        <select
                                                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                                            value={salesConfig[v.id]?.leadId || ''}
                                                            onChange={e => updateSalesConfig(v.id, 'leadId', e.target.value)}
                                                        >
                                                            <option value="">Selecione um Lead (Opcional)</option>
                                                            {leads.filter(l => l.phase !== LeadPhase.COMPLETED).map(l => (
                                                                <option key={l.id} value={l.id}>{l.name} - {l.phone}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Data Venda</label>
                                                            <CustomDatePicker
                                                                value={salesConfig[v.id]?.date || new Date().toISOString().split('T')[0]}
                                                                onChange={(date) => updateSalesConfig(v.id, 'date', date)}
                                                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Valor Final</label>
                                                            <input
                                                                type="text"
                                                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                                                value={formatCurrency(salesConfig[v.id]?.price || v.price)}
                                                                onChange={e => updateSalesConfig(v.id, 'price', parseCurrency(e.target.value))}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                                {missingVehicles.length === 0 && <p className="text-center text-slate-400 py-10">Nenhuma divergência encontrada.</p>}
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

                    {step === 'new_vehicles' && (
                        <>
                            <button onClick={() => setStep('upload')} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-200 rounded-xl transition-colors">
                                Voltar
                            </button>
                            <button onClick={handleImportNew} disabled={loading} className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-900/10 transition-all disabled:opacity-50">
                                {loading ? 'Importando...' : `Importar ${selectedNewIds.size} Veículos`}
                            </button>
                        </>
                    )}

                    {step === 'existing_vehicles' && (
                        <>
                            <button onClick={handleExistingNext} className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-900/10 transition-all">
                                Próximo: Validar Vendidos
                            </button>
                        </>
                    )}

                    {step === 'missing_vehicles' && (
                        <>
                            <button onClick={handleProcessMissing} disabled={loading} className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all">
                                {loading ? 'Processando...' : 'Finalizar Importação'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
