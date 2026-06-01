import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader, EmptyState } from '@/components/ui/Loader';
import api from '@/services/api';
import type { Club as ClubType } from '@/types';

export const Club: React.FC = () => {
  const { user } = useAuth();
  const [club, setClub] = useState<ClubType | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<ClubType>>({});
  const [saving, setSaving] = useState(false);

  const canEdit = ['superadmin', 'admin'].includes(user?.role || '');

  useEffect(() => {
    if (!user?.club_id) { setLoading(false); return; }
    api.get<{ data: ClubType }>(`/clubs/${user.club_id}`)
      .then(r => { setClub(r.data.data); setForm(r.data.data); })
      .finally(() => setLoading(false));
  }, [user]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const save = async () => {
    if (!club) return;
    setSaving(true);
    try {
      const r = await api.put<{ data: ClubType }>(`/clubs/${club.id}`, form);
      setClub(r.data.data);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;
  if (!club) return (
    <Card>
      <EmptyState title="Aucun club" message="Vous n'êtes pas encore rattaché à un club." icon="🏠" />
    </Card>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
      {/* Infos club */}
      <Card
        title="Informations du club"
        action={canEdit && !editing ? <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Modifier</Button> : undefined}
      >
        {editing ? (
          <div>
            <Input label="Nom du club" value={form.nom || ''} onChange={set('nom')} />
            <Input label="Ville" value={form.ville || ''} onChange={set('ville')} />
            <Input label="Adresse" value={form.adresse || ''} onChange={set('adresse')} />
            <Input label="Téléphone" value={form.telephone || ''} onChange={set('telephone')} />
            <Input label="Email" type="email" value={form.email || ''} onChange={set('email')} />
            <Input label="Site web" value={form.site_web || ''} onChange={set('site_web')} />
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '.88rem' }}>Description</label>
              <textarea
                value={form.description || ''}
                onChange={set('description')}
                rows={4}
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--grey-200)', borderRadius: 'var(--radius-sm)', fontSize: '.9rem', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>Annuler</Button>
              <Button size="sm" loading={saving} onClick={save}>Sauvegarder</Button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
              {club.logo
                ? <img src={club.logo} alt={club.nom} style={{ width: 64, height: 64, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
                : <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-sm)', background: club.couleur_primaire || 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1.4rem' }}>
                    {club.nom?.[0]}
                  </div>
              }
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{club.nom}</h2>
                {club.numero_affiliation && <p style={{ fontSize: '.82rem', color: 'var(--grey-400)' }}>N° {club.numero_affiliation}</p>}
              </div>
            </div>
            {club.description && <p style={{ color: 'var(--grey-600)', fontSize: '.9rem' }}>{club.description}</p>}
            <InfoRow icon="📍" value={[club.adresse, club.ville, club.code_postal].filter(Boolean).join(', ')} />
            <InfoRow icon="📞" value={club.telephone} />
            <InfoRow icon="✉️" value={club.email} />
            <InfoRow icon="🌐" value={club.site_web} link />
          </div>
        )}
      </Card>

      {/* Terrains */}
      <Card title="Terrains & installations">
        {(!club.terrains || club.terrains.length === 0) ? (
          <EmptyState title="Aucun terrain" icon="⚽" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {club.terrains.map(t => (
              <div key={t.id} style={{ padding: '12px 14px', background: 'var(--grey-50)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontWeight: 700 }}>{t.nom}</div>
                <div style={{ fontSize: '.82rem', color: 'var(--grey-400)' }}>
                  {t.type.replace(/_/g, ' ')}
                  {t.capacite && ` · ${t.capacite} places`}
                  {t.adresse && ` · ${t.adresse}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Équipes */}
      {club.equipes && club.equipes.length > 0 && (
        <Card title="Équipes du club">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {club.equipes.map(eq => (
              <div key={eq.id} style={{ padding: '8px 14px', background: 'var(--grey-50)', borderRadius: 99, fontSize: '.85rem', fontWeight: 600 }}>
                {eq.nom}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

const InfoRow: React.FC<{ icon: string; value?: string | null; link?: boolean }> = ({ icon, value, link }) => {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: 10, fontSize: '.88rem' }}>
      <span>{icon}</span>
      {link ? <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>{value}</a> : <span>{value}</span>}
    </div>
  );
};
