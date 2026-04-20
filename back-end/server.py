from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
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


def load_env_file(env_path: Path) -> None:
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")

        if key and key not in os.environ:
            os.environ[key] = value


load_env_file(PROJECT_DIR / ".env")

HOST = "0.0.0.0"
PORT = int(os.environ.get("PORT", 4173))
SESSION_DURATION_DAYS = 14
DEFAULT_SUPERADMIN_EMAIL = "root@nightcord.local"
DEFAULT_SUPERADMIN_PASSWORD = "NightcordRoot!2026"
DEFAULT_SUPERADMIN_NAME = "Nightcord Root"
DEFAULT_SUPERADMIN_TITLE = "Founder"
DISCORD_INVITE_CODE = "nightcordfr"
DISCORD_BOT_TOKEN = os.environ.get("DISCORD_BOT_TOKEN", "")
DISCORD_GUILD_ID = "1477103987282022481"
DISCORD_CACHE_SECONDS = 90
COMMUNITY_TEAM_CACHE_SECONDS = 300
GITHUB_USER_CACHE_SECONDS = 3600
COMMUNITY_TEAM_MEMBERS = [
    {"id": "1086802921984893038", "role": "Owner", "section": "Owner", "blurb": "Core direction, product decisions, and the main Nightcord vision."},
    {"id": "1172305545554825259", "role": "Co-Owner", "section": "Owner", "blurb": "Co-ownership and strategic decisions alongside the principal developer."},
    {"id": "417325005945176064", "role": "Developer", "section": "Team", "blurb": "Lead web development across the Nightcord site and client surfaces."},
    {"id": "407134577748869122", "role": "Developer", "section": "Team", "blurb": "Development and feature contributions to Nightcord."},
    {"id": "587626543874834463", "role": "Developer & Developer BOT", "section": "Team", "blurb": "Bot development and automation tooling for Nightcord."},
    {"id": "1356682833954996376", "role": "Developer Sécurité", "section": "Team", "blurb": "Security auditing and hardening across the Nightcord ecosystem."},
    {"id": "1463560204259164404", "role": "Moderator", "section": "Moderation", "blurb": "Server moderation and community safety."},
    {"id": "1039978099548377088", "role": "Moderator", "section": "Moderation", "blurb": "Server moderation and community safety."},
    {"id": "1467485804833275974", "role": "Moderator", "section": "Moderation", "blurb": "Server moderation and community safety."},
    {"id": "1487862786083127429", "role": "Developer", "section": "Team", "blurb": "Development and feature contributions to Nightcord."},
    {"id": "1477349706450604135", "role": "Developer", "section": "Team", "blurb": "Development and feature contributions to Nightcord."},
    {"id": "853703614656806922", "role": "Helper", "section": "Helper", "blurb": "Community support and user assistance."},
    {"id": "1214655422980423731", "role": "Helper", "section": "Helper", "blurb": "Community support and user assistance."},
    {"id": "1480844053754155028", "role": "Helper", "section": "Helper", "blurb": "Community support and user assistance."},
    {"id": "910153578377797662", "role": "Helper", "section": "Helper", "blurb": "Community support and user assistance."},
    {"id": "156817624892702720", "role": "Contributor", "section": "Contributor", "blurb": "Open-source contributions to Nightcord."},
    {"id": "119359281173626882", "role": "Contributor", "section": "Contributor", "blurb": "Open-source contributions to Nightcord."},
    {"id": "1483111868980531240", "role": "Contributor", "section": "Contributor", "blurb": "Open-source contributions to Nightcord."},
    {"id": "1006980582212907048", "role": "Contributor", "section": "Contributor", "blurb": "Open-source contributions to Nightcord."},
    {"id": "834125824038010881", "role": "Contributor", "section": "Contributor", "blurb": "Open-source contributions to Nightcord."},
    {"id": "1386034334980509706", "role": "Contributor", "section": "Contributor", "blurb": "Open-source contributions to Nightcord."},
    {"id": "1447226822294114444", "role": "Contributor", "section": "Contributor", "blurb": "Open-source contributions to Nightcord."},
    {"id": "1303838137554042894", "role": "Contributor", "section": "Contributor", "blurb": "Open-source contributions to Nightcord."},
    {"id": "694964595672219778", "role": "Contributor", "section": "Contributor", "blurb": "Open-source contributions to Nightcord."},
    {"id": "889101384287395860", "role": "Contributor", "section": "Contributor", "blurb": "Open-source contributions to Nightcord."},
    {"id": "1447999207834386533", "role": "Contributor", "section": "Contributor", "blurb": "Open-source contributions to Nightcord."},
    {"id": "1405562159622131914", "role": "Contributor", "section": "Contributor", "blurb": "Open-source contributions to Nightcord."},
    {"id": "1479593008965091488", "role": "Contributor", "section": "Contributor", "blurb": "Open-source contributions to Nightcord."},
    {"id": "223603822927282187", "role": "Contributor", "section": "Contributor", "blurb": "Open-source contributions to Nightcord."},
    {"id": "1187007193074110506", "role": "Contributor", "section": "Contributor", "blurb": "Open-source contributions to Nightcord."},
    {"id": "1467485804833275974", "role": "Contributor", "section": "Contributor", "blurb": "Open-source contributions to Nightcord."},
    {"id": "1341130103203041302", "role": "Contributor", "section": "Contributor", "blurb": "Open-source contributions to Nightcord."},
    {"id": "1256361101961199666", "role": "Contributor", "section": "Contributor", "blurb": "Open-source contributions to Nightcord."},
    {"id": "1001474370608300203", "role": "Contributor", "section": "Contributor", "blurb": "Open-source contributions to Nightcord."},
    {"id": "208717356267077633", "role": "Contributor", "section": "Contributor", "blurb": "Open-source contributions to Nightcord."},
    {"id": "1051849204856799382", "role": "Contributor", "section": "Contributor", "blurb": "Open-source contributions to Nightcord."},
    {"id": "1445077438328602634", "role": "Contributor", "section": "Contributor", "blurb": "Open-source contributions to Nightcord."},
    {"id": "1163470989439553537", "role": "Contributor", "section": "Contributor", "blurb": "Open-source contributions to Nightcord."},
    {"id": "1473738171811365020", "role": "Contributor", "section": "Contributor", "blurb": "Open-source contributions to Nightcord."},
    # Contributors only on GitHub (no Discord ID required — set id to None or omit)
    # Example: {"id": None, "github": "octocat", "role": "Contributor", "section": "Contributor", "blurb": "Open-source contributions to Nightcord."},
]
PAGE_ROUTES = {
    "/": "/index.html",
    "/download": "/download.html",
    "/plugins": "/plugins.html",
    "/community": "/community.html",
    "/themes": "/themes.html",
    "/project": "/project.html",
    "/admin": "/admin.html",
}


