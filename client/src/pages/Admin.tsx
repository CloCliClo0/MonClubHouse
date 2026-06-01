import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge, roleColor } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { Loader, EmptyState } from '@/components/ui/Loader';
import api from '@/services/api';
import type { User } from '@/types';

export const Admin: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    api.get<{ data: User[] }>('/admin/users')
      .then(r => setUsers(r.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateRole = async (userId: number, role: string) => {
    await api.patch(`/admin/users/${userId}/role`, { role });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: role as User['role'] } : u));
  };

  const toggleActif = async (userId: number) => {
    await api.patch(`/admin/users/${userId}/actif`);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, actif: !u.actif } : u));
  };

  const filtered = users.filter(u =>
    search === '' ||
    u.nom.toLowerCase().includes(search.toLowerCase()) ||
    u.prenom.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Card title="Gestion des utilisateurs">
        <div style={{ marginBottom: 16 }}>
          <input
            placeholder="Rechercher un membre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '10px 14px', border: '1.5px solid var(--grey-200)', borderRadius: 'var(--radius-sm)', fontSize: '.92rem', width: 280 }}
          />
        </div>

        {loading ? <Loader /> : filtered.length === 0 ? (
          <EmptyState title="Aucun utilisateur" icon="👥" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.9rem' }}>
              <thead>
                <tr>
                  {['Membre', 'Email', 'Rôle', 'Statut', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, color: 'var(--grey-400)', background: 'var(--grey-50)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--grey-100)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '.78rem', flexShrink: 0 }}>
                          {u.avatar ? <img src={u.avatar} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : `${u.prenom?.[0] || ''}${u.nom?.[0] || ''}`}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{u.prenom} {u.nom}</div>
                          <div style={{ fontSize: '.76rem', color: 'var(--grey-400)' }}>
                            {u.derniere_connexion ? `Vu ${new Date(u.derniere_connexion).toLocaleDateString('fr-FR')}` : 'Jamais connecté'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--grey-600)', fontSize: '.85rem' }}>{u.email}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <select
                        value={u.role}
                        onChange={e => updateRole(u.id, e.target.value)}
                        style={{ padding: '5px 10px', border: '1px solid var(--grey-200)', borderRadius: 'var(--radius-sm)', fontSize: '.82rem', background: '#fff' }}
                      >
                        {['admin', 'dirigeant', 'coach', 'joueur', 'parent', 'visiteur'].map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Badge label={u.actif ? 'Actif' : 'Inactif'} color={u.actif ? 'green' : 'red'} />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Button
                        size="sm"
                        variant={u.actif ? 'danger' : 'secondary'}
                        onClick={() => toggleActif(u.id)}
                      >
                        {u.actif ? 'Désactiver' : 'Réactiver'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
