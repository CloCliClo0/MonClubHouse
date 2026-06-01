import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import api from '@/services/api';
import type { Match } from '@/types';

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

export const Calendrier: React.FC = () => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [matchs, setMatchs] = useState<Match[]>([]);
  const [selected, setSelected] = useState<Match[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get<{ data: Match[] }>(`/matchs?mois=${month + 1}&annee=${year}`)
      .then(r => setMatchs(r.data.data))
      .finally(() => setLoading(false));
  }, [month, year]);

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  // Construire la grille du mois
  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1; // lundi = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const getMatchsForDay = (day: number | null) => {
    if (!day) return [];
    return matchs.filter(m => {
      const d = new Date(m.date);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  return (
    <div>
      <Card>
        {/* Navigation mois */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <Button variant="secondary" size="sm" onClick={prev}>‹</Button>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{MONTHS[month]} {year}</h2>
          <Button variant="secondary" size="sm" onClick={next}>›</Button>
        </div>

        {loading ? <Loader /> : (
          <>
            {/* Jours de la semaine */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
              {DAYS.map(d => (
                <div key={d} style={{ fontSize: '.75rem', fontWeight: 700, textAlign: 'center', padding: '8px 0', color: 'var(--grey-400)' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Cases du calendrier */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {cells.map((day, i) => {
                const evts = getMatchsForDay(day);
                const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
                return (
                  <div
                    key={i}
                    onClick={() => evts.length > 0 && setSelected(evts)}
                    style={{
                      minHeight: 80, padding: 6,
                      borderRadius: 'var(--radius-sm)',
                      background: day ? '#fff' : 'transparent',
                      border: `1px solid ${isToday ? 'var(--primary)' : day ? 'var(--grey-200)' : 'transparent'}`,
                      cursor: evts.length > 0 ? 'pointer' : 'default',
                      opacity: day ? 1 : .3
                    }}
                  >
                    {day && (
                      <>
                        <div style={{ fontSize: '.78rem', fontWeight: 700, color: isToday ? 'var(--primary)' : 'var(--grey-400)', marginBottom: 4 }}>
                          {day}
                        </div>
                        {evts.slice(0, 2).map(m => (
                          <div key={m.id} style={{
                            fontSize: '.68rem', padding: '2px 5px', borderRadius: 4, marginBottom: 2,
                            background: m.type === 'match' ? '#d1fae5' : '#dbeafe',
                            color: m.type === 'match' ? '#065f46' : '#1e40af',
                            fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                          }}>
                            {m.type === 'match' ? `⚽ vs ${m.adversaire || '?'}` : '🏃 Entraîn.'}
                          </div>
                        ))}
                        {evts.length > 2 && <div style={{ fontSize: '.65rem', color: 'var(--grey-400)' }}>+{evts.length - 2}</div>}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      {/* Détail événements du jour */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setSelected(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 'var(--radius)', padding: 28, maxWidth: 480, width: '100%' }}>
            <h3 style={{ marginBottom: 16, fontWeight: 700 }}>Événements</h3>
            {selected.map(m => (
              <div key={m.id} style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--grey-50)', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      {m.type === 'match' ? `⚽ vs ${m.adversaire || '?'}` : '🏃 Entraînement'}
                    </div>
                    <div style={{ fontSize: '.82rem', color: 'var(--grey-400)' }}>
                      {new Date(m.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      {m.heure_rdv && ` · RDV ${m.heure_rdv}`}
                      {m.lieu && ` · ${m.lieu}`}
                    </div>
                    {m.championnat && <div style={{ fontSize: '.78rem', color: 'var(--grey-600)' }}>{m.championnat}</div>}
                  </div>
                  <Badge label={m.domicile_exterieur} color={m.domicile_exterieur === 'domicile' ? 'green' : 'orange'} />
                </div>
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={() => setSelected(null)} style={{ marginTop: 8 }}>Fermer</Button>
          </div>
        </div>
      )}
    </div>
  );
};
