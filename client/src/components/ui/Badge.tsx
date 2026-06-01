import React from 'react';

type Color = 'green' | 'blue' | 'red' | 'orange' | 'grey' | 'purple';

const colorMap: Record<Color, { bg: string; color: string }> = {
  green:  { bg: '#d1fae5', color: '#065f46' },
  blue:   { bg: '#dbeafe', color: '#1e40af' },
  red:    { bg: '#fee2e2', color: '#991b1b' },
  orange: { bg: '#ffedd5', color: '#9a3412' },
  grey:   { bg: 'var(--grey-100)', color: 'var(--grey-600)' },
  purple: { bg: '#ede9fe', color: '#6d28d9' }
};

interface Props {
  label: string;
  color?: Color;
}

export const Badge: React.FC<Props> = ({ label, color = 'grey' }) => {
  const c = colorMap[color];
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px',
      borderRadius: 99, fontSize: '.75rem', fontWeight: 700,
      background: c.bg, color: c.color, textTransform: 'capitalize'
    }}>
      {label.replace(/_/g, ' ')}
    </span>
  );
};

export const roleColor = (role: string): Color => {
  const m: Record<string, Color> = {
    superadmin: 'purple', admin: 'blue', dirigeant: 'orange',
    coach: 'green', joueur: 'grey', parent: 'grey', visiteur: 'grey'
  };
  return m[role] || 'grey';
};

export const convocColor = (s: string): Color => {
  const m: Record<string, Color> = {
    convoque: 'blue', present: 'green', absent: 'red',
    incertain: 'orange', non_retenu: 'grey'
  };
  return m[s] || 'grey';
};
