/**
 * Modal.tsx — Universal Portal Modal
 *
 * Renders its children into document.body via createPortal, bypassing any
 * ancestor overflow:hidden, transform, or animation stacking context that
 * would break position:fixed children rendered inside the component tree.
 *
 * Usage:
 *   <Modal isOpen={open} onClose={() => setOpen(false)} title="Título">
 *     ...content...
 *   </Modal>
 */
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    subtitle?: string;
    /** Max width class, default: 'max-w-2xl' */
    maxWidth?: string;
    children: React.ReactNode;
    /** Extra class for the inner white card */
    className?: string;
    /** If true, clicking the backdrop closes the modal */
    closeOnBackdrop?: boolean;
    /** Footer content rendered outside the scrollable area */
    footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    subtitle,
    maxWidth = 'max-w-2xl',
    children,
    className = '',
    closeOnBackdrop = true,
    footer,
}) => {
    const panelRef = useRef<HTMLDivElement>(null);

    // Lock body scroll while open
    useEffect(() => {
        if (isOpen) {
            const orig = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = orig; };
        }
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
            style={{ fontFamily: 'inherit' }}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fadeIn"
                onClick={closeOnBackdrop ? onClose : undefined}
            />

            {/* Panel */}
            <div
                ref={panelRef}
                className={`
                    relative z-10 w-full ${maxWidth} bg-white rounded-3xl shadow-2xl
                    flex flex-col max-h-[92vh] animate-scaleIn
                    ${className}
                `}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                {(title || subtitle) && (
                    <div className="flex-shrink-0 flex items-center justify-between px-8 py-6 border-b border-slate-100">
                        <div className="pr-4">
                            {title && (
                                typeof title === 'string'
                                    ? <h2 className="text-xl font-black text-slate-900 tracking-tight">{title}</h2>
                                    : title
                            )}
                            {subtitle && (
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">{subtitle}</p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    {children}
                </div>

                {/* Optional footer (stays fixed at bottom) */}
                {footer && (
                    <div className="flex-shrink-0 border-t border-slate-100 px-8 py-6">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default Modal;
