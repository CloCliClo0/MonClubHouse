# MonClubHouse

Application de gestion de club sportif — tableau de bord pour les dirigeants, coachs, joueurs et parents.

## Ce que ça fait

- **Tableau de bord** — vue d'ensemble du club (stats, événements, licences)
- **Équipes** — création et gestion des équipes par catégorie
- **Composition** — terrain interactif avec échange de joueurs par glisser/cliquer
- **Convocations** — envoi et suivi des convocations match par match
- **Calendrier** — planning des matchs et entraînements
- **Résultats & Classement** — saisie des scores, classement automatique
- **Messages** — chat en temps réel par canal (équipe, club, prive…) avec emojis et photos
- **Mon Club** — infos club, terrains, logo
- **Administration** — gestion des rôles utilisateurs
- **Page publique** — résultats visibles sans compte (`/resultats-club`)

## Accès par code d'invitation

Chaque membre rejoint le club via un code généré par un admin :

| Rôle | Accès |
|------|-------|
| Joueur | Code équipe |
| Parent | Code équipe + liaison à l'enfant |
| Coach | Code coach (active le rôle) |
| Dirigeant | Code dirigeant (active le rôle) |

## Stack technique

| Côté | Technologie |
|------|-------------|
| Backend | Node.js + Express + Sequelize (MySQL) |
| Temps réel | Socket.io |
| Auth | JWT + Google OAuth2 |
| Frontend | React 18 + TypeScript + Vite |
| Style | Tailwind CSS + Material Symbols |
| Fichiers | Stockage local ou Google Drive (2T) |
| Hébergement | Hostinger (`monclubhouse.fr`) |

## Lancer en local

```bash
# Backend
cd back
npm install
node server.js        # port 3000

# Frontend (autre terminal)
cd front
npm install
npm run dev           # port 5173 → http://localhost:5173
```

> La base de données est sur Hostinger. Pour un dev 100 % local, activer
> l'accès distant MySQL dans le panel Hostinger ou lancer un container Docker :
> `docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=mch_db --name mch mysql:8`

## Variables d'environnement (`back/.env`)

```env
APP_URL=https://monclubhouse.fr
DB_HOST=localhost
DB_NAME=u555371370_mch_db
DB_USER=u555371370_root
DB_PASS=...
JWT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=https://monclubhouse.fr/auth/google/callback
GOOGLE_DRIVE_FOLDER_ID=1V26qhNMhw1n_A3PycHyYdBpMUge_Fktj
GOOGLE_DRIVE_REFRESH_TOKEN=   # obtenir via : node back/scripts/getDriveToken.js
```

## Base de données

Importer `database.sql` dans phpMyAdmin (Hostinger) pour créer toutes les tables.
Le fichier inclut le compte superadmin initial.

## Compte superadmin

| Email | Mot de passe |
|-------|--------------|
| hugo22042006@gmail.com | Hugo220406@ |
