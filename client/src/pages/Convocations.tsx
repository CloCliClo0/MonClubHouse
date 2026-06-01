import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Badge, convocColor } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Loader, EmptyState } from '@/components/ui/Loader';
import api from '@/services/api';
import type { Match, Convocation } from '@/types';

export const Convocations: React.FC = () => {
  const { user } = useAuth();
  const [matchs, setMatchs] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [reponseModal, setReponseModal] = useState<{ match: Match; conv: Convocation } | null>(null);
  const [motif, setMotif] = useState('');

  const isCoach = ['superadmin', 'admin', 'dirigeant', 'coach'].includes(user?.role || '');

  const loadMatchs = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Match[] }>('/matchs?statut=programme');
      setMatchs(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMatchs(); }, []);

  const repondreConvoc = async (statut: string) => {
    if (!reponseModal) return;
    await api.patch(`/matchs/${reponseModal.match.id}/reponse`, { statut, motif_absence: motif });
    setReponseModal(null);
    loadMatchs();
  };

  if (loading) return <Loader />;

  return (
    <div>
      {matchs.length === 0 ? (
        <Card><EmptyState title="Aucune convocation" message="Vous n'avez pas de convocation à venir." icon="📋" /></Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {matchs.map(m => (
            <Card key={m.id}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: '1.2rem' }}>{m.type === 'match' ? '⚽' : '🏃'}</span>
                    <h3 style={{ fontWeight: 700 }}>
                      {m.type === 'match' ? `vs ${m.adversaire || '?'}` : 'Entraînement'}
                    </h3>
                    <Badge label={m.type} color={m.type === 'match' ? 'green' : 'blue'} />
                    {m.domicile_exterieur && <Badge label={m.domicile_exterieur} color={m.domicile_exterieur === 'domicile' ? 'green' : 'orange'} />}
                  </div>
                  <div style={{ fontSize: '.88rem', color: 'var(--grey-400)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span>📅 {new Date(m.date).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
                    {m.heure_rdv && <span>🕐 RDV à {m.heure_rdv}</span>}
                    {m.lieu && <span>📍 {m.lieu}</span>}
                    {m.championnat && <span>🏆 {m.championnat}{m.journee && ` - J${m.journee}`}</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                  {/* Réponse joueur */}
                  {!isCoach && m.convocations && (() => {
                    const myConv = m.convocations.find(c => c.joueur_id === user?.id);
                    if (!myConv) return null;
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                        <Badge label={myConv.statut} color={convocColor(myConv.statut)} />
                        {myConv.statut === 'convoque' && (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <Button size="sm" variant="primary" onClick={() => setReponseModal({ match: m, conv: myConv })}>Répondre</Button>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Liste convocations (coach) */}
                  {isCoach && m.convocations && (
                    <div style={{ fontSize: '.82rem' }}>
                      <span style={{ color: 'var(--success)' }}>✅ {m.convocations.filter(c => c.statut === 'present').length}</span>
                      {' / '}
                      <span style={{ color: 'var(--danger)' }}>❌ {m.convocations.filter(c => c.statut === 'absent').length}</span>
                      {' / '}
                      <span style={{ color: 'var(--warning)' }}>❓ {m.convocations.filter(c => c.statut === 'incertain').length}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal réponse */}
      <Modal
        open={!!reponseModal}
        onClose={() => setReponseModal(null)}
        title="Répondre à la convocation"
        footer={
          <>
            <Button variant="secondary" onClick={() => setReponseModal(null)}>Annuler</Button>
            <Button variant="danger" onClick={() => repondreConvoc('absent')}>Je suis absent</Button>
            <Button variant="primary" onClick={() => repondreConvoc('present')}>Je serai présent</Button>
          </>
        }
      >
        <p style={{ marginBottom: 16, color: 'var(--grey-600)' }}>
          {reponseModal?.match.type === 'match'
            ? `Match vs ${reponseModal.match.adversaire || '?'}`
            : 'Entraînement'
          } — {reponseModal?.match.date && new Date(reponseModal.match.date).toLocaleDateString('fr-FR')}
        </p>
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '.88rem' }}>Motif (si absent)</label>
          <input
            value={motif}
            onChange={e => setMotif(e.target.value)}
            placeholder="Motif de l'absence..."
            style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--grey-200)', borderRadius: 'var(--radius-sm)', fontSize: '.9rem' }}
          />
        </div>
      </Modal>
    </div>
  );
};
