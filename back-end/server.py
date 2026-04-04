from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
import sqlite3
from datetime import datetime, timedelta, timezone
from functools import partial
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib import error as urllib_error
from urllib import request as urllib_request
from urllib.parse import urlparse


ROOT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = ROOT_DIR.parent
SITE_DIR = PROJECT_DIR / "site"
DATA_DIR = ROOT_DIR / "data"
DB_PATH = DATA_DIR / "nightcord.db"
HOST = "127.0.0.1"
PORT = 4173
SESSION_DURATION_DAYS = 14
DEFAULT_SUPERADMIN_EMAIL = "root@nightcord.local"
DEFAULT_SUPERADMIN_PASSWORD = "NightcordRoot!2026"
DEFAULT_SUPERADMIN_NAME = "Nightcord Root"
DEFAULT_SUPERADMIN_TITLE = "Founder"
DISCORD_INVITE_CODE = "nightcordfr"
DISCORD_CACHE_SECONDS = 90
COMMUNITY_TEAM_CACHE_SECONDS = 300
COMMUNITY_TEAM_MEMBERS = [
    {"id": "1086802921984893038", "role": "Principal Developer", "section": "Owner", "blurb": "Core direction, product decisions, and the main Nightcord vision."},
    {"id": "417325005945176064", "role": "Co-Developer", "section": "Team", "blurb": "Build support, implementation work, and shared development across the site and client."},
]
PAGE_ROUTES = {
    "/": "/index.html",
    "/download": "/download.html",
    "/plugins": "/plugins.html",
    "/community": "/community.html",
    "/preview": "/preview.html",
    "/project": "/project.html",
    "/admin": "/admin.html",
}


SEED_METRICS = [
    ("Downloads", "1,075"),
    ("Built-in plugins", "65"),
    ("Latest release", "v1.16.6"),
    ("Core", "C rewrite"),
]

PLUGIN_COUNT = 65

SEED_FEATURES = [
    ("Voice", "AntiDeco", "Rejoins automatiquement ton salon vocal si quelqu'un te déconnecte de force.", 1),
    ("AI", "VoiceDictation", "Dicte vocalement en temps réel via Whisper et injecte directement le texte dans la barre de message.", 2),
    ("Audio", "StereoMic", "Force un vrai signal stéréo sur Discord au lieu du mono par défaut.", 3),
    ("Ghost", "GhostClient", "Gestion de comptes fantômes avec activation rapide et configuration dédiée.", 4),
]

SEED_RELEASES = [
    ("v1.16.6", "Latest Release", "Plugin system with instant enable/disable, new plugin page, 12 built-in plugins, 8 new plugins, DMs typing indicator, real-time guild text fix, sound notification loop fix, 5 custom SVG icons, and multiple UI fixes.", "March 2026", 1),
    ("v61.8", "Previous Release", "GIF background performance overhaul, stronger notification audio fallback, Amp Panel de-esser and vocal-forward filters, global DM search, and 5 bug fixes across crash, audio, UI, and build.", "March 2026", 2),
    ("v61.7", "Previous Release", "PitchProof VST2 support, APO EQ integration, Sound Feedback monitor, Ghost/Main audio routing, pinned DMs panel, resizable window, and 8 bug fixes across memory, crash, build, and performance.", "March 2026", 3),
    ("v61.6", "Previous Release", "Clickable links and Discord invites in messages, sidebar transparency fix, DM auto-sort on open, background cover mode, and compilation fixes.", "February 2026", 4),
    ("v61.5", "Major Feature Update", "DM pin categories, group DM creation, DM export, server reorder, Spotify playlist integration, background image cover mode, and bitrate/buffer defaults update.", "February 2026", 5),
]

SEED_STACK = [
    ("Native", "Rewritten from scratch in C", "Nightcord is positioned as a native Discord client with an architecture built for performance, security, and features other clients do not offer.", 1),
    ("Voice", "Raw mic pipeline", "RtAudio capture, float32 48kHz, 16-stage DSP Amp Panel, hard limiter at ±0.99, and dynamic Opus bitrate for a physically louder signal.", 2),
    ("Features", "The Best Cord. Period.", "Fake mute, stereo mic, screen and audio recorder, voice dictation, theme library, token login, mass DM, Ghost Client, and many more power-user tools.", 3),
    ("Positioning", "Not just another mod", "Nightcord is framed against Discord Stable, Ripcord, Vencord, and BetterDiscord with a focus on native performance and unique audio control.", 4),
]

