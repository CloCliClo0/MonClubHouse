import React from 'react';
import type { Toast, ToastType } from '@/hooks/useToast';

const typeStyle: Record<ToastType, React.CSSProperties> = {
  success: { background: 'var(--success)' },
  error:   { background: 'var(--danger)' },
  warning: { background: 'var(--warning)', color: 'var(--dark)' },
  info:    { background: 'var(--dark)' }
};

interface Props {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<Props> = ({ toasts, onDismiss }) => (
  <div style={{
    position: 'fixed', bottom: 24, right: 24,
    display: 'flex', flexDirection: 'column', gap: 10, zIndex: 2000
  }}>
    {toasts.map(t => (
      <div
        key={t.id}
        onClick={() => onDismiss(t.id)}
        style={{
          color: '#fff', padding: '12px 20px',
          borderRadius: 'var(--radius-sm)', fontSize: '.88rem',
          maxWidth: 320, boxShadow: 'var(--shadow-lg)',
          display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
          animation: 'slideIn .25s ease',
          ...typeStyle[t.type]
        }}
      >
        {t.message}
      </div>
    ))}
    <style>{`@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
  </div>
);
