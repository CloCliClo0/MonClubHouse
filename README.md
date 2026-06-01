# MonClubHouse

> **"Ton club, ta maison"** — Application fullstack de gestion de club sportif.

## Stack

| Couche | Technologie |
|--------|------------|
| Backend | Node.js · Express · Sequelize |
| Base de données | MySQL / MariaDB |
| Auth | JWT + Refresh Token + Google OAuth 2.0 |
| Temps réel | Socket.io |
| Frontend | React 18 · TypeScript · Vite |
| Déploiement | Hostinger SSH (Node.js) |

## Structure

```
monclubhouse/
├── server/                  # Backend Node.js/Express
│   ├── config/              # db.js, passport.js, jwt.js
│   ├── controllers/         # Logique métier (auth, club, équipes…)
│   ├── middlewares/         # auth, rbac, validation, rateLimiter
│   ├── migrations/          # Scripts Sequelize (001→006)
│   ├── models/              # Sequelize models (User, Club, Match…)
│   ├── routes/              # Routes Express par module
│   ├── sockets/             # Socket.io chat handler
│   ├── server.js            # Point d'entrée
│   ├── .env.example
│   └── package.json
├── client/                  # Frontend React TypeScript
│   ├── src/
│   │   ├── components/      # UI (Button, Card, Modal…) + Layout
│   │   ├── context/         # AuthContext, SocketContext
│   │   ├── hooks/           # useApi, useToast
│   │   ├── pages/           # Login, Dashboard, Chat, Calendrier…
│   │   ├── services/        # api.ts (axios + auto-refresh), socket.ts
│   │   ├── types/           # Types TypeScript globaux
│   │   ├── App.tsx          # Router + providers
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts       # Proxy /api → :3000 en dev
│   └── tsconfig.json
├── uploads/                 # Fichiers uploadés (auto-créé)
└── README.md
```

---

## Installation locale (dev)

### Prérequis
- Node.js >= 18
- MySQL / MariaDB
- npm

### 1. Cloner

```bash
git clone <repo> monclubhouse && cd monclubhouse
```

### 2. Base de données

```sql
CREATE DATABASE monclubhouse_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'mch_user'@'localhost' IDENTIFIED BY 'mot_de_passe';
GRANT ALL PRIVILEGES ON monclubhouse_db.* TO 'mch_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Serveur

```bash
cd server
cp .env.example .env
# Renseigner DB_*, JWT_SECRET, GOOGLE_CLIENT_*
npm install
npm run migrate     # Crée les tables
npm run dev         # Démarrage nodemon :3000
```

### 4. Client

```bash
cd ../client
npm install
npm run dev         # Vite :5173, proxy → :3000
```

Ouvrir **http://localhost:5173**

---

## Déploiement Hostinger (SSH)

### Prérequis panel Hostinger
- Plan Business (Node.js activé)
- SSH activé — clé SSH configurée
- MySQL créé dans hPanel
- Domaine `monclubhouse.fr` configuré

### Étape 1 — SSH

```bash
ssh u123456789@monclubhouse.fr -p 65002
```

### Étape 2 — Uploader le code

```bash
cd ~/public_html
git clone https://github.com/VOTRE-COMPTE/monclubhouse.git .
# OU uploader via SFTP (FileZilla) les dossiers server/ et client/
```

### Étape 3 — Build frontend

```bash
cd ~/public_html/client
npm install
npm run build
# => client/dist/ contient les fichiers statiques
```

Mettre à jour `server/server.js` pour la prod (chemin dist) :
```js
// Remplacer dans server/server.js :
const CLIENT_PATH = path.join(__dirname, '..', 'client', 'dist');
```

### Étape 4 — Dépendances serveur

```bash
cd ~/public_html/server
npm install --production
cp .env.example .env
nano .env   # Renseigner toutes les variables
```

Variables critiques en production :
```env
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_NAME=uXXXXXXX_monclubhouse
DB_USER=uXXXXXXX_monclubhouse
DB_PASS=motdepasse_panel
JWT_SECRET=<64_chars_aleatoires>
JWT_REFRESH_SECRET=<64_chars_differents>
APP_URL=https://monclubhouse.fr
SOCKET_CORS_ORIGIN=https://monclubhouse.fr
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_CALLBACK_URL=https://monclubhouse.fr/auth/google/callback
```

### Étape 5 — Migrations

```bash
cd ~/public_html/server
npm run migrate
```

### Étape 6 — PM2

```bash
npm install -g pm2
pm2 start server.js --name "monclubhouse" --cwd ~/public_html/server
pm2 startup && pm2 save
```

### Étape 7 — Reverse proxy

**Via .htaccess (Apache Hostinger) :**
```apache
# ~/public_html/.htaccess
RewriteEngine On
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