SEED_METRICS = [
    ("Downloads", "1,075"),
    ("Built-in plugins", "103"),
    ("Latest release", "v1.17.0"),
    ("Core", "C rewrite"),
]

PLUGIN_COUNT = 103

SEED_FEATURES = [
    ("Voice", "AntiDeco", "Rejoins automatiquement ton salon vocal si quelqu'un te déconnecte de force.", 1),
    ("AI", "VoiceDictation", "Dicte vocalement en temps réel via Whisper et injecte directement le texte dans la barre de message.", 2),
    ("Audio", "StereoMic", "Force un vrai signal stéréo sur Discord au lieu du mono par défaut.", 3),
    ("Ghost", "GhostClient", "Gestion de comptes fantômes avec activation rapide et configuration dédiée.", 4),
]

SEED_RELEASES = [
    ("v1.17.0", "Major Version Update", "Added SharePerms Manager (Advanced remote permission sharing). Added AutoResponder AI. Unified AntiMove and AntiDeco into AntiMoveDeco. Massive plugin library expansion (100+ plugins). Fixed DM encription and UI scaling for high-DPI displays. Optimized plugin loading speed.", "April 2026", 1),
    ("v1.16.9", "Stability Update", "Fixed random crashes on startup. Improved voice quality in low-bandwidth conditions. Optimized memory usage for long sessions. Fixed UI glitches in Theme Library. Minor bug fixes and performance improvements.", "April 2026", 2),
    ("v1.16.8", "Latest Release", "Fixed Plugins FakePerm, Ghost Account, VB Virtual Cable, MassDM, Logs, SoundCordPlayer, CursormacOS, Activity Spoofer. Fixed Theme Library, AutoUpdate, Overlay Discord. Reduced lags and improved performance. Added ShowHiddenChannels, DMbomb, Badge NightCord System.", "April 2026", 3),
    ("v1.16.7", "Previous Release", "Fixed ScreenSharing Loading, Load NightCord/Discord Stable, AutoActive Plugins, Stealth Mode. Added BackPack Plugins.", "April 2026", 4),
    ("v1.16.6", "Previous Release", "Fixed Plugins VoiceDictation, StreamProof, AddFakeSwitcher, AutoCorrect. Added Abreviation, ActivitySpoofer, LiveWallpaper, ChannelWallpaper, ClonnerServer, SelfDestruct Plugins.", "April 2026", 5),
    ("v1.16.5", "Previous Release", "Fixed Plugins FakePerm, VideoRecorder, AutoTranslate, Ghost Client. Reduced lags and improved performance. Added StreamProof, Translucence Plugins.", "April 2026", 6),
    ("v1.16.4", "Previous Release", "Fixed Videos Tutorial, Ghost Client Plugins, CustomProfil Plugins. Added StealthMode Button, DEV Team Page, DoubleCall Plugins, Dark Chat AI Button.", "April 2026", 7),
    ("v1.16.3", "Major Feature Update", "Fixed Channel invisible, CustomProfil, Stream loading, AutoUpdate. Reduced lags and improved performance. Added EncryptedMessage, MuteAllServer, VB-Audio, AudioLimiter Plugins, Tutorial Videos on Plugins, CursorMac OS.", "March 2026", 8),
    ("v1.16.2", "Previous Release", "Fixed Plugins FakePerm, display issues with channels. Reduced lags and improved performance. Added PlatformIndicators Plugins, AutoUpdate System.", "March 2026", 9),
    ("v1.16.1", "Previous Release", "Fixed issues with screen sharing, display issues with channels. Reduced lags and improved performance.", "March 2026", 10),
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
    ("linux", 0),
]

