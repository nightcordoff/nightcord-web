const API = '/api/themes';

let allThemes = [];
let activeType = 'all';

async function loadThemes() {
    const grid = document.getElementById('themes-grid');
    const loading = document.getElementById('themes-loading');

    try {
        const res = await fetch(API);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        allThemes = Array.isArray(data) ? data : [];
    } catch (e) {
        loading.innerHTML = '<span style="color:rgba(255,255,255,0.4)">Failed to load themes. Try again later.</span>';
        return;
    }

    loading.remove();
    render();
}

function tagHtml(tag) {
    return `<span class="theme-card-tag">${escHtml(tag)}</span>`;
}

function escHtml(str) {
    return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function render() {
    const q = (document.getElementById('themes-search')?.value ?? '').trim().toLowerCase();
    const grid = document.getElementById('themes-grid');
    const countEl = document.getElementById('themes-count');

    const filtered = allThemes.filter(t => {
        if (activeType !== 'all' && t.type !== activeType) return false;
        if (!q) return true;
        const haystack = [t.name, t.description, t.author?.discord_name, t.author?.github_name, ...(t.tags ?? [])].join(' ').toLowerCase();
        return haystack.includes(q);
    });

    countEl.textContent = `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`;

    if (filtered.length === 0) {
        grid.innerHTML = '<p class="themes-empty">No themes found.</p>';
        return;
    }

    const sorted = [...filtered].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));

    grid.innerHTML = sorted.map(t => {
        const tags = (t.tags ?? []).slice(0, 3).map(tagHtml).join('');
        const author = t.author?.discord_name ?? t.author?.github_name ?? 'Unknown';
        const thumb = t.thumbnail_url ?? '';
        const typeLabel = t.type === 'snippet' ? 'Snippet' : 'Theme';
        const typeClass = t.type === 'snippet' ? 'theme-card-type-snippet' : 'theme-card-type-theme';

        return `<div class="theme-card glass" role="button" tabindex="0" data-id="${escHtml(t.id)}">
            <div class="theme-card-thumb">
                ${thumb ? `<img src="${escHtml(thumb)}" alt="${escHtml(t.name)}" loading="lazy" decoding="async">` : '<div class="theme-card-thumb-placeholder"></div>'}
                <span class="theme-card-type ${typeClass}">${typeLabel}</span>
            </div>
            <div class="theme-card-body">
                <div class="theme-card-tags">${tags}</div>
                <strong class="theme-card-name">${escHtml(t.name)}</strong>
                <p class="theme-card-desc">${escHtml(t.description ?? '')}</p>
            </div>
            <div class="theme-card-footer">
                <span class="theme-card-stat">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    ${t.likes ?? 0}
                </span>
                <span class="theme-card-author">by ${escHtml(author)}</span>
            </div>
        </div>`;
    }).join('');

    // attach click listeners after render
    grid.querySelectorAll('.theme-card').forEach(card => {
        card.addEventListener('click', () => openModal(card.dataset.id));
        card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openModal(card.dataset.id); });
    });
}

// ── Modal ────────────────────────────────────────────────
function parseVersion(css) {
    const m = css.match(/@version\s+([^\s*/]+)/);
    return m ? m[1] : '—';
}

function formatDate(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch { return '—'; }
}

