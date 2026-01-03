'use client';

import { useEffect, useState } from 'react';

type ToastType = 'success' | 'info' | 'warning' | 'error';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

let toastListeners: Array<(toast: Toast) => void> = [];
let lastToastTime: { [key: string]: number } = {};
const TOAST_DEBOUNCE_MS = 2000; // Don't show same toast within 2 seconds

export function showToast(message: string, type: ToastType = 'info', duration: number = 3000) {
  // Debounce: Don't show the same message too frequently
  const key = `${message}-${type}`;
  const now = Date.now();
  if (lastToastTime[key] && now - lastToastTime[key] < TOAST_DEBOUNCE_MS) {
    return; // Skip duplicate toast
  }
  lastToastTime[key] = now;

  const toast: Toast = {
    id: `${Date.now()}-${Math.random()}`,
    message,
    type,
    duration,
  };
  toastListeners.forEach(listener => listener(toast));
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const MAX_TOASTS = 3; // Maximum number of toasts to show at once

  useEffect(() => {
    const listener = (toast: Toast) => {
      setToasts(prev => {
        // Limit the number of toasts
        const newToasts = [...prev, toast];
        if (newToasts.length > MAX_TOASTS) {
          return newToasts.slice(-MAX_TOASTS); // Keep only the latest ones
        }
        return newToasts;
      });
      if (toast.duration) {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toast.id));
        }, toast.duration);
      }
    };
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter(l => l !== listener);
    };
  }, []);

  const getToastStyle = (type: ToastType) => {
    switch (type) {
      case 'success':
        return { background: '#10b981', color: 'white' };
      case 'error':
        return { background: '#ef4444', color: 'white' };
      case 'warning':
        return { background: '#f59e0b', color: 'white' };
      default:
        return { background: '#2563eb', color: 'white' };
    }
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => {
        const style = getToastStyle(toast.type);
        return (
          <div
            key={toast.id}
            style={{
              background: style.background,
              color: style.color,
              padding: '12px 20px',
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              minWidth: 300,
              maxWidth: 500,
              animation: 'slideIn 0.3s ease-out',
              pointerEvents: 'auto',
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 700 }}>{getIcon(toast.type)}</span>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{toast.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                borderRadius: 4,
                width: 24,
                height: 24,
                cursor: 'pointer',
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>
          </div>
        );
      })}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