DISCORD_COMMUNITY_CACHE: dict[str, object] = {
    "timestamp": None,
    "payload": None,
}

COMMUNITY_TEAM_CACHE: dict[str, object] = {
    "timestamp": None,
    "payload": None,
}

GITHUB_USER_CACHE: dict[str, dict] = {}
GITHUB_RELEASE_CACHE: dict[str, object] = {"tag": None, "fetched_at": None}
GITHUB_RELEASE_CACHE_SECONDS = 300
GITHUB_RELEASE_REPO = "nightcordoff/nightcordclient-releases"

EQUICORD_THEMES_CACHE: dict[str, object] = {"data": None, "fetched_at": None}
EQUICORD_THEMES_CACHE_SECONDS = 600


def fetch_github_latest_tag() -> str:
    cached_tag = GITHUB_RELEASE_CACHE.get("tag")
    fetched_at = GITHUB_RELEASE_CACHE.get("fetched_at")
    if cached_tag and fetched_at and now_utc() - fetched_at < timedelta(seconds=GITHUB_RELEASE_CACHE_SECONDS):
        return cached_tag
    try:
        data = fetch_remote_json(f"https://api.github.com/repos/{GITHUB_RELEASE_REPO}/releases/latest")
        tag = str(data.get("tag_name") or "")
        if tag:
            GITHUB_RELEASE_CACHE["tag"] = tag
            GITHUB_RELEASE_CACHE["fetched_at"] = now_utc()
            return tag
    except Exception as exc:
        print(f"Could not fetch GitHub latest release: {exc}")
    fallback = cached_tag or "v1.18"
    return fallback


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def fetch_equicord_themes() -> list:
    cached = EQUICORD_THEMES_CACHE.get("data")
    fetched_at = EQUICORD_THEMES_CACHE.get("fetched_at")
    if cached is not None and fetched_at and now_utc() - fetched_at < timedelta(seconds=EQUICORD_THEMES_CACHE_SECONDS):
        return cached
    try:
        data = fetch_remote_json("https://api.themes.equicord.org/themes")
        if isinstance(data, list):
            EQUICORD_THEMES_CACHE["data"] = data
            EQUICORD_THEMES_CACHE["fetched_at"] = now_utc()
            return data
    except Exception as exc:
        print(f"Could not fetch Equicord themes: {exc}")
    return cached if cached is not None else []


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
    return {
        "brand": "Nightcord",
        "version": fetch_github_latest_tag(),
        "github_release_url": f"https://github.com/{GITHUB_RELEASE_REPO}/releases/latest",
        "runtime": "Python + SQLite",
        "hero": {
            "eyebrow": "A Discord client packed with powerful features Discord never gave you.",
            "title": "Nightcord",
            "subtitle": "Everything Discord doesn't build, we create.",
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


def discord_bot_request(method: str, endpoint: str, body: dict | None = None) -> dict:
    url = f"https://discord.com/api/v10{endpoint}"
    data = json.dumps(body).encode("utf-8") if body else None
    request = urllib_request.Request(
        url,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bot {DISCORD_BOT_TOKEN}",
            "User-Agent": "Nightcord/1.0",
            "Content-Type": "application/json",
        },
    )
    with urllib_request.urlopen(request, timeout=8) as response:
        raw = response.read().decode("utf-8")
        return json.loads(raw) if raw.strip() else {}


def enable_discord_widget() -> None:
    try:
        discord_bot_request("PATCH", f"/guilds/{DISCORD_GUILD_ID}/widget", {"enabled": True, "channel_id": None})
        print("Discord widget enabled successfully.")
    except Exception as exc:
        print(f"Could not enable Discord widget: {exc}")


def fetch_guild_presences() -> list[dict]:
    try:
        members_data = discord_bot_request("GET", f"/guilds/{DISCORD_GUILD_ID}/members?limit=100")
        if not isinstance(members_data, list):
            return []
        result = []
        for m in members_data:
            user = m.get("user", {})
            uid = str(user.get("id", ""))
            result.append({
                "id": uid,
                "username": str(user.get("username", "")),
                "global_name": str(user.get("global_name") or user.get("username", "")),
                "avatar_url": f"https://cdn.discordapp.com/avatars/{uid}/{user['avatar']}.png" if user.get("avatar") else f"https://cdn.discordapp.com/embed/avatars/{int(uid or '0') % 5}.png",
            })
        return result
    except Exception as exc:
        print(f"Could not fetch guild members: {exc}")
        return []


def get_public_discord_user(user_id: str) -> dict[str, object]:
    payload = fetch_remote_json(f"https://japi.rest/discord/v1/user/{user_id}")
    data = payload.get("data") if isinstance(payload.get("data"), dict) else {}
    presence = payload.get("presence") if isinstance(payload.get("presence"), dict) else {}
    activities = presence.get("activities")
    custom_status = ""
    activity_name = ""
    if isinstance(activities, list):
        for act in activities:
            if isinstance(act, dict):
                if act.get("type") == 4 and act.get("state"):
                    custom_status = str(act["state"])
                elif act.get("name"):
                    activity_name = str(act["name"])
    status = str(presence.get("status") or presence.get("discord_status") or "offline")

    return {
        "id": user_id,
        "username": str(data.get("username") or user_id),
        "global_name": str(data.get("global_name") or data.get("username") or user_id),
        "avatar_url": data.get("avatarURL") or data.get("defaultAvatarURL"),
        "avatar_decoration_url": None,
        "banner_url": data.get("bannerURL"),
        "status": status,
        "custom_status": custom_status,
        "activity": activity_name,
        "tag": str(data.get("tag") or data.get("username") or user_id),
    }


def fetch_github_user(username: str) -> dict[str, object] | None:
    cached = GITHUB_USER_CACHE.get(username)
    if cached and now_utc() - cached["_fetched_at"] < timedelta(seconds=GITHUB_USER_CACHE_SECONDS):
        return cached
    try:
        data = fetch_remote_json(f"https://api.github.com/users/{username}")
        if not isinstance(data, dict) or not data.get("login"):
            return None
        result = {
            "username": str(data.get("login") or username),
            "global_name": str(data.get("name") or data.get("login") or username),
            "avatar_url": str(data.get("avatar_url") or ""),
            "html_url": str(data.get("html_url") or f"https://github.com/{username}"),
            "_fetched_at": now_utc(),
        }
        GITHUB_USER_CACHE[username] = result
        return result
    except Exception as exc:
        print(f"Could not fetch GitHub user {username}: {exc}")
        return None


def build_avatar_decoration_url(avatar_decoration_data: object) -> str | None:
    if not isinstance(avatar_decoration_data, dict):
        return None

    asset = str(avatar_decoration_data.get("asset") or "").strip()
    if not asset:
        return None

    return f"https://cdn.discordapp.com/avatar-decoration-presets/{asset}.png?size=160&passthrough=true"


def get_community_team_data() -> dict[str, object]:
    cached_payload = COMMUNITY_TEAM_CACHE.get("payload")
    cached_timestamp = COMMUNITY_TEAM_CACHE.get("timestamp")
    if isinstance(cached_payload, dict) and isinstance(cached_timestamp, datetime):
        if now_utc() - cached_timestamp < timedelta(seconds=COMMUNITY_TEAM_CACHE_SECONDS):
            return cached_payload

    # Batch fetch all guild members at once to avoid rate limits
    guild_members_by_id = {}
    try:
        batch = discord_bot_request("GET", f"/guilds/{DISCORD_GUILD_ID}/members?limit=1000")
        if isinstance(batch, list):
            for gm in batch:
                user = gm.get("user", {})
                uid = str(user.get("id", ""))
                avatar = user.get("avatar")
                guild_members_by_id[uid] = {
                    "username": str(user.get("username") or uid),
                    "global_name": str(user.get("global_name") or user.get("username") or uid),
                    "avatar_url": (
                        f"https://cdn.discordapp.com/avatars/{uid}/{avatar}.png?size=128"
                        if avatar
                        else f"https://cdn.discordapp.com/embed/avatars/{int(uid or '0') % 5}.png"
                    ),
                    "avatar_decoration_url": build_avatar_decoration_url(user.get("avatar_decoration_data")),
                }
    except Exception as exc:
        print(f"Could not batch fetch guild members: {exc}")

    members = []
    for member in COMMUNITY_TEAM_MEMBERS:
        uid = str(member.get("id") or "")
        github_login = member.get("github") or ""
        gm = guild_members_by_id.get(uid) if uid else None

        if gm:
            # Found on Discord guild
            username = gm["username"]
            global_name = gm["global_name"]
            avatar_url = gm["avatar_url"]
            avatar_decoration_url = gm.get("avatar_decoration_url")
            source = "discord"
            github_url = f"https://github.com/{github_login}" if github_login else None
        elif github_login:
            # Not in guild but has a GitHub username → fetch from GitHub API
            gh = fetch_github_user(github_login)
            if gh:
                username = gh["username"]
                global_name = gh["global_name"]
                avatar_url = gh["avatar_url"]
                github_url = gh["html_url"]
            else:
                username = github_login
                global_name = github_login
                avatar_url = f"https://github.com/{github_login}.png?size=128"
                github_url = f"https://github.com/{github_login}"
            avatar_decoration_url = None
            source = "github"
        else:
            # Not in guild, no GitHub info — generic fallback
            username = member.get("username") or uid or "Unknown"
            global_name = member.get("global_name") or username
            avatar_url = f"https://cdn.discordapp.com/embed/avatars/{int(uid or '0') % 5}.png" if uid else "https://cdn.discordapp.com/embed/avatars/0.png"
            avatar_decoration_url = None
            github_url = None
            source = "fallback"

        if source == "fallback":
            continue
        members.append({
            "id": uid or None,
            "username": username,
            "global_name": global_name,
            "avatar_url": avatar_url,
            "avatar_decoration_url": avatar_decoration_url,
            "banner_url": None,
            "status": "offline",
            "custom_status": "",
            "activity": "",
            "tag": username,
            "role": member["role"],
            "section": member["section"],
            "blurb": member["blurb"],
            "source": source,
            "github_url": github_url,
        })

    # Apply widget presence data
    widget_presences = {}
    try:
        widget = fetch_remote_json(f"https://discord.com/api/guilds/{DISCORD_GUILD_ID}/widget.json")
        for wm in (widget.get("members") or []):
            wname = str(wm.get("username", ""))
            wstatus = str(wm.get("status", "offline"))
            widget_presences[wname] = wstatus
    except Exception:
        pass

    for m in members:
        widget_status = widget_presences.get(m["username"]) or widget_presences.get(m["global_name"])
        if widget_status:
            m["status"] = widget_status

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
            # Get widget for online presence count
            try:
                widget = fetch_remote_json(f"https://discord.com/api/guilds/{guild_id}/widget.json")
                payload.update(
                    {
                        "source": "widget",
                        "widget_enabled": True,
                        "online_count": widget.get("presence_count") or payload["online_count"],
                        "invite_url": str(widget.get("instant_invite") or invite_url),
                        "last_synced": now_iso(),
                    }
                )
            except (urllib_error.URLError, urllib_error.HTTPError, TimeoutError, json.JSONDecodeError, ValueError):
                pass

            # Afficher tous les membres avec leur vrai statut (bot + widget)
            try:
                # 1. Récupère tous les membres via le bot
                all_members = discord_bot_request("GET", f"/guilds/{guild_id}/members?limit=1000")
                # 2. Récupère la présence réelle via le widget
                widget_members = fetch_remote_json(f"https://discord.com/api/guilds/{guild_id}/widget.json")
                widget_status_by_name = {}
                if isinstance(widget_members.get("members"), list):
                    for wm in widget_members["members"]:
                        # Discord widget n’a pas l’ID, on matche sur le username (pas parfait mais mieux que rien)
                        widget_status_by_name[str(wm.get("username", "")).lower()] = str(wm.get("status", "offline"))
                member_list = []
                for gm in (all_members if isinstance(all_members, list) else []):
                    user = gm.get("user", {})
                    uid = str(user.get("id", ""))
                    if user.get("bot"):
                        continue
                    avatar = user.get("avatar")
                    avatar_url = (
                        f"https://cdn.discordapp.com/avatars/{uid}/{avatar}.png?size=64"
                        if avatar
                        else f"https://cdn.discordapp.com/embed/avatars/{int(uid or '0') % 5}.png"
                    )
                    display_name = str(user.get("global_name") or user.get("username") or uid)
                    # Statut : widget > offline
                    status = widget_status_by_name.get(str(user.get("username", "")).lower(), "offline")
                    member_list.append({
                        "username": display_name,
                        "status": status,
                        "avatar_url": avatar_url,
                    })
                # Trie par statut puis nom
                status_order = {"online": 0, "idle": 1, "dnd": 2, "offline": 3}
                member_list.sort(key=lambda m: (status_order.get(m["status"], 3), m["username"].lower()))
                payload["members"] = member_list
            except Exception as exc:
                print(f"Could not fetch all guild members: {exc}")
    except (urllib_error.URLError, urllib_error.HTTPError, TimeoutError, json.JSONDecodeError, ValueError):
        pass

    if not payload["hierarchy"]:
        hierarchy = [
            {"name": "Info", "type": "category"},
            {"name": "hi", "type": "channel"},
            {"name": "announcement", "type": "channel"},
            {"name": "community-manager", "type": "channel"},
            {"name": "soundcord", "type": "channel"},
            {"name": "NightCord development", "type": "category"},
            {"name": "news", "type": "channel"},
            {"name": "update", "type": "channel"},
            {"name": "source-code", "type": "channel"},
            {"name": "tutorial", "type": "channel"},
            {"name": "download", "type": "channel"},
            {"name": "contributors", "type": "channel"},
            {"name": "safe-check", "type": "channel"},
            {"name": "community", "type": "category"},
            {"name": "chat", "type": "channel"},
            {"name": "help", "type": "channel"},
            {"name": "idea", "type": "channel"},
            {"name": "bug-report", "type": "channel"},
            {"name": "voice", "type": "category"},
            {"name": "voice 1", "type": "voice"},
            {"name": "voice-2", "type": "voice"},
            {"name": "voice-3", "type": "voice"},
            {"name": "prv", "type": "voice"},
        ]
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

        if parsed.path == "/api/themes":
            self.respond_json(HTTPStatus.OK, fetch_equicord_themes())
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
        # CORS Headers
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PATCH, PUT, DELETE")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Session-Token, Authorization")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PATCH, PUT, DELETE")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Session-Token, Authorization")
        self.send_header("Access-Control-Max-Age", "86400")
        self.end_headers()


def main() -> None:
    ensure_database()
    if DISCORD_BOT_TOKEN:
        enable_discord_widget()
    handler = partial(NightcordHandler, directory=str(SITE_DIR))
    server = ThreadingHTTPServer((HOST, PORT), handler)
    print(f"Nightcord full-stack app running at http://{HOST}:{PORT}")
    print(f"SQLite database: {DB_PATH}")
    print(f"Seeded superadmin: {DEFAULT_SUPERADMIN_EMAIL} / {DEFAULT_SUPERADMIN_PASSWORD}")
    server.serve_forever()


if __name__ == "__main__":
    main()