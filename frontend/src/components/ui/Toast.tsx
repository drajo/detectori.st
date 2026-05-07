import React from 'react';
import type { Toast as ToastItem, ToastType } from './useToast';

interface ToastProps {
  toasts: ToastItem[];
  onHide: (id: string) => void;
}

const typeClasses: Record<ToastType, string> = {
  success: 'bg-explorer-success text-white',
  error: 'bg-explorer-danger text-white',
  info: 'bg-explorer-accent text-white',
};

const typeIcons: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

export const Toast: React.FC<ToastProps> = ({ toasts, onHide }) => {
  if (toasts.length === 0) return null;

  return (
    <div aria-live="polite" aria-atomic="false" className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className={[
            'flex items-center gap-3 rounded-xl px-4 py-3 shadow-explorer',
            'min-w-[280px] max-w-sm border border-white/10',
            typeClasses[toast.type],
          ].join(' ')}
        >
          <span className="text-sm font-bold">{typeIcons[toast.type]}</span>
          <p className="flex-1 text-sm">{toast.message}</p>
          <button
            type="button"
            onClick={() => onHide(toast.id)}
            aria-label="Dismiss"
            className="ml-2 opacity-70 hover:opacity-100 transition-opacity focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};
