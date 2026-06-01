import React from 'react';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input: React.FC<Props> = ({ label, error, hint, id, style, ...rest }) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label htmlFor={inputId} style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '.88rem' }}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        style={{
          width: '100%', padding: '10px 14px',
          border: `1.5px solid ${error ? 'var(--danger)' : '#dde1e7'}`,
          borderRadius: 'var(--radius-sm)', fontSize: '.92rem',
          transition: 'border-color var(--transition)',
          background: '#fff', color: 'var(--dark)', outline: 'none',
          ...style
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
        onBlur={e => { e.currentTarget.style.borderColor = error ? 'var(--danger)' : '#dde1e7'; }}
        {...rest}
      />
      {error && <p style={{ color: 'var(--danger)', fontSize: '.8rem', marginTop: 4 }}>{error}</p>}
      {hint && !error && <p style={{ color: 'var(--grey-400)', fontSize: '.8rem', marginTop: 4 }}>{hint}</p>}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, error, options, id, ...rest }) => {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label htmlFor={selectId} style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '.88rem' }}>{label}</label>}
      <select
        id={selectId}
        style={{
          width: '100%', padding: '10px 14px',
          border: `1.5px solid ${error ? 'var(--danger)' : '#dde1e7'}`,
          borderRadius: 'var(--radius-sm)', fontSize: '.92rem',
          background: '#fff', color: 'var(--dark)', outline: 'none'
        }}
        {...rest}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p style={{ color: 'var(--danger)', fontSize: '.8rem', marginTop: 4 }}>{error}</p>}
    </div>
  );
};
