import { plugins } from './plugin-catalog.js';

const VIDEO_BASE = 'https://raw.githubusercontent.com/nightcordoff/nightcord-tutorials/main/videos/';
const VIDEO_CACHE_KEY = 'nc_video_status_v1';

let videoStatusMap = null;

const grid = document.getElementById('plugin-grid');
const searchInput = document.getElementById('plugin-search-input');
const resultsCount = document.getElementById('plugin-results-count');

const modal = document.getElementById('plugin-detail-modal');
const modalTitle = document.getElementById('plugin-detail-title');
const modalCategory = document.getElementById('plugin-detail-category');
const modalDescription = document.getElementById('plugin-detail-description');
const modalVideo = document.getElementById('plugin-detail-video');
const modalNoVideo = document.getElementById('plugin-detail-no-video');
const modalVideoWrap = document.getElementById('plugin-detail-video-wrap');

function getPluginIcon() {
    return `
        <span class="plugin-card-icon-wrap" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-icon lucide-plug-2">
                <path d="M9 2v6"></path>
                <path d="M15 2v6"></path>
                <path d="M12 17v5"></path>
                <path d="M5 8h14"></path>
                <path d="M6 11v1a6 6 0 0 0 12 0v-1"></path>
            </svg>
        </span>
    `;
}

function formatResultsLabel(count) {
    return `${count} plugin${count > 1 ? 's' : ''}`;
}

function renderPlugins(list) {
    if (!grid) {
        return;
    }

    if (!list.length) {
        grid.innerHTML = `
            <article class="plugin-card plugin-card-empty glass">
                <span class="feature-chip">No match</span>
                <h3>No plugin found.</h3>
                <p>Try another keyword such as voice, audio, token, theme, or ghost.</p>
            </article>
        `;
    } else {
        grid.innerHTML = list.map((plugin, index) => `
            <article class="plugin-card glass plugin-card-clickable" style="--i:${index}" data-plugin-name="${plugin.name}">
                <span class="plugin-video-badge" aria-hidden="true" title="Vérification vidéo…"></span>
                <div class="plugin-card-top">
                    ${getPluginIcon()}
                    <span class="feature-chip">${plugin.category}</span>
                </div>
                <h3>${plugin.name}</h3>
                <p>${plugin.description}</p>
            </article>
        `).join('');
    }

    if (resultsCount) {
        resultsCount.textContent = formatResultsLabel(list.length);
    }

    applyVideoBadges();
}

function applyVideoBadges() {
    if (!videoStatusMap || !grid) return;
    grid.querySelectorAll('[data-plugin-name]').forEach((card) => {
        const name = card.dataset.pluginName;
        const badge = card.querySelector('.plugin-video-badge');
        if (!badge || !(name in videoStatusMap)) return;
        const has = videoStatusMap[name];
        badge.setAttribute('data-has-video', has ? 'true' : 'false');
        badge.title = has ? 'Vidéo disponible' : '';
        badge.innerHTML = has
            ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8z"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>`
            : ``;
    });
}

async function checkVideoAvailability() {
    try {
        const raw = sessionStorage.getItem(VIDEO_CACHE_KEY);
        if (raw) {
            videoStatusMap = JSON.parse(raw);
            applyVideoBadges();
            return;
        }
    } catch {}

    const results = await Promise.allSettled(
        plugins.map(async (plugin) => {
            const url = `${VIDEO_BASE}${encodeURIComponent(plugin.name)}.mp4`;
            try {
                const res = await fetch(url, { method: 'HEAD' });
                return { name: plugin.name, hasVideo: res.ok };
            } catch {
                return { name: plugin.name, hasVideo: false };
            }
        })
    );

    videoStatusMap = {};
    results.forEach((r) => {
        if (r.status === 'fulfilled') videoStatusMap[r.value.name] = r.value.hasVideo;
    });

    try {
        sessionStorage.setItem(VIDEO_CACHE_KEY, JSON.stringify(videoStatusMap));
    } catch {}

    applyVideoBadges();
}

function filterPlugins(query) {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
        return plugins;
    }

    return plugins.filter((plugin) => {
        return [plugin.category, plugin.name, plugin.description]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery);
    });
}

searchInput?.addEventListener('input', (event) => {
    renderPlugins(filterPlugins(event.currentTarget.value));
});

renderPlugins(plugins);
checkVideoAvailability();

function openPluginModal(pluginName) {
    const plugin = plugins.find((p) => p.name === pluginName);
    if (!plugin || !modal) return;

    modalTitle.textContent = plugin.name;
    modalCategory.textContent = plugin.category;
    modalDescription.textContent = plugin.description;

    const hasVideo = videoStatusMap ? videoStatusMap[plugin.name] : true;

    if (hasVideo !== false) {
        const videoUrl = `${VIDEO_BASE}${encodeURIComponent(plugin.name)}.mp4`;
        modalVideo.src = videoUrl;
        modalVideo.hidden = false;
        modalNoVideo.hidden = true;
        if (modalVideoWrap) modalVideoWrap.hidden = false;

        modalVideo.onerror = () => {
            modalVideo.hidden = true;
            modalNoVideo.hidden = false;
        };

        modalVideo.onloadeddata = () => {
            modalVideo.play().catch(() => {});
        };
    } else {
        if (modalVideoWrap) modalVideoWrap.hidden = true;
    }

    modal.hidden = false;
    document.body.classList.add('modal-open');
}

function closePluginModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    modalVideo.pause();
    modalVideo.removeAttribute('src');
    modalVideo.load();
}

grid?.addEventListener('click', (event) => {
    const card = event.target.closest('[data-plugin-name]');
    if (card) {
        openPluginModal(card.dataset.pluginName);
    }
});

modal?.addEventListener('click', (event) => {
    if (event.target.closest('[data-close-plugin-modal]')) {
        closePluginModal();
    }
});

modalVideo?.addEventListener('click', () => {
    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else {
        modalVideo.requestFullscreen().catch(() => {});
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal && !modal.hidden) {
        closePluginModal();
    }
});