import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loader, EmptyState } from '@/components/ui/Loader';
import api from '@/services/api';
import type { Match } from '@/types';

export const Resultats: React.FC = () => {
  const [resultats, setResultats] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'locaux' | 'classement'>('locaux');

  useEffect(() => {
    api.get<{ data: Match[] }>('/resultats?limit=20')
      .then(r => setResultats(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--grey-200)', gap: 4, marginBottom: 24 }}>
        {(['locaux', 'classement'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: '.9rem',
              color: tab === t ? 'var(--primary)' : 'var(--grey-400)',
              borderBottom: `2px solid ${tab === t ? 'var(--primary)' : 'transparent'}`,
              marginBottom: -2, transition: 'all var(--transition)', textTransform: 'capitalize'
            }}
          >
            {t === 'locaux' ? 'Résultats du club' : 'Classement FFF'}
          </button>
        ))}
      </div>

      {tab === 'locaux' && (
        <Card title="Derniers résultats">
          {loading ? <Loader /> : resultats.length === 0 ? (
            <EmptyState title="Aucun résultat" message="Les résultats apparaîtront ici après les matchs." icon="📊" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {resultats.map(m => {
                const victoire = (m.score_equipe ?? 0) > (m.score_adversaire ?? 0);
                const nul = m.score_equipe === m.score_adversaire;
                const defaite = (m.score_equipe ?? 0) < (m.score_adversaire ?? 0);
                return (
                  <div key={m.id} style={{
                    padding: '14px 16px', borderRadius: 'var(--radius-sm)',
                    background: victoire ? '#f0fdf4' : defaite ? '#fef2f2' : 'var(--grey-50)',
                    border: `1px solid ${victoire ? '#bbf7d0' : defaite ? '#fecaca' : 'var(--grey-200)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>
                        {m.equipe?.nom || 'Mon équipe'}
                        <span style={{ color: 'var(--grey-400)', fontWeight: 400 }}> vs </span>
                        {m.adversaire || '?'}
                      </div>
                      <div style={{ fontSize: '.78rem', color: 'var(--grey-400)' }}>
                        {new Date(m.date).toLocaleDateString('fr-FR')}
                        {m.championnat && ` · ${m.championnat}`}
                        {m.journee && ` J${m.journee}`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        fontSize: '1.4rem', fontWeight: 800,
                        color: victoire ? 'var(--success)' : defaite ? 'var(--danger)' : 'var(--grey-600)'
                      }}>
                        {m.score_equipe} - {m.score_adversaire}
                      </div>
                      <Badge
                        label={victoire ? 'Victoire' : nul ? 'Nul' : 'Défaite'}
                        color={victoire ? 'green' : nul ? 'grey' : 'red'}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {tab === 'classement' && (
        <Card title="Classement FFF">
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--grey-400)' }}>
            <p style={{ marginBottom: 8 }}>🏆 Classement via API FFF</p>
            <p style={{ fontSize: '.85rem' }}>Configurez votre clé FFF_API_KEY dans le fichier <code>.env</code> du serveur pour afficher le classement de championnat.</p>
          </div>
        </Card>
      )}
    </div>
  );
};