**Via Nginx (si disponible) :**
```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

### Étape 8 — SSL

Panel Hostinger → **SSL** → Let's Encrypt pour `monclubhouse.fr` ✓

### Commandes PM2 utiles

```bash
pm2 status
pm2 logs monclubhouse
pm2 restart monclubhouse
pm2 stop monclubhouse
```

---

## Google OAuth

1. [console.cloud.google.com](https://console.cloud.google.com) → Nouveau projet
2. APIs & Services → Identifiants → OAuth 2.0
3. URIs de redirection autorisés :
   - `https://monclubhouse.fr/auth/google/callback`
   - `http://localhost:3000/auth/google/callback` (dev)
4. Copier **Client ID** et **Client Secret** dans `.env`

---

## API FFF

1. Demander un accès sur [api.fff.fr](https://api.fff.fr)
2. `FFF_API_KEY=xxx` dans `.env`
3. Endpoints dans `server/controllers/resultatController.js`
4. Remplaçable par Footeo ou toute autre source (architecture modulaire)

---

## Rôles RBAC

| Rôle | Accès |
|------|-------|
| `superadmin` | Accès total |
| `admin` | Gestion complète du club |
| `dirigeant` | Opérationnel (équipes, matchs, résultats) |
| `coach` | Son équipe, convocations, composition |
| `joueur` | Profil, équipe, convocations |
| `parent` | Suivi de l'enfant |
| `visiteur` | Lecture publique |

---

## Endpoints API principaux

```
POST  /api/auth/register              Inscription
POST  /api/auth/login                 Connexion JWT
POST  /api/auth/refresh               Refresh token
GET   /api/auth/google                OAuth Google (redirect)
GET   /api/auth/me                    Utilisateur courant

GET   /api/clubs                      Liste clubs
GET   /api/clubs/:id                  Détail club (terrains, équipes)
POST  /api/clubs                      Créer club [admin+]

GET   /api/equipes                    Liste équipes du club
POST  /api/equipes                    Créer équipe [dirigeant+]
GET   /api/equipes/:id                Détail + licenciés

GET   /api/matchs                     Calendrier (filtres: mois, type, statut)
POST  /api/matchs                     Créer match/entraînement [coach+]
PATCH /api/matchs/:id/score           Saisir le score [dirigeant+]

POST  /api/matchs/:id/convocations    Convoquer des joueurs [coach+]
PATCH /api/matchs/:id/reponse         Répondre à une convocation [joueur]
POST  /api/matchs/composition         Sauvegarder composition [coach+]

GET   /api/chat/channels              Canaux accessibles
GET   /api/chat/channels/:id/messages Messages d'un canal

GET   /api/resultats                  Résultats (public)
GET   /api/resultats/fff/:id/classement  Classement FFF

GET   /api/profil                     Mon profil
PUT   /api/profil                     Mettre à jour profil
GET   /api/profil/notifications       Mes notifications

GET   /api/admin/users                Gestion utilisateurs [admin+]
PATCH /api/admin/users/:id/role       Changer le rôle
```

---

## Socket.io Events

```
# Client → Serveur
join:channels         Rejoindre tous les canaux autorisés
channel:join          Rejoindre un canal spécifique
message:send          Envoyer un message { channel_id, contenu }
typing:start          Indiquer la saisie en cours
typing:stop           Arrêter l'indicateur de saisie
messages:read         Marquer les messages comme lus

# Serveur → Client
message:new           Nouveau message reçu
typing:user           Utilisateur en train d'écrire
typing:stopped        Fin de saisie
notification:new      Nouvelle notification push
channels:joined       Confirmation rejoindre canaux
```

---

## License

MIT
