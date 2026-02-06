'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';

type ToastVariant = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.length > 0 && (
        <div className="admin-toast-container">
          {toasts.map((t) => (
            <div key={t.id} className={`admin-toast admin-toast-${t.variant}`}>
              <span className="admin-toast-icon">
                {t.variant === 'success' && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.3 4.3L6.5 11.1 2.7 7.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                )}
                {t.variant === 'error' && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                )}
                {t.variant === 'info' && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M8 7v4M8 5.5v0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                )}
              </span>
              <span className="admin-toast-message">{t.message}</span>
              <button className="admin-toast-close" onClick={() => dismiss(t.id)}>&times;</button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}
