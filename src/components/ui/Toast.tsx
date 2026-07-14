import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, Bell, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    type: ToastType;
    message: string;
    onClose: () => void;
    duration?: number;
}

export default function Toast({ type, message, onClose, duration = 5000 }: ToastProps) {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                handleClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(onClose, 300);
    };

    const config = {
        success: {
            bg: 'bg-[#ECFDF5]',
            border: 'border-brand-200/50',
            text: 'text-brand-900',
            icon: <CheckCircle className="w-5 h-5 text-brand-500" />,
            accent: 'bg-brand-500',
            shadow: 'shadow-brand-100/50',
            label: 'Sucesso'
        },
        error: {
            bg: 'bg-[#FFF1F2]',
            border: 'border-red-200/50',
            text: 'text-red-900',
            icon: <AlertCircle className="w-5 h-5 text-red-500" />,
            accent: 'bg-red-500',
            shadow: 'shadow-red-100/50',
            label: 'Erro'
        },
        warning: {
            bg: 'bg-[#FFFBEB]',
            border: 'border-amber-200/50',
            text: 'text-amber-900',
            icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
            accent: 'bg-amber-500',
            shadow: 'shadow-amber-100/50',
            label: 'Atenção'
        },
        info: {
            bg: 'bg-[#F0F9FF]',
            border: 'border-sky-200/50',
            text: 'text-sky-900',
            icon: <Info className="w-5 h-5 text-sky-500" />,
            accent: 'bg-sky-500',
            shadow: 'shadow-sky-100/50',
            label: 'Informação'
        }
    };

    const current = config[type] || config.info;

    return (
        <div
            className={`fixed top-6 right-6 z-[99999] ${isExiting ? 'animate-toast-out' : 'animate-toast-in'
                }`}
        >
            <div className={`relative flex flex-col gap-0 overflow-hidden rounded-2xl border ${current.border} ${current.bg} ${current.shadow} shadow-2xl backdrop-blur-md min-w-[320px] max-w-sm group`}>
                {/* Progress bar accent */}
                <div className={`absolute top-0 left-0 h-1 transition-all duration-300 ${current.accent}`} style={{ width: '100%' }}></div>

                <div className="flex items-start gap-4 p-4 pr-10">
                    <div className={`flex-shrink-0 mt-0.5 p-2 rounded-xl bg-white/80 shadow-sm border border-white/50`}>
                        {current.icon}
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className={`text-[10px] font-black uppercase tracking-[0.15em] opacity-40`}>
                            {current.label}
                        </span>
                        <p className={`text-sm font-bold leading-relaxed tracking-tight ${current.text}`}>
                            {message}
                        </p>
                    </div>

                    <button
                        onClick={handleClose}
                        className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-black/5 text-slate-400 hover:text-slate-600 transition-all active:scale-90"
                    >
                        <X size={16} strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        </div>
    );
}
