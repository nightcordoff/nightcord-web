async function readJson(url, options) {
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }
    return response.json();
}

function setHeaderStatus(message, ok = true) {
    const element = document.getElementById('header-status');
    if (!element) return;
    element.textContent = message;
    element.style.color = ok ? 'var(--teal)' : '#ff9ccf';
    element.style.background = ok ? 'rgba(122, 244, 209, 0.08)' : 'rgba(255, 126, 201, 0.1)';
}

function renderCards(overview) {
    const version = overview.version || 'latest';
    const stableCount = (overview.downloads || {}).stable || 0;
    const linuxCount = (overview.downloads || {}).linux || 0;

    document.getElementById('download-grid').innerHTML = `
        <article class="download-card glass" data-channel="stable">
            <span class="feature-chip">Windows</span>
            <h3>Download ${version}</h3>
            <p>Main Nightcord installer (.exe).</p>
            <small>Downloads: ${new Intl.NumberFormat('en-US').format(stableCount)}</small>
            <div class="download-card-spacer"></div>
            <button class="button button-primary" type="button" data-action="stable">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.949"/></svg>
                Download ${version}
            </button>
        </article>
        <article class="download-card glass" data-channel="linux">
            <span class="feature-chip">Linux</span>
            <h3>Download ${version}</h3>
            <p>AppImage — works on most distros.</p>
            <small>Downloads: ${new Intl.NumberFormat('en-US').format(linuxCount)}</small>
            <div class="download-card-spacer"></div>
            <a class="button button-primary" href="https://github.com/nightcordoff/nightcord/releases/latest" target="_blank" rel="noopener noreferrer" data-action="linux">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.246-2.57 2.38-3.595 3.644-1.28 1.607-1.955 4.527-1.28 6.912.465 1.652 1.78 2.773 3.365 2.773.73 0 1.439-.2 2.126-.586.613-.34 1.176-.777 1.882-.777s1.357.447 2.023.826c.68.392 1.382.556 2.072.556 1.62 0 3.08-1.077 3.573-2.697.7-2.308-.037-5.088-1.228-6.664-1.002-1.307-2.717-2.462-3.6-3.7-.753-1.06-.967-1.91-1.032-2.995-.11-1.482.945-5.657-2.602-5.637zm-3.52 8.43c-.186-.125-.326-.29-.383-.49-.099-.365.025-.75.298-1.01.273-.26.637-.38.99-.343.353.037.683.232.92.527.131.163.22.35.263.55l-1.073.327c-.098-.33-.426-.553-.015-.56z"/></svg>
                Download ${version}
            </a>
        </article>
    `;
}

async function updateOverview() {
    const health = await readJson('/api/health');
    setHeaderStatus(`API ${health.status}`);
    const overview = await readJson('/api/overview');
    document.getElementById('footer-runtime').textContent = `${overview.brand} runtime · ${overview.runtime}`;
    renderCards(overview);
}

document.getElementById('download-grid').addEventListener('click', async (event) => {
    const el = event.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    if (action !== 'stable') return; // linux is a direct link, no counter
    try {
        await readJson(`/api/downloads/${action}`, { method: 'POST' });
        await updateOverview();
    } catch (error) {
        console.error(error);
        setHeaderStatus('Counter error', false);
    }
});

document.getElementById('download-grid').addEventListener('click', async (event) => {
    const el = event.target.closest('a[data-action="linux"]');
    if (!el) return;
    try {
        await readJson('/api/downloads/linux', { method: 'POST' });
    } catch (_) {}
});

updateOverview().catch((error) => {
    console.error(error);
    setHeaderStatus('API unavailable', false);
});