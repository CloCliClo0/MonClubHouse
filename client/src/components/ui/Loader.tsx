import React from 'react';

export const Loader: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
    <div style={{
      width: size, height: size,
      border: '3px solid var(--grey-200)',
      borderTopColor: 'var(--primary)',
      borderRadius: '50%',
      animation: 'spin .7s linear infinite'
    }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

export const EmptyState: React.FC<{ title?: string; message?: string; icon?: string }> = ({
  title = 'Aucune donnée',
  message,
  icon = '📭'
}) => (
  <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--grey-400)' }}>
    <div style={{ fontSize: '3rem', marginBottom: 16, opacity: .5 }}>{icon}</div>
    <h3 style={{ color: 'var(--dark)', marginBottom: 6 }}>{title}</h3>
    {message && <p style={{ fontSize: '.9rem' }}>{message}</p>}
  </div>
);
