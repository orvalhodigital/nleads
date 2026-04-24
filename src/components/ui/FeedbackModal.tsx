import React from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

interface FeedbackModalProps {
    isOpen: boolean;
    type: 'success' | 'error' | 'confirm';
    title: string;
    message: string;
    onClose: () => void;
    onConfirm?: () => void;
}

export default function FeedbackModal({ isOpen, type, title, message, onClose, onConfirm }: FeedbackModalProps) {
    if (!isOpen) return null;

    const isConfirm = type === 'confirm';

    return (
        <div className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-scaleUp">
                {/* Header Color Bar */}
                <div className={`h-2 w-full ${type === 'success' ? 'bg-emerald-500' :
                        type === 'error' ? 'bg-red-500' :
                            'bg-slate-900'
                    }`} />

                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-full ${type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                                type === 'error' ? 'bg-red-100 text-red-600' :
                                    'bg-slate-100 text-slate-900'
                            }`}>
                            {type === 'success' && <CheckCircle size={24} />}
                            {type === 'error' && <AlertCircle size={24} />}
                            {type === 'confirm' && <AlertTriangle size={24} />}
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                        {title}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-6">
                        {message}
                    </p>

                    <div className="flex gap-3 justify-end">
                        {isConfirm ? (
                            <>
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className="px-4 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-lg shadow-slate-900/10"
                                >
                                    Confirmar
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={onClose}
                                className="w-full px-4 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                OK
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
