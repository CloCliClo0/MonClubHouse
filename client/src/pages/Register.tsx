import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import api from '@/services/api';
import type { User, AuthTokens } from '@/types';

export const Register: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', password: '', role: 'joueur' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post<{ success: boolean; data: { user: User } & AuthTokens }>(
        '/auth/register', form
      );
      login(data.data.access_token, data.data.refresh_token, data.data.user);
      navigate('/dashboard');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { errors?: { msg: string }[]; message?: string } } };
      setError(e.response?.data?.errors?.[0]?.msg || e.response?.data?.message || 'Erreur inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--dark) 0%, var(--primary-dark) 100%)', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 'var(--radius)', padding: 40, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, background: 'var(--primary)', borderRadius: 'var(--radius-sm)', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: '1.2rem' }}>MCH</div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Créer un compte</h1>
          <p style={{ color: 'var(--grey-400)', fontSize: '.88rem' }}>Rejoins ton club</p>
        </div>

        {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 16, fontSize: '.88rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Prénom" value={form.prenom} onChange={set('prenom')} required />
            <Input label="Nom" value={form.nom} onChange={set('nom')} required />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
          <Input label="Mot de passe" type="password" value={form.password} onChange={set('password')} required hint="8 car. min., 1 majuscule, 1 chiffre" autoComplete="new-password" />
          <Select
            label="Rôle"
            value={form.role}
            onChange={set('role')}
            options={[
              { value: 'joueur', label: 'Joueur' },
              { value: 'parent', label: 'Parent' },
              { value: 'visiteur', label: 'Visiteur' }
            ]}
          />
          <Button type="submit" loading={loading} style={{ width: '100%', justifyContent: 'center' }}>
            Créer mon compte
          </Button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '.88rem', color: 'var(--grey-400)' }}>
          Déjà un compte ? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Se connecter</Link>
        </p>
      </div>
    </div>
  );
};
