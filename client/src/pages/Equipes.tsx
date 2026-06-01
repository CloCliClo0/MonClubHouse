import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { Loader, EmptyState } from '@/components/ui/Loader';
import api from '@/services/api';
import type { Equipe, Sport } from '@/types';

const CATEGORIES = ['U7','U8','U9','U10','U11','U12','U13','U14','U15','U16','U17','U18','U19','U20','U21','Senior','Veteran','Loisir'];

export const Equipes: React.FC = () => {
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ nom: '', sport_id: '', categorie: 'Senior', genre: 'masculin', format: '11' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [eq, sp] = await Promise.allSettled([
      api.get<{ data: Equipe[] }>('/equipes'),
      api.get<{ data: Sport[] }>('/clubs')
    ]);
    if (eq.status === 'fulfilled') setEquipes(eq.value.data.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/equipes', { ...form, sport_id: parseInt(form.sport_id) });
      setModalOpen(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <Button onClick={() => setModalOpen(true)}>+ Nouvelle équipe</Button>
      </div>

      {equipes.length === 0 ? (
        <Card><EmptyState title="Aucune équipe" message="Créez votre première équipe." icon="⚽" /></Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {equipes.map(eq => (
            <Card key={eq.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <h3 style={{ fontWeight: 700 }}>{eq.nom}</h3>
                <Badge label={eq.categorie} color="blue" />
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                <Badge label={eq.genre} color="grey" />
                <Badge label={`Format ${eq.format}`} color="grey" />
                {eq.sport && <Badge label={eq.sport.nom} color="green" />}
              </div>
              <div style={{ fontSize: '.85rem', color: 'var(--grey-400)' }}>
                {eq.licencies?.length || 0} joueur(s)
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Créer une équipe"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button loading={saving} form="equipe-form" type="submit">Créer</Button>
          </>
        }
      >
        <form id="equipe-form" onSubmit={handleCreate}>
          <Input label="Nom de l'équipe" value={form.nom} onChange={set('nom')} required />
          <Select
            label="Catégorie"
            value={form.categorie}
            onChange={set('categorie')}
            options={CATEGORIES.map(c => ({ value: c, label: c }))}
          />
          <Select
            label="Genre"
            value={form.genre}
            onChange={set('genre')}
            options={[
              { value: 'masculin', label: 'Masculin' },
              { value: 'feminin', label: 'Féminin' },
              { value: 'mixte', label: 'Mixte' },
              { value: 'handisport', label: 'Handisport' }
            ]}
          />
          <Select
            label="Format"
            value={form.format}
            onChange={set('format')}
            options={[
              { value: '11', label: '11 joueurs' }, { value: '8', label: '8 joueurs' },
              { value: '7', label: '7 joueurs' }, { value: '5', label: 'Futsal (5)' },
              { value: '4', label: '4 joueurs' }, { value: '15', label: 'Rugby (15)' }
            ]}
          />
        </form>
      </Modal>
    </div>
  );
};
