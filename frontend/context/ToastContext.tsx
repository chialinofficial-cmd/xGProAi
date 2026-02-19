'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = (message: string, type: ToastType) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    };

    const removeToast = (id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto px-6 py-4 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border backdrop-blur-xl animate-in slide-in-from-right-full fade-in duration-300 flex items-center gap-4 min-w-[320px]
                            ${toast.type === 'success' ? 'bg-black/80 border-green-500/30 text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.1)]' :
                                toast.type === 'error' ? 'bg-black/80 border-red-500/30 text-red-400 shadow-[0_0_15px_rgba(248,113,113,0.1)]' :
                                    'bg-black/80 border-gold/30 text-gold shadow-[0_0_15px_rgba(212,175,55,0.1)]'}`}
                    >
                        <span className="text-xl">
                            {toast.type === 'success' ? '✓' : toast.type === 'error' ? '⚠' : 'ℹ'}
                        </span>
                        <p className="font-bold text-sm">{toast.message}</p>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="ml-auto hover:text-white transition-colors"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