SEED_DOWNLOADS = [
    ("stable", 1075),
    ("canary", 61),
]

DISCORD_COMMUNITY_CACHE: dict[str, object] = {
    "timestamp": None,
    "payload": None,
}

COMMUNITY_TEAM_CACHE: dict[str, object] = {
    "timestamp": None,
    "payload": None,
}


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def now_iso() -> str:
    return now_utc().isoformat()


def connect_db() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def make_password_hash(password: str, salt: str | None = None) -> tuple[str, str]:
    usable_salt = salt or base64.b64encode(secrets.token_bytes(16)).decode("ascii")
    derived_key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        usable_salt.encode("utf-8"),
        200_000,
    )
    password_hash = base64.b64encode(derived_key).decode("ascii")
    return password_hash, usable_salt


def verify_password(password: str, password_hash: str, password_salt: str) -> bool:
    computed_hash, _ = make_password_hash(password, password_salt)
    return hmac.compare_digest(computed_hash, password_hash)


def user_payload(row: sqlite3.Row) -> dict[str, object]:
    return {
        "id": row["id"],
        "email": row["email"],
        "display_name": row["display_name"],
        "admin_title": row["admin_title"],
        "role": row["role"],
        "can_manage_admins": bool(row["can_manage_admins"]),
        "active": bool(row["active"]),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def select_all(query: str) -> list[dict[str, str]]:
    with connect_db() as connection:
        rows = connection.execute(query).fetchall()
    return [dict(row) for row in rows]


def ensure_database() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with connect_db() as connection:
        def replace_seed_rows(table: str, columns: tuple[str, ...], rows: list[tuple[object, ...]]) -> None:
            connection.execute(f"DELETE FROM {table}")
            placeholders = ", ".join("?" for _ in columns)
            connection.executemany(
                f"INSERT INTO {table} ({', '.join(columns)}) VALUES ({placeholders})",
                rows,
            )

        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                label TEXT NOT NULL,
                value TEXT NOT NULL,
                sort_order INTEGER NOT NULL UNIQUE
            );

            CREATE TABLE IF NOT EXISTS features (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                sort_order INTEGER NOT NULL UNIQUE
            );

            CREATE TABLE IF NOT EXISTS releases (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version TEXT NOT NULL,
                title TEXT NOT NULL,
                summary TEXT NOT NULL,
                released_at TEXT NOT NULL,
                sort_order INTEGER NOT NULL UNIQUE
            );

            CREATE TABLE IF NOT EXISTS stack_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                sort_order INTEGER NOT NULL UNIQUE
            );

            CREATE TABLE IF NOT EXISTS downloads (
                channel TEXT PRIMARY KEY,
                count INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                display_name TEXT NOT NULL,
                admin_title TEXT NOT NULL DEFAULT '',
                role TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                password_salt TEXT NOT NULL,
                can_manage_admins INTEGER NOT NULL DEFAULT 0,
                active INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            """
        )

        replace_seed_rows(
            "metrics",
            ("label", "value", "sort_order"),
            [(label, value, index) for index, (label, value) in enumerate(SEED_METRICS, start=1)],
        )

        replace_seed_rows(
            "features",
            ("category", "name", "description", "sort_order"),
            SEED_FEATURES,
        )

        replace_seed_rows(
            "releases",
            ("version", "title", "summary", "released_at", "sort_order"),
            SEED_RELEASES,
        )

        replace_seed_rows(
            "stack_items",
            ("type", "name", "description", "sort_order"),
            SEED_STACK,
        )

        replace_seed_rows(
            "downloads",
            ("channel", "count"),
            SEED_DOWNLOADS,
        )

        if connection.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0:
            password_hash, password_salt = make_password_hash(DEFAULT_SUPERADMIN_PASSWORD)
            timestamp = now_iso()
            connection.execute(
                """
                INSERT INTO users (
                    email,
                    display_name,
                    admin_title,
                    role,
                    password_hash,
                    password_salt,
                    can_manage_admins,
                    active,
                    created_at,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    DEFAULT_SUPERADMIN_EMAIL,
                    DEFAULT_SUPERADMIN_NAME,
                    DEFAULT_SUPERADMIN_TITLE,
                    "superadmin",
                    password_hash,
                    password_salt,
                    1,
                    1,
                    timestamp,
                    timestamp,
                ),
            )


