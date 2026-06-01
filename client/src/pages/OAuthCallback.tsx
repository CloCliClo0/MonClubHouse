import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import type { User } from '@/types';

export const OAuthCallback: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const refresh = params.get('refresh');

    if (!token || !refresh) {
      navigate('/login?error=oauth_failed');
      return;
    }

    localStorage.setItem('mch_access_token', token);
    localStorage.setItem('mch_refresh_token', refresh);

    api.get<{ data: User }>('/auth/me')
      .then(r => {
        login(token, refresh, r.data.data);
        navigate('/dashboard');
      })
      .catch(() => navigate('/login?error=oauth_failed'));
  }, [login, navigate]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--grey-200)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      <p style={{ color: 'var(--grey-400)' }}>Connexion en cours...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};
