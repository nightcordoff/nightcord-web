# Nightcord

Nightcord tourne en local sans Docker.

## Runtime actuel

- Front-end: HTML, CSS et JavaScript modernes servis depuis `site/`
- Back-end: serveur Python standard library dans `back-end/server.py`
- Base de données: SQLite locale dans `back-end/data/nightcord.db`
- Auth: mots de passe hashés en PBKDF2-SHA256 + sessions locales stockées en base

## Lancement local

```bash
cd /home/hiem/code-ubuntu/perso/nightcord-web
python3 back-end/server.py
```

Puis ouvre `http://127.0.0.1:4173`.

