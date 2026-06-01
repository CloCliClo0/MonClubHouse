import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { StatCard, Card } from '@/components/ui/Card';
import { Badge, convocColor } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import api from '@/services/api';
import type { Match, Convocation, Notification } from '@/types';

interface DashStats {
  total_users: number;
  total_equipes: number;
  matchs_a_venir: number;
  notif_non_lues: number;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashStats | null>(null);
  const [prochains, setProchains] = useState<Match[]>([]);
  const [convocs, setConvocs] = useState<Convocation[]>([]);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [s, m, c, n] = await Promise.allSettled([
        api.get<{ data: DashStats }>('/admin/dashboard'),
        api.get<{ data: Match[] }>('/matchs?statut=programme'),
        api.get<{ data: { notifications: Notification[] } }>('/profil/notifications'),
        api.get<{ data: Convocation[] }>(`/matchs?statut=programme`)
      ]);
      if (s.status === 'fulfilled') setStats(s.value.data.data);
      if (m.status === 'fulfilled') setProchains(m.value.data.data.slice(0, 5));
      if (c.status === 'fulfilled') setNotifs(c.value.data.data.notifications.filter(n => !n.lu).slice(0, 5));
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <Loader />;

  const isManagerRole = ['superadmin', 'admin', 'dirigeant', 'coach'].includes(user?.role || '');

  return (
    <div>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 24 }}>
        Bonjour {user?.prenom} 👋
      </h2>

      {/* Stats */}
      {isManagerRole && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20, marginBottom: 28 }}>
          <StatCard label="Membres" value={stats.total_users} icon="👥" color="green" />
          <StatCard label="Équipes" value={stats.total_equipes} icon="⚽" color="blue" />
          <StatCard label="Matchs à venir" value={stats.matchs_a_venir} icon="📅" color="orange" />
          <StatCard label="Notifications" value={stats.notif_non_lues} icon="🔔" color="red" />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
        {/* Prochains matchs */}
        <Card
          title="Prochains événements"
          action={<Link to="/calendrier" style={{ fontSize: '.82rem', color: 'var(--primary)' }}>Voir tout →</Link>}
        >
          {prochains.length === 0 ? (
            <p style={{ color: 'var(--grey-400)', fontSize: '.9rem', textAlign: 'center', padding: '20px 0' }}>
              Aucun événement à venir
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {prochains.map(m => (
                <Link key={m.id} to={`/matchs/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{
                    padding: '12px 14px', borderRadius: 'var(--radius-sm)',
                    background: 'var(--grey-50)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'background var(--transition)'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '.9rem' }}>
                        {m.type === 'match' ? `⚽ vs ${m.adversaire || '?'}` : `🏃 Entraînement`}
                      </div>
                      <div style={{ fontSize: '.78rem', color: 'var(--grey-400)' }}>
                        {new Date(m.date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        {m.lieu && ` · ${m.lieu}`}
                      </div>
                    </div>
                    <Badge label={m.type} color={m.type === 'match' ? 'green' : 'blue'} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Notifications */}
        <Card
          title="Notifications récentes"
          action={<Link to="/profil#notifications" style={{ fontSize: '.82rem', color: 'var(--primary)' }}>Voir tout →</Link>}
        >
          {notifs.length === 0 ? (
            <p style={{ color: 'var(--grey-400)', fontSize: '.9rem', textAlign: 'center', padding: '20px 0' }}>
              Aucune notification non lue
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {notifs.map(n => (
                <div key={n.id} style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--grey-50)', display: 'flex', gap: 12 }}>
                  <span style={{ fontSize: '1.1rem' }}>
                    {n.type === 'convocation' ? '📋' : n.type === 'message' ? '💬' : n.type === 'match' ? '⚽' : '🔔'}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '.88rem' }}>{n.titre}</div>
                    <div style={{ fontSize: '.78rem', color: 'var(--grey-400)' }}>{n.contenu.slice(0, 80)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Accès rapides */}
        <Card title="Accès rapides">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { to: '/convocations', icon: '📋', label: 'Convocations' },
              { to: '/chat', icon: '💬', label: 'Chat' },
              { to: '/resultats', icon: '📊', label: 'Résultats' },
              { to: '/profil', icon: '👤', label: 'Mon Profil' }
            ].map(item => (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px', borderRadius: 'var(--radius-sm)',
                  background: 'var(--grey-50)', textDecoration: 'none', color: 'var(--dark)',
                  fontWeight: 600, fontSize: '.9rem', transition: 'background var(--transition)'
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
