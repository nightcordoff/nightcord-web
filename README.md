# Nightcord

Nightcord contient aujourd'hui deux façons de tourner en local:

- le runtime actuel utilisé sur ce projet: site statique + serveur Python
- un front React/Vite + un back TypeScript séparés

## Commandes rapides

Depuis la racine du projet:

```bash
cd /home/hiem/code-ubuntu/perso/Nightcord
```

Avec le `Makefile`:

```bash
make front
make back
make dev
make python
make docker-up
```

Lancer le front React seulement:

```bash
npm run dev:front
```

Lancer le back TypeScript seulement:

```bash
npm run dev:back
```

Lancer le front et le back ensemble:

```bash
npm run dev
```

Ports:

- front React/Vite: `http://localhost:4173`
- back TypeScript API: `http://localhost:3001`

## Docker

Nightcord peut aussi tourner avec Docker, ce qui évite les problèmes Ubuntu/Windows sur `npm`.

Depuis la racine du projet:

```bash
cd /home/hiem/code-ubuntu/perso/Nightcord
docker-compose up --build
```

Ou avec le `Makefile`:

```bash
make docker-up
```

Ports Docker:

- front: `http://localhost:4173`
- back: `http://localhost:3001`

Arrêter les conteneurs:

```bash
docker-compose down
```

## Runtime Python actuel

- Front-end: HTML, CSS et JavaScript modernes servis depuis `site/`
- Back-end: serveur Python standard library dans `back-end/server.py`
- Base de données: SQLite locale dans `back-end/data/nightcord.db`
- Auth: mots de passe hashés en PBKDF2-SHA256 + sessions locales stockées en base

Lancer le site actuel:

```bash
cd /home/hiem/code-ubuntu/perso/Nightcord
python3 back-end/server.py
```

Puis ouvre `http://127.0.0.1:4173`.

## Installation npm

Si tu veux utiliser le front React et le back TypeScript:

```bash
cd /home/hiem/code-ubuntu/perso/Nightcord
npm install
cd front-end && npm install
cd ../back-end && npm install
```

## Problème WSL / npm Windows

Ton erreur vient du fait que WSL utilise `npm` depuis Windows au lieu d'un `npm` Linux. Chez toi, `npm` pointe vers:

```bash
/mnt/c/Program Files/nodejs/npm
```

Dans ce cas, `esbuild` et d'autres scripts cassent sur les chemins UNC `\\wsl.localhost\...`.

Vérifier:

```bash
command -v npm
```

Si le chemin commence par `/mnt/c/`, installe Node dans WSL puis relance:

```bash
sudo apt update
sudo apt install -y nodejs npm
```

Puis revérifie:

```bash
command -v npm
```

Le chemin doit être Linux, pas Windows.

## Compte précréé

- Email: `root@nightcord.local`
- Mot de passe: `NightcordRoot!2026`

Ce compte est `superadmin`, a tous les droits, peut créer d'autres comptes, leur donner les permissions d'admin et définir leur nom/titre. Change le mot de passe après le premier login.

## API disponible

- `GET /api/health`
- `GET /api/overview`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/change-password`
- `POST /api/downloads/stable`
- `POST /api/downloads/canary`
- `GET /api/admin/users`
- `POST /api/admin/users`
- `PATCH /api/admin/users/:id`

Nightcord contient aujourd'hui deux façons de tourner en local:

- le runtime actuel utilisé sur ce projet: site statique + serveur Python
- un front React/Vite + un back TypeScript séparés

## Commandes rapides

Depuis la racine du projet:

```bash
cd /home/hiem/code-ubuntu/perso/Nightcord
```

Avec le `Makefile`:

```bash
make front
make back
make dev
make python
make docker-up
```

Lancer le front React seulement:

```bash
npm run dev:front
```

Lancer le back TypeScript seulement:

```bash
npm run dev:back
```

Lancer le front et le back ensemble:

```bash
npm run dev
```

Ports:

- front React/Vite: `http://localhost:4173`
- back TypeScript API: `http://localhost:3001`

## Docker

Nightcord peut aussi tourner avec Docker, ce qui évite les problèmes Ubuntu/Windows sur `npm`.

Depuis la racine du projet:

```bash
cd /home/hiem/code-ubuntu/perso/Nightcord
docker-compose up --build
```

Ou avec le `Makefile`:

```bash
make docker-up
```

Ports Docker:

- front: `http://localhost:4173`
- back: `http://localhost:3001`

Arrêter les conteneurs:

```bash
docker-compose down
```

## Runtime Python actuel

- Front-end: HTML, CSS et JavaScript modernes servis depuis `site/`
- Back-end: serveur Python standard library dans `back-end/server.py`
- Base de données: SQLite locale dans `back-end/data/nightcord.db`
- Auth: mots de passe hashés en PBKDF2-SHA256 + sessions locales stockées en base

Lancer le site actuel:

```bash
cd /home/hiem/code-ubuntu/perso/Nightcord
python3 back-end/server.py
```

Puis ouvre `http://127.0.0.1:4173`.

## Installation npm

Si tu veux utiliser le front React et le back TypeScript:

```bash
cd /home/hiem/code-ubuntu/perso/Nightcord
npm install
cd front-end && npm install
cd ../back-end && npm install
```

## Problème WSL / npm Windows

Ton erreur vient du fait que WSL utilise `npm` depuis Windows au lieu d'un `npm` Linux. Chez toi, `npm` pointe vers:

```bash
/mnt/c/Program Files/nodejs/npm
```

Dans ce cas, `esbuild` et d'autres scripts cassent sur les chemins UNC `\\wsl.localhost\...`.

Vérifier:

```bash
command -v npm
```

Si le chemin commence par `/mnt/c/`, installe Node dans WSL puis relance:

```bash
sudo apt update
sudo apt install -y nodejs npm
```

Puis revérifie:

```bash
command -v npm
```

Le chemin doit être Linux, pas Windows.

## Compte précréé

- Email: `root@nightcord.local`
- Mot de passe: `NightcordRoot!2026`

Ce compte est `superadmin`, a tous les droits, peut créer d'autres comptes, leur donner les permissions d'admin et définir leur nom/titre. Change le mot de passe après le premier login.

## API disponible

- `GET /api/health`
- `GET /api/overview`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/change-password`
- `POST /api/downloads/stable`
- `POST /api/downloads/canary`
- `GET /api/admin/users`
- `POST /api/admin/users`
- `PATCH /api/admin/users/:id`