def get_downloads() -> dict[str, int]:
    with connect_db() as connection:
        rows = connection.execute("SELECT channel, count FROM downloads ORDER BY channel").fetchall()
    return {row["channel"]: row["count"] for row in rows}


def build_overview() -> dict[str, object]:
    with connect_db() as connection:
        admin_count = connection.execute(
            "SELECT COUNT(*) FROM users WHERE active = 1 AND role IN ('admin', 'superadmin')"
        ).fetchone()[0]

    return {
        "brand": "Nightcord",
        "version": "v1.16.6",
        "runtime": "Python + SQLite",
        "hero": {
            "eyebrow": "A Discord client packed with powerful features Discord never gave you.",
            "title": "Nightcord",
            "subtitle": "Native-first ambition, aggressive audio tooling, plugin power, and a feature set built for people who always hit Discord's limits.",
        },
        "database": {
            "engine": "SQLite",
            "location": str(DB_PATH.relative_to(PROJECT_DIR)),
        },
        "downloads": get_downloads(),
        "plugin_count": PLUGIN_COUNT,
        "metrics": select_all("SELECT label, value FROM metrics ORDER BY sort_order"),
        "features": select_all("SELECT category, name, description FROM features ORDER BY sort_order"),
        "releases": select_all("SELECT version, title, summary, released_at FROM releases ORDER BY sort_order"),
        "stack": select_all("SELECT type, name, description FROM stack_items ORDER BY sort_order"),
        "auth": {
            "default_superadmin": {
                "email": DEFAULT_SUPERADMIN_EMAIL,
                "password": DEFAULT_SUPERADMIN_PASSWORD,
            },
            "admin_count": admin_count,
        },
    }


def increment_download(channel: str) -> dict[str, int]:
    with connect_db() as connection:
        cursor = connection.execute(
            "UPDATE downloads SET count = count + 1 WHERE channel = ?",
            (channel,),
        )
        if cursor.rowcount == 0:
            raise KeyError(channel)
    return get_downloads()


def fetch_remote_json(url: str) -> dict[str, object]:
    request = urllib_request.Request(
        url,
        headers={
            "User-Agent": "Nightcord/1.0",
            "Accept": "application/json",
        },
    )
    with urllib_request.urlopen(request, timeout=4) as response:
        return json.loads(response.read().decode("utf-8"))


def get_public_discord_user(user_id: str) -> dict[str, object]:
    payload = fetch_remote_json(f"https://japi.rest/discord/v1/user/{user_id}")
    data = payload.get("data") if isinstance(payload.get("data"), dict) else {}
    presence = payload.get("presence") if isinstance(payload.get("presence"), dict) else {}
    status = str(presence.get("discord_status") or "offline")

    return {
        "id": user_id,
        "username": str(data.get("username") or user_id),
        "global_name": str(data.get("global_name") or data.get("username") or user_id),
        "avatar_url": data.get("avatarURL") or data.get("defaultAvatarURL"),
        "banner_url": data.get("bannerURL"),
        "status": status,
        "tag": str(data.get("tag") or data.get("username") or user_id),
    }


