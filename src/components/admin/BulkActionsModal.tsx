import React, { useState } from 'react';
import { AlertCircle, Trash2, Edit3, X } from 'lucide-react';

interface BulkActionsModalProps {
  selectedCount: number;
  selectedIds: string[];
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => Promise<void>;
  onConfirmEdit?: (field: string, value: string) => Promise<void>;
  resourceType: 'user' | 'lead' | 'vehicle';
  isLoading?: boolean;
}

export function BulkActionsModal({
  selectedCount,
  selectedIds,
  isOpen,
  onClose,
  onConfirmDelete,
  onConfirmEdit,
  resourceType,
  isLoading = false,
}: BulkActionsModalProps) {
  const [actionType, setActionType] = useState<'delete' | 'edit'>('delete');
  const [editField, setEditField] = useState('');
  const [editValue, setEditValue] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      if (actionType === 'delete') {
        await onConfirmDelete();
      } else if (actionType === 'edit' && onConfirmEdit) {
        await onConfirmEdit(editField, editValue);
      }
      onClose();
    } finally {
      setIsConfirming(false);
    }
  };

  const getResourceLabel = () => {
    const labels = {
      user: 'usuários',
      lead: 'leads',
      vehicle: 'veículos',
    };
    return labels[resourceType];
  };

  const isDeleteAction = actionType === 'delete';
  const isEditAction = actionType === 'edit';
  const canConfirm = isDeleteAction || (isEditAction && editField && editValue);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 animate-fadeUp">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Ações em Massa</h3>
            <p className="text-slate-500 text-sm mt-1">
              {selectedCount} {getResourceLabel()} selecionado(s)
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        <div className="mb-6 flex gap-3 border-b border-slate-200">
          <button
            onClick={() => setActionType('delete')}
            className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors ${
              isDeleteAction
                ? 'text-red-600 border-red-600'
                : 'text-slate-500 border-transparent hover:text-slate-700'
            }`}
          >
            <Trash2 className="inline mr-2" size={16} />
            Deletar
          </button>
          {onConfirmEdit && (
            <button
              onClick={() => setActionType('edit')}
              className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                isEditAction
                  ? 'text-blue-600 border-blue-600'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
              }`}
            >
              <Edit3 className="inline mr-2" size={16} />
              Editar
            </button>
          )}
        </div>

        {isDeleteAction && (
          <div className="space-y-4 mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-red-900 text-sm">Aviso importante</p>
                <p className="text-red-700 text-sm mt-1">
                  Esta ação é <strong>irreversível</strong>. Todos os {getResourceLabel()} serão deletados permanentemente.
                </p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm font-medium text-slate-900 mb-2">IDs selecionados:</p>
              <div className="bg-white rounded border border-slate-200 p-3 max-h-32 overflow-y-auto">
                <ul className="space-y-1">
                  {selectedIds.slice(0, 5).map((id) => (
                    <li key={id} className="text-xs text-slate-600 font-mono">
                      {id}
                    </li>
                  ))}
                  {selectedIds.length > 5 && (
                    <li className="text-xs text-slate-500 italic">
                      +{selectedIds.length - 5} mais...
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {isEditAction && (
          <div className="space-y-4 mb-6">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase mb-2">Campo</label>
                <input
                  type="text"
                  placeholder="Ex: plan, status"
                  value={editField}
                  onChange={(e) => setEditField(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase mb-2">Novo valor</label>
                <input
                  type="text"
                  placeholder="Digite o novo valor"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                />
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>{selectedCount}</strong> {getResourceLabel()} será(ão) atualizado(s)
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isConfirming}
            className="px-6 py-3 text-slate-500 hover:text-black hover:bg-slate-100 rounded-xl transition-colors font-bold text-sm disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || isConfirming || isLoading}
            className={`px-6 py-3 text-white rounded-xl flex items-center gap-2 transition-colors shadow-lg font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
              isDeleteAction
                ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
            }`}
          >
            {isDeleteAction ? <Trash2 size={18} /> : <Edit3 size={18} />}
            {isConfirming ? 'Processando...' : isDeleteAction ? 'Deletar' : 'Editar'}
          </button>
        </div>
      </div>
    </div>
  );
}
