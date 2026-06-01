import React from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

const styles: Record<Variant, React.CSSProperties> = {
  primary:   { background: 'var(--primary)', color: '#fff', border: 'none' },
  secondary: { background: 'var(--grey-100)', color: 'var(--dark)', border: 'none' },
  danger:    { background: 'var(--danger)', color: '#fff', border: 'none' },
  outline:   { background: 'transparent', color: 'var(--primary)', border: '2px solid var(--primary)' },
  ghost:     { background: 'transparent', color: 'var(--dark)', border: 'none' }
};

const sizes: Record<Size, React.CSSProperties> = {
  sm: { padding: '6px 14px', fontSize: '.82rem' },
  md: { padding: '10px 20px', fontSize: '.9rem' },
  lg: { padding: '13px 28px', fontSize: '1rem' }
};

export const Button: React.FC<Props> = ({
  variant = 'primary', size = 'md', loading, icon, children, style, disabled, ...rest
}) => {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer',
    transition: 'opacity var(--transition), background var(--transition)',
    lineHeight: 1, opacity: (disabled || loading) ? .55 : 1,
    ...styles[variant], ...sizes[size], ...style
  };

  return (
    <button style={base} disabled={disabled || loading} {...rest}>
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
};

const Spinner = () => (
  <span style={{
    width: 14, height: 14, border: '2px solid rgba(255,255,255,.4)',
    borderTopColor: '#fff', borderRadius: '50%',
    display: 'inline-block', animation: 'spin .7s linear infinite'
  }} />
);