def get_community_team_data() -> dict[str, object]:
    cached_payload = COMMUNITY_TEAM_CACHE.get("payload")
    cached_timestamp = COMMUNITY_TEAM_CACHE.get("timestamp")
    if isinstance(cached_payload, dict) and isinstance(cached_timestamp, datetime):
        if now_utc() - cached_timestamp < timedelta(seconds=COMMUNITY_TEAM_CACHE_SECONDS):
            return cached_payload

    members = []
    for member in COMMUNITY_TEAM_MEMBERS:
        try:
            profile = get_public_discord_user(str(member["id"]))
        except (urllib_error.URLError, urllib_error.HTTPError, TimeoutError, json.JSONDecodeError, ValueError):
            profile = {
                "id": str(member["id"]),
                "username": str(member["id"]),
                "global_name": str(member["id"]),
                "avatar_url": f"https://cdn.discordapp.com/embed/avatars/{int(str(member['id'])) % 5}.png",
                "banner_url": None,
                "status": "offline",
                "tag": str(member["id"]),
            }

        profile.update(
            {
                "role": member["role"],
                "section": member["section"],
                "blurb": member["blurb"],
            }
        )
        members.append(profile)

    payload = {
        "title": "Meet the Team",
        "subtitle": "The people building Nightcord right now.",
        "members": members,
        "last_synced": now_iso(),
    }
    COMMUNITY_TEAM_CACHE["timestamp"] = now_utc()
    COMMUNITY_TEAM_CACHE["payload"] = payload
    return payload


def build_discord_icon_url(guild_id: str, icon_hash: str | None) -> str | None:
    if not guild_id or not icon_hash:
        return None
    return f"https://cdn.discordapp.com/icons/{guild_id}/{icon_hash}.png?size=256"


def get_discord_community_data() -> dict[str, object]:
    cached_payload = DISCORD_COMMUNITY_CACHE.get("payload")
    cached_timestamp = DISCORD_COMMUNITY_CACHE.get("timestamp")
    if isinstance(cached_payload, dict) and isinstance(cached_timestamp, datetime):
        if now_utc() - cached_timestamp < timedelta(seconds=DISCORD_CACHE_SECONDS):
            return cached_payload

    invite_url = f"https://discord.gg/{DISCORD_INVITE_CODE}"
    payload: dict[str, object] = {
        "server_name": "Nightcord",
        "invite_code": DISCORD_INVITE_CODE,
        "invite_url": invite_url,
        "icon_url": None,
        "description": "Join the Nightcord Discord server.",
        "member_count": None,
        "online_count": None,
        "source": "invite",
        "hierarchy": [],
        "members": [],
        "widget_enabled": False,
        "entry_channel": None,
        "last_synced": now_iso(),
    }

    try:
        invite = fetch_remote_json(
            f"https://discord.com/api/v9/invites/{DISCORD_INVITE_CODE}?with_counts=true&with_expiration=true"
        )
        guild = invite.get("guild") if isinstance(invite.get("guild"), dict) else {}
        guild_id = str(guild.get("id", ""))
        payload.update(
            {
                "server_name": str(guild.get("name") or payload["server_name"]),
                "description": str(guild.get("description") or payload["description"]),
                "member_count": invite.get("approximate_member_count"),
                "online_count": invite.get("approximate_presence_count"),
                "icon_url": build_discord_icon_url(guild_id, guild.get("icon")),
                "entry_channel": invite.get("channel", {}).get("name") if isinstance(invite.get("channel"), dict) else None,
                "last_synced": now_iso(),
            }
        )

        if guild_id:
            try:
                widget = fetch_remote_json(f"https://discord.com/api/guilds/{guild_id}/widget.json")
                channels = widget.get("channels") if isinstance(widget.get("channels"), list) else []
                members = widget.get("members") if isinstance(widget.get("members"), list) else []
                payload.update(
                    {
                        "source": "widget",
                        "widget_enabled": True,
                        "online_count": widget.get("presence_count") or payload["online_count"],
                        "invite_url": str(widget.get("instant_invite") or invite_url),
                        "hierarchy": [
                            {
                                "name": str(channel.get("name", "Unnamed channel")),
                                "position": int(channel.get("position", 0)),
                            }
                            for channel in sorted(channels, key=lambda item: int(item.get("position", 0)))[:8]
                        ],
                        "members": [
                            {
                                "username": str(member.get("username", "Unknown")),
                                "status": str(member.get("status", "offline")),
                                "avatar_url": member.get("avatar_url"),
                            }
                            for member in members[:10]
                        ],
                        "last_synced": now_iso(),
                    }
                )
            except (urllib_error.URLError, urllib_error.HTTPError, TimeoutError, json.JSONDecodeError, ValueError):
                pass
    except (urllib_error.URLError, urllib_error.HTTPError, TimeoutError, json.JSONDecodeError, ValueError):
        pass

    if not payload["hierarchy"]:
        hierarchy = []
        entry_channel = payload.get("entry_channel")
        if isinstance(entry_channel, str) and entry_channel:
            hierarchy.append({"name": entry_channel, "position": 0})
        hierarchy.extend(
            [
                {"name": "announcements", "position": 1},
                {"name": "support", "position": 2},
                {"name": "nightcord-talk", "position": 3},
                {"name": "soundcord", "position": 4},
            ]
        )
        payload["hierarchy"] = hierarchy

    DISCORD_COMMUNITY_CACHE["timestamp"] = now_utc()
    DISCORD_COMMUNITY_CACHE["payload"] = payload
    return payload


