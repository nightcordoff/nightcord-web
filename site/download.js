const cards = [
    {
        channel: 'stable',
        tag: 'Recommended',
        title: 'Download v1.16.6',
        body: 'Main Nightcord installer (.exe).',
        action: 'Download v1.16.6',
        counterLabel: 'Homepage download count',
    },
];

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

function renderCards(downloads) {
    document.getElementById('download-grid').innerHTML = cards.map((card) => `
        <article class="download-card glass" data-channel="${card.channel}">
            <span class="feature-chip">${card.tag}</span>
            <h3>${card.title}</h3>
            <p>${card.body}</p>
            <small>${card.counterLabel}: ${new Intl.NumberFormat('en-US').format(downloads[card.channel])}</small>
            ${card.href
                ? `<a class="button button-primary" href="${card.href}">${card.action}</a>`
                : `<button class="button button-primary" type="button">${card.action}</button>`}
        </article>
    `).join('');
}

async function updateOverview() {
    const health = await readJson('/api/health');
    setHeaderStatus(`API ${health.status}`);
    const overview = await readJson('/api/overview');
    document.getElementById('footer-runtime').textContent = `${overview.brand} runtime · ${overview.runtime}`;
    renderCards(overview.downloads);
}

document.getElementById('download-grid').addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const card = button.closest('[data-channel]');
    const channel = card.dataset.channel;
    try {
        await readJson(`/api/downloads/${channel}`, { method: 'POST' });
        await updateOverview();
    } catch (error) {
        console.error(error);
        setHeaderStatus('Counter error', false);
    }
});

updateOverview().catch((error) => {
    console.error(error);
    setHeaderStatus('API unavailable', false);
});