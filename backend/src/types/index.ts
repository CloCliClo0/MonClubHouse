export type Role =
  | 'superadmin'
  | 'admin'
  | 'dirigeant'
  | 'coach'
  | 'joueur'
  | 'parent'
  | 'visiteur';

export const ROLE_LEVEL: Record<Role, number> = {
  superadmin: 6,
  admin: 5,
  dirigeant: 4,
  coach: 3,
  joueur: 2,
  parent: 2,
  visiteur: 1,
};

export type MatchType = 'match' | 'entrainement' | 'tournoi' | 'amical' | 'coupe';
export type MatchStatut = 'programme' | 'en_cours' | 'termine' | 'annule' | 'reporte';
export type ConvocationStatut = 'convoque' | 'present' | 'absent' | 'incertain' | 'non_retenu';
export type TerrainType = 'gazon_naturel' | 'gazon_synthetique' | 'salle' | 'gymnase' | 'piste' | 'autre';
export type Categorie =
  | 'U7' | 'U8' | 'U9' | 'U10' | 'U11' | 'U12' | 'U13' | 'U14'
  | 'U15' | 'U16' | 'U17' | 'U18' | 'U19' | 'U20' | 'U21'
  | 'Senior' | 'Veteran' | 'Loisir';
export type Genre = 'masculin' | 'feminin' | 'mixte' | 'handisport';
export type ChannelType = 'equipe' | 'club' | 'prive' | 'groupe' | 'dirigeants';
export type NotificationType = 'convocation' | 'match' | 'message' | 'resultat' | 'systeme' | 'rappel' | 'annulation';

export interface JwtPayload {
  id: number;
  role: Role;
  club_id: number | null;
  iat?: number;
  exp?: number;
}

export interface PlayerPosition {
  user_id: number;
  nom: string;
  prenom: string;
  poste: string;
  numero: number | null;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: { msg: string; param?: string }[];
}

// Express augmentation — req.user typé
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface User {
      id: number;
      nom: string;
      prenom: string;
      email: string;
      role: Role;
      club_id: number | null;
      avatar: string | null;
      actif: boolean;
      google_id: string | null;
      refresh_token: string | null;
      password_hash: string | null;
      notif_email: boolean;
      notif_push: boolean;
      verifyPassword(pwd: string): Promise<boolean>;
      toSafeJSON(): Record<string, unknown>;
      update(values: Partial<User>): Promise<User>;
    }
  }
}