def create_session(user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    created_at = now_utc()
    expires_at = created_at + timedelta(days=SESSION_DURATION_DAYS)
    with connect_db() as connection:
        connection.execute(
            "INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
            (token, user_id, created_at.isoformat(), expires_at.isoformat()),
        )
    return token


def cleanup_expired_sessions() -> None:
    with connect_db() as connection:
        connection.execute("DELETE FROM sessions WHERE expires_at <= ?", (now_iso(),))


def get_user_by_email(email: str) -> sqlite3.Row | None:
    with connect_db() as connection:
        return connection.execute(
            "SELECT * FROM users WHERE lower(email) = lower(?)",
            (email,),
        ).fetchone()


def get_session_user(token: str) -> sqlite3.Row | None:
    cleanup_expired_sessions()
    with connect_db() as connection:
        return connection.execute(
            """
            SELECT users.*
            FROM sessions
            JOIN users ON users.id = sessions.user_id
            WHERE sessions.token = ? AND users.active = 1
            """,
            (token,),
        ).fetchone()


def list_admin_users() -> list[dict[str, object]]:
    with connect_db() as connection:
        rows = connection.execute("SELECT * FROM users ORDER BY role DESC, created_at ASC").fetchall()
    return [user_payload(row) for row in rows]


def create_user_account(payload: dict[str, object]) -> dict[str, object]:
    email = str(payload.get("email", "")).strip().lower()
    display_name = str(payload.get("display_name", "")).strip()
    admin_title = str(payload.get("admin_title", "")).strip()
    password = str(payload.get("password", ""))
    role = str(payload.get("role", "admin")).strip().lower()
    can_manage_admins = 1 if payload.get("can_manage_admins") else 0

    if not email or "@" not in email:
        raise ValueError("A valid email is required.")
    if len(display_name) < 2:
        raise ValueError("Display name must contain at least 2 characters.")
    if len(password) < 10:
        raise ValueError("Password must contain at least 10 characters.")
    if role not in {"admin", "superadmin", "viewer"}:
        raise ValueError("Role must be admin, superadmin, or viewer.")

    password_hash, password_salt = make_password_hash(password)
    timestamp = now_iso()

    with connect_db() as connection:
        cursor = connection.execute(
            """
            INSERT INTO users (
                email,
                display_name,
                admin_title,
                role,
                password_hash,
                password_salt,
                can_manage_admins,
                active,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                email,
                display_name,
                admin_title,
                role,
                password_hash,
                password_salt,
                can_manage_admins,
                1,
                timestamp,
                timestamp,
            ),
        )
        row = connection.execute("SELECT * FROM users WHERE id = ?", (cursor.lastrowid,)).fetchone()

    return user_payload(row)


def update_user_account(user_id: int, payload: dict[str, object]) -> dict[str, object]:
    with connect_db() as connection:
        existing = connection.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if existing is None:
            raise KeyError(user_id)

        display_name = str(payload.get("display_name", existing["display_name"])).strip()
        admin_title = str(payload.get("admin_title", existing["admin_title"])).strip()
        role = str(payload.get("role", existing["role"])).strip().lower()
        can_manage_admins = 1 if payload.get("can_manage_admins", bool(existing["can_manage_admins"])) else 0
        active = 1 if payload.get("active", bool(existing["active"])) else 0

        if len(display_name) < 2:
            raise ValueError("Display name must contain at least 2 characters.")
        if role not in {"admin", "superadmin", "viewer"}:
            raise ValueError("Role must be admin, superadmin, or viewer.")

        connection.execute(
            """
            UPDATE users
            SET display_name = ?,
                admin_title = ?,
                role = ?,
                can_manage_admins = ?,
                active = ?,
                updated_at = ?
            WHERE id = ?
            """,
            (display_name, admin_title, role, can_manage_admins, active, now_iso(), user_id),
        )
        row = connection.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()

    return user_payload(row)


class NightcordHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, directory: str | None = None, **kwargs):
        super().__init__(*args, directory=directory, **kwargs)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/health":
            self.respond_json(HTTPStatus.OK, {"status": "online", "database": str(DB_PATH.relative_to(PROJECT_DIR))})
            return

        if parsed.path == "/api/overview":
            self.respond_json(HTTPStatus.OK, build_overview())
            return

        if parsed.path == "/api/community/discord":
            self.respond_json(HTTPStatus.OK, get_discord_community_data())
            return

        if parsed.path == "/api/community/team":
            self.respond_json(HTTPStatus.OK, get_community_team_data())
            return

        if parsed.path == "/api/auth/me":
            user = self.require_authenticated_user()
            if user is None:
                return
            self.respond_json(HTTPStatus.OK, {"user": user_payload(user)})
            return

        if parsed.path == "/api/admin/users":
            user = self.require_admin_manager()
            if user is None:
                return
            self.respond_json(HTTPStatus.OK, {"users": list_admin_users(), "actor": user_payload(user)})
            return

        if parsed.path.startswith("/api/"):
            self.respond_json(HTTPStatus.NOT_FOUND, {"error": "Unknown API route"})
            return

        if parsed.path in PAGE_ROUTES:
            self.path = PAGE_ROUTES[parsed.path]
        elif not (SITE_DIR / parsed.path.lstrip("/")).exists():
            self.path = "/index.html"
        super().do_GET()

    def do_POST(self) -> None:
        parsed = urlparse(self.path)

        if parsed.path.startswith("/api/downloads/"):
            channel = parsed.path.rsplit("/", 1)[-1]
            try:
                downloads = increment_download(channel)
            except KeyError:
                self.respond_json(HTTPStatus.NOT_FOUND, {"error": "Unknown download channel"})
                return
            self.respond_json(HTTPStatus.OK, {"downloads": downloads})
            return

        if parsed.path == "/api/auth/login":
            payload = self.read_json_body()
            if payload is None:
                return
            email = str(payload.get("email", "")).strip().lower()
            password = str(payload.get("password", ""))
            user = get_user_by_email(email)
            if user is None or not bool(user["active"]) or not verify_password(password, user["password_hash"], user["password_salt"]):
                self.respond_json(HTTPStatus.UNAUTHORIZED, {"error": "Invalid credentials"})
                return
            token = create_session(int(user["id"]))
            self.respond_json(HTTPStatus.OK, {"token": token, "user": user_payload(user)})
            return

        if parsed.path == "/api/auth/logout":
            token = self.get_session_token()
            if token:
                with connect_db() as connection:
                    connection.execute("DELETE FROM sessions WHERE token = ?", (token,))
            self.respond_json(HTTPStatus.OK, {"ok": True})
            return

        if parsed.path == "/api/auth/change-password":
            user = self.require_authenticated_user()
            if user is None:
                return
            payload = self.read_json_body()
            if payload is None:
                return
            current_password = str(payload.get("current_password", ""))
            new_password = str(payload.get("new_password", ""))
            if not verify_password(current_password, user["password_hash"], user["password_salt"]):
                self.respond_json(HTTPStatus.UNAUTHORIZED, {"error": "Current password is incorrect"})
                return
            if len(new_password) < 10:
                self.respond_json(HTTPStatus.BAD_REQUEST, {"error": "New password must contain at least 10 characters"})
                return
            password_hash, password_salt = make_password_hash(new_password)
            with connect_db() as connection:
                connection.execute(
                    "UPDATE users SET password_hash = ?, password_salt = ?, updated_at = ? WHERE id = ?",
                    (password_hash, password_salt, now_iso(), user["id"]),
                )
            self.respond_json(HTTPStatus.OK, {"ok": True})
            return

        if parsed.path == "/api/admin/users":
            manager = self.require_admin_manager()
            if manager is None:
                return
            payload = self.read_json_body()
            if payload is None:
                return
            try:
                created = create_user_account(payload)
            except sqlite3.IntegrityError:
                self.respond_json(HTTPStatus.CONFLICT, {"error": "Email already exists"})
                return
            except ValueError as error:
                self.respond_json(HTTPStatus.BAD_REQUEST, {"error": str(error)})
                return
            self.respond_json(HTTPStatus.CREATED, {"user": created})
            return

        self.respond_json(HTTPStatus.NOT_FOUND, {"error": "Unknown API route"})

    def do_PATCH(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/admin/users/"):
            manager = self.require_admin_manager()
            if manager is None:
                return
            payload = self.read_json_body()
            if payload is None:
                return
            try:
                user_id = int(parsed.path.rsplit("/", 1)[-1])
                updated = update_user_account(user_id, payload)
            except ValueError as error:
                self.respond_json(HTTPStatus.BAD_REQUEST, {"error": str(error)})
                return
            except KeyError:
                self.respond_json(HTTPStatus.NOT_FOUND, {"error": "User not found"})
                return
            self.respond_json(HTTPStatus.OK, {"user": updated})
            return

        self.respond_json(HTTPStatus.NOT_FOUND, {"error": "Unknown API route"})

    def log_message(self, format: str, *args) -> None:
        return

    def get_session_token(self) -> str | None:
        authorization = self.headers.get("Authorization", "")
        if authorization.startswith("Bearer "):
            return authorization.removeprefix("Bearer ").strip()
        return self.headers.get("X-Session-Token")

    def require_authenticated_user(self) -> sqlite3.Row | None:
        token = self.get_session_token()
        if not token:
            self.respond_json(HTTPStatus.UNAUTHORIZED, {"error": "Authentication required"})
            return None
        user = get_session_user(token)
        if user is None:
            self.respond_json(HTTPStatus.UNAUTHORIZED, {"error": "Invalid or expired session"})
            return None
        return user

    def require_admin_manager(self) -> sqlite3.Row | None:
        user = self.require_authenticated_user()
        if user is None:
            return None
        if not bool(user["can_manage_admins"]):
            self.respond_json(HTTPStatus.FORBIDDEN, {"error": "Admin management permission required"})
            return None
        return user

    def read_json_body(self) -> dict[str, object] | None:
        content_length = int(self.headers.get("Content-Length", "0") or "0")
        raw_body = self.rfile.read(content_length) if content_length > 0 else b"{}"
        try:
            data = json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError:
            self.respond_json(HTTPStatus.BAD_REQUEST, {"error": "Invalid JSON body"})
            return None
        if not isinstance(data, dict):
            self.respond_json(HTTPStatus.BAD_REQUEST, {"error": "JSON body must be an object"})
            return None
        return data

    def respond_json(self, status: HTTPStatus, payload: dict[str, object]) -> None:
        body = json.dumps(payload, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main() -> None:
    ensure_database()
    handler = partial(NightcordHandler, directory=str(SITE_DIR))
    server = ThreadingHTTPServer((HOST, PORT), handler)
    print(f"Nightcord full-stack app running at http://{HOST}:{PORT}")
    print(f"SQLite database: {DB_PATH}")
    print(f"Seeded superadmin: {DEFAULT_SUPERADMIN_EMAIL} / {DEFAULT_SUPERADMIN_PASSWORD}")
    server.serve_forever()


if __name__ == "__main__":
    main()