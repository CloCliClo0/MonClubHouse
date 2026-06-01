import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  action?: React.ReactNode;
  padding?: number | string;
}

export const Card: React.FC<CardProps> = ({ title, action, padding = 24, children, style, ...rest }) => (
  <div style={{
    background: '#fff', borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)', padding,
    ...style
  }} {...rest}>
    {(title || action) && (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        {title && <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{title}</h3>}
        {action}
      </div>
    )}
    {children}
  </div>
);

interface StatCardProps {
  label: string;
  value: number | string;
  icon: string;
  color?: 'green' | 'blue' | 'orange' | 'red';
}

const colorMap = {
  green:  { bg: '#d8f3dc', color: 'var(--primary)' },
  blue:   { bg: '#dbeafe', color: '#3b82f6' },
  orange: { bg: '#ffedd5', color: '#f97316' },
  red:    { bg: '#fee2e2', color: 'var(--danger)' }
};

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color = 'green' }) => {
  const c = colorMap[color];
  return (
    <div style={{
      background: '#fff', borderRadius: 'var(--radius)', padding: '20px 24px',
      boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', gap: 16
    }}>
      <div style={{
        width: 50, height: 50, borderRadius: 'var(--radius-sm)',
        background: c.bg, color: c.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.4rem', flexShrink: 0
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '1.8rem', fontWeight: 800, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '.8rem', color: 'var(--grey-400)', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
};
