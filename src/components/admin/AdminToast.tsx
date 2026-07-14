import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface AdminToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

export function AdminToast({ toast, onClose }: AdminToastProps) {
  useEffect(() => {
    const duration = toast.duration || 3000;
    const timer = setTimeout(() => onClose(toast.id), duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  const bgColor = {
    success: 'bg-emerald-50 border-brand-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
  }[toast.type];

  const textColor = {
    success: 'text-emerald-800',
    error: 'text-red-800',
    info: 'text-blue-800',
  }[toast.type];

  const Icon = {
    success: CheckCircle2,
    error: AlertCircle,
    info: AlertCircle,
  }[toast.type];

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-4 ${bgColor} animate-slideIn`}
      role="alert"
    >
      <Icon className={textColor} size={20} />
      <p className={`flex-1 font-medium ${textColor}`}>{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className={`transition-colors hover:opacity-70`}
      >
        <X size={16} className={textColor} />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-sm">
      {toasts.map(toast => (
        <AdminToast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}
