import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { Loader, EmptyState } from '@/components/ui/Loader';
import api from '@/services/api';
import type { Match, Composition as CompoType, PlayerPosition } from '@/types';

const FORMATIONS: Record<string, string[]> = {
  '4-3-3': ['GB', 'DD', 'DC', 'DC', 'DG', 'MD', 'MC', 'MG', 'AD', 'AT', 'AG'],
  '4-4-2': ['GB', 'DD', 'DC', 'DC', 'DG', 'MD', 'MC', 'MC', 'MG', 'BU', 'BU'],
  '4-2-3-1': ['GB', 'DD', 'DC', 'DC', 'DG', 'MDR', 'MDR', 'MD', 'MC', 'MD', 'BU'],
  '3-5-2': ['GB', 'DC', 'DC', 'DC', 'PD', 'MD', 'MC', 'MC', 'PG', 'BU', 'BU'],
  '5-3-2': ['GB', 'DD', 'DC', 'DC', 'DC', 'DG', 'MD', 'MC', 'MG', 'BU', 'BU']
};

const FORMATION_ROWS: Record<string, number[]> = {
  '4-3-3':  [1, 4, 3, 3],
  '4-4-2':  [1, 4, 4, 2],
  '4-2-3-1':[1, 4, 2, 3, 1],
  '3-5-2':  [1, 3, 5, 2],
  '5-3-2':  [1, 5, 3, 2]
};

export const Composition: React.FC = () => {
  const [matchs, setMatchs] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<string>('');
  const [compo, setCompo] = useState<CompoType | null>(null);
  const [formation, setFormation] = useState('4-3-3');
  const [titulaires, setTitulaires] = useState<PlayerPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<{ data: Match[] }>('/matchs?statut=programme')
      .then(r => { setMatchs(r.data.data); if (r.data.data.length) setSelectedMatch(String(r.data.data[0].id)); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedMatch) return;
    api.get<{ data: CompoType }>(`/matchs/${selectedMatch}/composition`)
      .then(r => {
        setCompo(r.data.data);
        setFormation(r.data.data.formation);
        setTitulaires(r.data.data.titulaires || []);
      })
      .catch(() => { setCompo(null); setTitulaires([]); });
  }, [selectedMatch]);

  const rows = FORMATION_ROWS[formation] || [1, 4, 3, 3];
  const postes = FORMATIONS[formation] || [];

  let playerIdx = 0;
  const getPlayerForPoste = (posteIdx: number) => titulaires[posteIdx] || null;

  const save = async () => {
    if (!selectedMatch) return;
    setSaving(true);
    await api.post('/matchs/composition', {
      match_id: parseInt(selectedMatch),
      formation,
      titulaires,
      remplacants: compo?.remplacants || []
    });
    setSaving(false);
  };

  if (loading) return <Loader />;

  return (
    <div>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {/* Panneau gauche */}
        <div style={{ flex: '0 0 280px' }}>
          <Card title="Configuration">
            <Select
              label="Match"
              value={selectedMatch}
              onChange={e => setSelectedMatch(e.target.value)}
              options={[
                { value: '', label: 'Choisir un match' },
                ...matchs.map(m => ({
                  value: String(m.id),
                  label: `${m.type === 'match' ? 'vs ' + (m.adversaire || '?') : 'Entraîn.'} — ${new Date(m.date).toLocaleDateString('fr-FR')}`
                }))
              ]}
            />
            <Select
              label="Formation"
              value={formation}
              onChange={e => setFormation(e.target.value)}
              options={Object.keys(FORMATIONS).map(f => ({ value: f, label: f }))}
            />
            <Button onClick={save} loading={saving} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
              Sauvegarder
            </Button>
          </Card>
        </div>

        {/* Terrain */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <Card title={`Formation ${formation}`}>
            <div style={{
              background: 'linear-gradient(to bottom, #3a7d44, #2d6a4f)',
              borderRadius: 'var(--radius)', padding: 20, minHeight: 480,
              border: '3px solid #1b4332', position: 'relative'
            }}>
              {/* Lignes terrain */}
              <div style={{
                position: 'absolute', top: '50%', left: '10%', right: '10%',
                height: 1, background: 'rgba(255,255,255,.2)'
              }} />
              <div style={{
                position: 'absolute', top: '15%', bottom: '15%', left: '50%',
                width: 1, background: 'rgba(255,255,255,.1)'
              }} />

              {/* Joueurs par rangée */}
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8, justifyContent: 'space-around' }}>
                {rows.map((count, rowIdx) => {
                  const rowPlayers = [];
                  for (let j = 0; j < count; j++) {
                    const idx = playerIdx++;
                    const player = getPlayerForPoste(idx);
                    const poste = postes[idx] || '';
                    rowPlayers.push(
                      <div key={j} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: '50%',
                          background: '#fff', color: 'var(--dark)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: '.7rem',
                          border: '2px solid rgba(255,255,255,.5)',
                          boxShadow: '0 2px 8px rgba(0,0,0,.3)',
                          cursor: 'pointer'
                        }}>
                          {player ? (player.numero || poste) : poste}
                        </div>
                        <div style={{ fontSize: '.65rem', color: '#fff', fontWeight: 600, textAlign: 'center', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {player ? `${player.prenom?.[0]}. ${player.nom}` : poste}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={rowIdx} style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                      {rowPlayers}
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
