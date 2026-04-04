import { plugins } from './plugin-catalog.js';

const grid = document.getElementById('plugin-grid');
const searchInput = document.getElementById('plugin-search-input');
const resultsCount = document.getElementById('plugin-results-count');

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
            <article class="plugin-card glass" style="animation-delay:${index * 40}ms" data-stagger>
                <div class="plugin-card-top">
                    ${getPluginIcon()}
                    <span class="feature-chip">${plugin.category}</span>
                </div>
                <h3>${plugin.name}</h3>
                <p>${plugin.description}</p>
                <div class="plugin-meta">Plugin ${String(index + 1).padStart(2, '0')}</div>
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