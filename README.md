# Nightcord

Nightcord tourne maintenant en local comme une vraie web app full-stack sans dépendre du toolchain npm de cet environnement.

## Runtime actuel

- Front-end: HTML, CSS et JavaScript modernes servis depuis `site/`
- Back-end: serveur Python standard library dans `back-end/server.py`
- Base de données: SQLite locale dans `back-end/data/nightcord.db`
- Auth: mots de passe hashés en PBKDF2-SHA256 + sessions locales stockées en base

## Lancement local

```bash
cd /home/hiem/code-ubuntu/perso/Nightcord
python3 back-end/server.py
```

Puis ouvre `http://127.0.0.1:4173`.

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
