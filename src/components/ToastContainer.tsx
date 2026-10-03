import React from 'react';
import { useAppStore } from '../store';
import './ToastContainer.css';

export function ToastContainer() {
  const { toasts, removeToast } = useAppStore();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast-bubble toast-bubble--${t.type || 'info'} animate-toast`}>
          <span className="toast-text">{t.message}</span>
          <button
            className="toast-close-btn"
            onClick={() => removeToast(t.id)}
            aria-label="Dismiss notification"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
