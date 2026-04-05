import { plugins } from './plugin-catalog.js';

const VIDEO_BASE = 'https://raw.githubusercontent.com/nightcordoff/nightcord-tutorials/main/videos/';

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
            <article class="plugin-card glass plugin-card-clickable" style="animation-delay:${index * 40}ms" data-stagger data-plugin-name="${plugin.name}">
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

function openPluginModal(pluginName) {
    const plugin = plugins.find((p) => p.name === pluginName);
    if (!plugin || !modal) return;

    modalTitle.textContent = plugin.name;
    modalCategory.textContent = plugin.category;
    modalDescription.textContent = plugin.description;

    const videoUrl = `${VIDEO_BASE}${encodeURIComponent(plugin.name)}.mp4`;
    modalVideo.src = videoUrl;
    modalVideo.hidden = false;
    modalNoVideo.hidden = true;

    modalVideo.onerror = () => {
        modalVideo.hidden = true;
        modalNoVideo.hidden = false;
    };

    modalVideo.onloadeddata = () => {
        modalVideo.play().catch(() => {});
    };

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