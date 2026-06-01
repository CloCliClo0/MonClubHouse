export type Role = 'superadmin' | 'admin' | 'dirigeant' | 'coach' | 'joueur' | 'parent' | 'visiteur';

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  club_id: number | null;
  parent_id: number | null;
  avatar: string | null;
  telephone: string | null;
  date_naissance: string | null;
  actif: boolean;
  notif_email: boolean;
  notif_push: boolean;
  created_at: string;
}

export interface Club {
  id: number;
  nom: string;
  logo: string | null;
  description: string | null;
  adresse: string | null;
  ville: string | null;
  code_postal: string | null;
  telephone: string | null;
  email: string | null;
  site_web: string | null;
  reseaux_sociaux: Record<string, string>;
  couleur_primaire: string;
  couleur_secondaire: string;
  numero_affiliation: string | null;
  terrains?: Terrain[];
  equipes?: Equipe[];
}

export interface Terrain {
  id: number;
  club_id: number;
  nom: string;
  type: 'gazon_naturel' | 'gazon_synthetique' | 'salle' | 'gymnase' | 'piste' | 'autre';
  capacite: number | null;
  adresse: string | null;
}

export interface Sport {
  id: number;
  nom: string;
  icone: string | null;
  nb_joueurs_equipe: number;
}

export type Categorie = 'U7'|'U8'|'U9'|'U10'|'U11'|'U12'|'U13'|'U14'|'U15'|'U16'|'U17'|'U18'|'U19'|'U20'|'U21'|'Senior'|'Veteran'|'Loisir';
export type Genre = 'masculin' | 'feminin' | 'mixte' | 'handisport';

export interface Equipe {
  id: number;
  club_id: number;
  sport_id: number;
  nom: string;
  categorie: Categorie;
  genre: Genre;
  format: '4'|'5'|'7'|'8'|'11'|'15'|'autre';
  coach_id: number | null;
  sport?: Sport;
  licencies?: Licencie[];
}

export interface Licencie {
  id: number;
  user_id: number;
  equipe_id: number | null;
  numero_licence: string | null;
  poste: string | null;
  numero_maillot: number | null;
  statut: 'actif' | 'inactif' | 'suspendu' | 'blesse';
  user?: User;
  equipe?: Equipe;
}

export type MatchType = 'match' | 'entrainement' | 'tournoi' | 'amical' | 'coupe';
export type MatchStatut = 'programme' | 'en_cours' | 'termine' | 'annule' | 'reporte';

export interface Match {
  id: number;
  equipe_id: number;
  terrain_id: number | null;
  adversaire: string | null;
  date: string;
  lieu: string | null;
  type: MatchType;
  domicile_exterieur: 'domicile' | 'exterieur' | 'neutre';
  score_equipe: number | null;
  score_adversaire: number | null;
  statut: MatchStatut;
  heure_rdv: string | null;
  championnat: string | null;
  journee: number | null;
  equipe?: Equipe;
  terrain?: Terrain;
  convocations?: Convocation[];
}

export type ConvocationStatut = 'convoque' | 'present' | 'absent' | 'incertain' | 'non_retenu';

export interface Convocation {
  id: number;
  match_id: number;
  joueur_id: number;
  statut: ConvocationStatut;
  motif_absence: string | null;
  reponse_at: string | null;
  joueur?: User;
  match?: Match;
}

export interface PlayerPosition {
  user_id: number;
  nom: string;
  prenom: string;
  poste: string;
  numero: number | null;
  x?: number;
  y?: number;
}

export interface Composition {
  id: number;
  match_id: number;
  formation: string;
  titulaires: PlayerPosition[];
  remplacants: PlayerPosition[];
  notes_tactiques: string | null;
}

export interface Channel {
  id: number;
  nom: string;
  type: 'equipe' | 'club' | 'prive' | 'groupe' | 'dirigeants';
  club_id: number | null;
  equipe_id: number | null;
  membres: number[];
}

export interface Message {
  id: number;
  channel_id: number;
  sender_id: number;
  contenu: string;
  type: 'texte' | 'image' | 'fichier' | 'systeme';
  created_at: string;
  sender?: User;
}

export interface Notification {
  id: number;
  user_id: number;
  type: 'convocation' | 'match' | 'message' | 'resultat' | 'systeme' | 'rappel' | 'annulation';
  titre: string;
  contenu: string;
  lien: string | null;
  lu: boolean;
  lu_at: string | null;
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: { msg: string; param: string }[];
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}
