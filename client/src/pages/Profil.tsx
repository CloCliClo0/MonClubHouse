import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge, roleColor } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import api from '@/services/api';
import type { Notification } from '@/types';

export const Profil: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState<'profil'|'securite'|'notifications'>('profil');
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [form, setForm] = useState({
    nom: user?.nom || '', prenom: user?.prenom || '',
    telephone: user?.telephone || '', date_naissance: user?.date_naissance || '',
    notif_email: user?.notif_email ?? true, notif_push: user?.notif_push ?? true
  });
  const [pwdForm, setPwdForm] = useState({ ancien: '', nouveau: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState('');

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const setPwd = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setPwdForm(prev => ({ ...prev, [k]: e.target.value }));

  const loadNotifs = async () => {
    setLoadingNotifs(true);
    const r = await api.get<{ data: { notifications: Notification[] } }>('/profil/notifications');
    setNotifs(r.data.data.notifications);
    setLoadingNotifs(false);
  };

  useEffect(() => { if (tab === 'notifications') loadNotifs(); }, [tab]);

  const saveProfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await api.put('/profil', form);
    await refreshUser();
    setSaving(false);
  };

  const changePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdForm.nouveau !== pwdForm.confirm) { setPwdMsg('Les mots de passe ne correspondent pas'); return; }
    setSaving(true);
    try {
      await api.put('/profil/password', { ancien_password: pwdForm.ancien, nouveau_password: pwdForm.nouveau });
      setPwdMsg('Mot de passe mis à jour ✓');
      setPwdForm({ ancien: '', nouveau: '', confirm: '' });
    } catch {
      setPwdMsg('Erreur lors du changement de mot de passe');
    } finally {
      setSaving(false);
    }
  };

  const marquerTout = async () => {
    await api.patch('/profil/notifications/toutes-lues');
    loadNotifs();
  };

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--grey-200)', gap: 4, marginBottom: 24 }}>
        {(['profil', 'securite', 'notifications'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '.9rem',
            color: tab === t ? 'var(--primary)' : 'var(--grey-400)',
            borderBottom: `2px solid ${tab === t ? 'var(--primary)' : 'transparent'}`,
            marginBottom: -2, transition: 'all var(--transition)', textTransform: 'capitalize'
          }}>
            {t === 'profil' ? 'Mon Profil' : t === 'securite' ? 'Sécurité' : 'Notifications'}
          </button>
        ))}
      </div>

      {tab === 'profil' && (
        <Card title="Informations personnelles">
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1.6rem', flexShrink: 0, overflow: 'hidden' }}>
              {user?.avatar ? <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : `${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`}
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 4 }}>{user?.prenom} {user?.nom}</h2>
              <Badge label={user?.role || ''} color={roleColor(user?.role || '')} />
              <p style={{ fontSize: '.82rem', color: 'var(--grey-400)', marginTop: 6 }}>{user?.email}</p>
            </div>
          </div>
          <form onSubmit={saveProfil}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Prénom" value={form.prenom} onChange={set('prenom')} required />
              <Input label="Nom" value={form.nom} onChange={set('nom')} required />
            </div>
            <Input label="Téléphone" type="tel" value={form.telephone} onChange={set('telephone')} />
            <Input label="Date de naissance" type="date" value={form.date_naissance} onChange={set('date_naissance')} />
            <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600 }}>
                <input type="checkbox" checked={form.notif_email} onChange={set('notif_email')} />
                Notifications email
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600 }}>
                <input type="checkbox" checked={form.notif_push} onChange={set('notif_push')} />
                Notifications push
              </label>
            </div>
            <Button type="submit" loading={saving}>Sauvegarder</Button>
          </form>
        </Card>
      )}

      {tab === 'securite' && (
        <Card title="Changer le mot de passe">
          {pwdMsg && <div style={{ background: pwdMsg.includes('✓') ? '#d1fae5' : '#fee2e2', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 16, fontSize: '.88rem', color: pwdMsg.includes('✓') ? '#065f46' : '#991b1b' }}>{pwdMsg}</div>}
          <form onSubmit={changePwd}>
            <Input label="Mot de passe actuel" type="password" value={pwdForm.ancien} onChange={setPwd('ancien')} required />
            <Input label="Nouveau mot de passe" type="password" value={pwdForm.nouveau} onChange={setPwd('nouveau')} required hint="8 car. min., 1 majuscule, 1 chiffre" />
            <Input label="Confirmer le nouveau mot de passe" type="password" value={pwdForm.confirm} onChange={setPwd('confirm')} required />
            <Button type="submit" loading={saving}>Changer le mot de passe</Button>
          </form>
        </Card>
      )}

      {tab === 'notifications' && (
        <Card
          title="Mes notifications"
          action={<Button size="sm" variant="outline" onClick={marquerTout}>Tout marquer lu</Button>}
        >
          {loadingNotifs ? <Loader /> : notifs.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--grey-400)', padding: '20px 0' }}>Aucune notification</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {notifs.map(n => (
                <div key={n.id} style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: n.lu ? 'var(--grey-50)' : '#eff6ff', border: `1px solid ${n.lu ? 'var(--grey-200)' : '#bfdbfe'}`, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.1rem', marginTop: 2 }}>
                    {n.type === 'convocation' ? '📋' : n.type === 'message' ? '💬' : n.type === 'match' ? '⚽' : '🔔'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: n.lu ? 500 : 700, fontSize: '.9rem' }}>{n.titre}</div>
                    <div style={{ fontSize: '.8rem', color: 'var(--grey-400)' }}>{n.contenu}</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--grey-400)', marginTop: 4 }}>
                      {new Date(n.created_at).toLocaleString('fr-FR')}
                    </div>
                  </div>
                  {!n.lu && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', marginTop: 6, flexShrink: 0 }} />}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
