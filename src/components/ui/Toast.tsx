import React, { createContext, useCallback, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

type ToastTone = 'success' | 'warning' | 'danger' | 'info';

interface ToastItem {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
}

interface ToastContextType {
  show: (toast: Omit<ToastItem, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const toneConfig: Record<ToastTone, { color: string; icon: React.ReactNode }> = {
  success: { color: 'var(--success-9)', icon: <CheckCircle2 size={18} /> },
  warning: { color: 'var(--warning-9)', icon: <AlertTriangle size={18} /> },
  danger: { color: 'var(--danger-9)', icon: <XCircle size={18} /> },
  info: { color: 'var(--info-9)', icon: <Info size={18} /> },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const show = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => dismiss(id), 5000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: 'var(--space-6)',
            right: 'var(--space-6)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
            zIndex: 2000,
            maxWidth: 380,
          }}
        >
          {toasts.map(t => {
            const cfg = toneConfig[t.tone];
            return (
              <div
                key={t.id}
                role="status"
                style={{
                  display: 'flex',
                  gap: 'var(--space-3)',
                  alignItems: 'flex-start',
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border-default)',
                  borderLeft: `3px solid ${cfg.color}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-4)',
                  boxShadow: 'var(--shadow-lg)',
                  animation: 'slideUp var(--duration-base) var(--ease-out)',
                }}
              >
                <span style={{ color: cfg.color, flexShrink: 0, marginTop: 1 }}>{cfg.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{t.title}</div>
                  {t.description && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 2 }}>{t.description}</div>}
                </div>
                <button
                  aria-label="Dismiss notification"
                  onClick={() => dismiss(t.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 2, flexShrink: 0 }}
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components -- standard context-module pattern: provider + its hook live together
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (ctx === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};
