import React, { useState, useEffect } from 'react';
import { GuaranteeConfig } from '../../types';
import { guaranteeService } from '../../services/guaranteeService';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';

interface GuaranteeSettingsProps {
  onSave?: () => void;
}

const GuaranteeSettings: React.FC<GuaranteeSettingsProps> = ({ onSave }) => {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<GuaranteeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<GuaranteeConfig>>({});
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadConfigs();
  }, [user?.id]);

  const loadConfigs = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await guaranteeService.getGuaranteeConfigs(user.id);
      setConfigs(data);
    } catch (err) {
      setError('Erro ao carregar garantias');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (config: GuaranteeConfig) => {
    setEditing(config.id);
    setFormData(config);
    setError(null);
  };

  const handleSave = async () => {
    if (!formData.id || !formData.name || !formData.days_warranty) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      await guaranteeService.updateGuaranteeConfig(formData.id, formData);
      setSuccessMessage('Garantia atualizada com sucesso!');
      setEditing(null);
      loadConfigs();
      setTimeout(() => setSuccessMessage(null), 3000);
      onSave?.();
    } catch (err) {
      setError('Erro ao salvar garantia');
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover esta garantia?')) return;

    try {
      await guaranteeService.deleteGuaranteeConfig(id);
      setSuccessMessage('Garantia removida com sucesso!');
      loadConfigs();
      setTimeout(() => setSuccessMessage(null), 3000);
      onSave?.();
    } catch (err) {
      setError('Erro ao remover garantia');
      console.error(err);
    }
  };

  const handleAddPredefined = async (predefined: Partial<GuaranteeConfig>) => {
    if (!user?.id) return;

    try {
      await guaranteeService.createGuaranteeConfig(user.id, {
        type: predefined.type as any,
        name: predefined.name || '',
        days_warranty: predefined.days_warranty || 0,
        description: predefined.description,
        conditions: predefined.conditions,
      });
      setSuccessMessage('Garantia adicionada com sucesso!');
      loadConfigs();
      setTimeout(() => setSuccessMessage(null), 3000);
      onSave?.();
    } catch (err) {
      // Pode ser erro de tipo duplicado (UNIQUE constraint)
      setError('Esta garantia já está configurada. Edite a existente.');
      setTimeout(() => setError(null), 4000);
      console.error(err);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Carregando garantias...</div>;
  }

  const predefinedOptions = guaranteeService.getPredefinedConfigs();
  const existingTypes = new Set(configs.map(c => c.type));

  return (
    <div className="space-y-6">
      {/* Mensagens */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
          {successMessage}
        </div>
      )}

      {/* Lista de Garantias Configuradas */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-slate-800">Garantias Configuradas</h3>
        {configs.length === 0 ? (
          <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 text-center">
            <p className="text-slate-500 text-sm">Nenhuma garantia configurada ainda.</p>
            <p className="text-slate-400 text-xs mt-1">Adicione uma opção pré-definida abaixo.</p>
          </div>
        ) : (
          configs.map((config) => (
            <div key={config.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              {editing === config.id ? (
                <>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs uppercase font-bold text-slate-500">Nome</label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase font-bold text-slate-500">Dias de Garantia</label>
                      <input
                        type="number"
                        value={formData.days_warranty || 0}
                        onChange={(e) => setFormData({ ...formData, days_warranty: parseInt(e.target.value) })}
                        className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase font-bold text-slate-500">Descrição</label>
                      <textarea
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={2}
                        className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-3 justify-end">
                    <button
                      onClick={() => setEditing(null)}
                      className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 text-xs font-bold transition-colors flex items-center gap-2"
                    >
                      <X size={14} /> Cancelar
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 text-xs font-bold transition-colors flex items-center gap-2"
                    >
                      <Check size={14} /> Salvar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-black text-slate-800">{config.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">{config.days_warranty} dias</p>
                      {config.description && (
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{config.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(config)}
                        className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(config.id)}
                        className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                        title="Remover"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Adicionar Pré-Definidas */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-slate-800">Adicionar Garantia Padrão</h3>
        <div className="space-y-2">
          {predefinedOptions.map((option) => (
            <button
              key={option.type}
              onClick={() => handleAddPredefined(option)}
              disabled={existingTypes.has(option.type as any)}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                existingTypes.has(option.type as any)
                  ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-50'
                  : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-800">{option.name}</h4>
                  {option.description && (
                    <p className="text-xs text-slate-600 mt-1">{option.description}</p>
                  )}
                </div>
                <Plus size={18} className={existingTypes.has(option.type as any) ? 'text-slate-300' : 'text-blue-600'} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GuaranteeSettings;