function openModal(id) {
    const t = allThemes.find(x => String(x.id) === String(id));
    if (!t) return;

    const overlay = document.getElementById('theme-modal');

    // Decode CSS from base64
    let cssText = '';
    try { cssText = t.content ? atob(t.content) : ''; } catch { cssText = ''; }

    // Type badge
    const badge = document.getElementById('modal-type-badge');
    const isSnippet = t.type === 'snippet';
    badge.textContent = isSnippet ? 'Snippet' : 'Theme';
    badge.className = `theme-card-type ${isSnippet ? 'theme-card-type-snippet' : 'theme-card-type-theme'}`;

    // Name / desc / tags
    document.getElementById('modal-name').textContent = t.name ?? '';
    document.getElementById('modal-desc').textContent = t.description ?? '';
    const tagsEl = document.getElementById('modal-tags');
    tagsEl.innerHTML = (t.tags ?? []).map(tagHtml).join('');

    // Preview image
    const img = document.getElementById('modal-preview-img');
    const placeholder = document.getElementById('modal-preview-placeholder');
    if (t.thumbnail_url) {
        img.src = t.thumbnail_url;
        img.alt = t.name ?? '';
        img.style.display = 'block';
        placeholder.style.display = 'none';
    } else {
        img.style.display = 'none';
        placeholder.style.display = 'block';
    }

    // Source code
    const codeEl = document.getElementById('modal-code');
    if (cssText) {
        codeEl.textContent = cssText;
        document.getElementById('modal-code-section').style.display = '';
    } else {
        document.getElementById('modal-code-section').style.display = 'none';
    }

    // Stats
    document.getElementById('modal-downloads').textContent = t.downloads != null ? new Intl.NumberFormat('fr-FR').format(t.downloads) : '—';
    document.getElementById('modal-likes').textContent = t.likes != null ? t.likes : '—';
    document.getElementById('modal-created').textContent = formatDate(t.release_date);
    document.getElementById('modal-version').textContent = cssText ? parseVersion(cssText) : '—';

    // GitHub
    const ghBtn = document.getElementById('modal-github-btn');
    if (t.source) { ghBtn.href = t.source; ghBtn.style.display = ''; }
    else { ghBtn.style.display = 'none'; }

    // CSS @import URL — extract from decoded CSS
    const importMatch = cssText.match(/@import\s+url\(['"]?([^'"\)]+)['"]?\)/i);
    const cssUrl = importMatch ? importMatch[1] : (t.source ?? '');
    const cssurlSection = document.getElementById('modal-cssurl-section');
    if (cssUrl) {
        document.getElementById('modal-cssurl').textContent = cssUrl;
        cssurlSection.style.display = '';
    } else {
        cssurlSection.style.display = 'none';
    }

    // Download button — creates blob from decoded CSS
    const dlBtn = document.getElementById('modal-download-btn');
    dlBtn.onclick = () => {
        if (!cssText) return;
        const blob = new Blob([cssText], { type: 'text/css' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(t.name ?? 'theme').replace(/[^a-z0-9_-]/gi, '_')}.theme.css`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Contributors
    const authorName = t.author?.discord_name ?? t.author?.github_name ?? null;
    const authorId = t.author?.discord_snowflake ?? null;
    const githubName = t.author?.github_name ?? null;

    if (authorName) {
        document.getElementById('modal-contrib-name').textContent = authorName;
        document.getElementById('modal-contrib-id').textContent = authorId ? `ID: ${authorId}` : '';

        const discordBtn = document.getElementById('modal-discord-btn');
        if (authorId) {
            discordBtn.href = `https://discord.com/users/${authorId}`;
            discordBtn.style.display = '';
        } else {
            discordBtn.style.display = 'none';
        }

        const githubBtn = document.getElementById('modal-github-author-btn');
        if (githubName) {
            githubBtn.href = `https://github.com/${githubName}`;
            githubBtn.style.display = '';
        } else {
            githubBtn.style.display = 'none';
        }

        document.getElementById('modal-contrib-section').style.display = '';
    } else {
        document.getElementById('modal-contrib-section').style.display = 'none';
    }

    // Show overlay
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    document.getElementById('theme-modal-close').focus();
}

function closeModal() {
    document.getElementById('theme-modal').hidden = true;
    document.body.style.overflow = '';
}

// Copy CSS URL button
document.getElementById('modal-copy-url-btn')?.addEventListener('click', () => {
    const url = document.getElementById('modal-cssurl')?.textContent ?? '';
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
        const btn = document.getElementById('modal-copy-url-btn');
        btn.classList.add('copied');
        btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`;
        setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
        }, 2000);
    });
});

// Copy source code button
document.getElementById('modal-copy-code-btn')?.addEventListener('click', () => {
    const code = document.getElementById('modal-code')?.textContent ?? '';
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
        const btn = document.getElementById('modal-copy-code-btn');
        btn.classList.add('copied');
        btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
        setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy Code`;
        }, 2000);
    });
});

// Close handlers
document.getElementById('theme-modal-close')?.addEventListener('click', closeModal);
document.getElementById('theme-modal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// Search
document.getElementById('themes-search')?.addEventListener('input', render);

// Tabs
document.getElementById('themes-tabs')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-type]');
    if (!btn) return;
    activeType = btn.dataset.type;
    document.querySelectorAll('.themes-tab').forEach(t => t.classList.toggle('themes-tab-active', t === btn));
    render();
});

loadThemes();

