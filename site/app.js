const state = {
    overview: null,
};

const contributeState = {
    activeTimeout: null,
};

function splitWords(el, baseDelay = 0) {
    const text = el.textContent.trim();
    el.innerHTML = text.split(/\s+/).filter(Boolean).map((word, i) =>
        `<span class="word-reveal" style="--wi:${i};transition-delay:calc(${baseDelay}ms + var(--wi) * 80ms)">${word}</span>`
    ).join(' ');
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            el.querySelectorAll('.word-reveal').forEach((span) => span.classList.add('revealed'));
        });
    });
}

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
    element.style.color = ok ? '#d6d6dc' : '#b4b4bb';
    element.style.background = ok ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.06)';
}

function renderOverview(overview) {
    state.overview = overview;
    const metricGrid = document.getElementById('metric-grid');
    const stackList = document.getElementById('stack-list');
    const liveDatabase = document.getElementById('live-database');
    const stableDownloads = document.getElementById('stable-downloads');
    const pluginCount = document.getElementById('plugin-count');
    const featuredEnabled = new Set(['AntiDeco', 'VoiceDictation']);
    const homepageFeatures = Array.isArray(overview.features)
        ? overview.features.filter((feature) => feature.name !== 'StereoMic')
        : [];
    document.getElementById('hero-eyebrow').textContent = overview.hero.eyebrow;
    document.getElementById('hero-eyebrow-clone').textContent = overview.hero.eyebrow;
    const heroTitle = document.getElementById('hero-title');
    heroTitle.textContent = overview.brand;
    splitWords(heroTitle, 0);
    const heroSubtitle = document.getElementById('hero-subtitle');
    heroSubtitle.textContent = overview.hero.subtitle;
    splitWords(heroSubtitle, 160);
    if (liveDatabase) {
        liveDatabase.textContent = '';
    }
    document.getElementById('footer-runtime').textContent = "NightCord Official WebSite";

    if (metricGrid) {
        metricGrid.innerHTML = overview.metrics.map((metric) => `
            <article class="metric-card glass-lite">
                <strong>${metric.value}</strong>
                <span>${metric.label}</span>
            </article>
        `).join('');
    }

    document.getElementById('feature-grid').innerHTML = homepageFeatures.map((feature, index) => {
        const enabled = featuredEnabled.has(feature.name);
        return `
            <article class="feature-card feature-plugin-card glass-lite" data-enabled="${enabled}">
                <div class="feature-plugin-head">
                    <div>
                        <span class="feature-chip">${feature.category}</span>
                        <h3>${feature.name}</h3>
                    </div>
                    <button class="plugin-switch${enabled ? ' is-on' : ''}" type="button" aria-label="Toggle ${feature.name}" aria-pressed="${enabled}">
                        <span></span>
                    </button>
                </div>
                <p>${feature.description}</p>
            </article>
        `;
    }).join('');

    if (stackList) {
        stackList.innerHTML = overview.stack.map((item) => `
            <article class="stack-item glass-lite">
                <span class="stack-chip">${item.type}</span>
                <h3>${item.name}</h3>
                <p>${item.description}</p>
            </article>
        `).join('');
    }

    document.getElementById('release-list').innerHTML = overview.releases.map((release) => `
        <article class="timeline-item">
            <div>
                <div class="timeline-date">${release.released_at}</div>
                <div class="feature-chip">${release.version}</div>
            </div>
            <div>
                <h3>${release.title}</h3>
                <p>${release.summary}</p>
            </div>
        </article>
    `).join('');
}

async function copyText(value) {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return;
    }

    const input = document.createElement('textarea');
    input.value = value;
    input.setAttribute('readonly', '');
    input.style.position = 'absolute';
    input.style.left = '-9999px';
    document.body.append(input);
    input.select();
    document.execCommand('copy');
    input.remove();
}

function updateContributeStatus(message) {
    const status = document.getElementById('contribute-modal-status');
    if (status) {
        status.textContent = message;
    }
}

function openContributeModal() {
    const modal = document.getElementById('contribute-modal');
    if (!modal) return;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    updateContributeStatus('Choose a contact or wallet to copy');
}

function closeContributeModal() {
    const modal = document.getElementById('contribute-modal');
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove('modal-open');
}

function bootContributeModal() {
    const modal = document.getElementById('contribute-modal');
    const openButton = document.getElementById('open-contribute-modal');
    if (!modal || !openButton) {
        return;
    }

    openButton.addEventListener('click', openContributeModal);

    modal.addEventListener('click', async (event) => {
        const closeTrigger = event.target.closest('[data-close-modal]');
        if (closeTrigger) {
            closeContributeModal();
            return;
        }

        const copyButton = event.target.closest('.contribute-copy-button');
        if (!copyButton) {
            return;
        }

        const value = copyButton.dataset.copyValue;
        const label = copyButton.dataset.copyLabel || 'Value';
        const card = copyButton.closest('[data-copy-card]');
        if (!value || !card) {
            return;
        }

        try {
            await copyText(value);
            copyButton.textContent = 'Copied';
            card.classList.add('is-copied');
            updateContributeStatus(`${label} copied`);

            if (contributeState.activeTimeout) {
                window.clearTimeout(contributeState.activeTimeout);
            }

            contributeState.activeTimeout = window.setTimeout(() => {
                modal.querySelectorAll('.contribute-copy-button').forEach((button) => {
                    button.textContent = 'Copy';
                });
                modal.querySelectorAll('[data-copy-card]').forEach((item) => {
                    item.classList.remove('is-copied');
                });
                updateContributeStatus('Ready to copy');
            }, 1800);
        } catch (error) {
            console.error(error);
            updateContributeStatus(`Failed to copy ${label.toLowerCase()}`);
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !modal.hidden) {
            closeContributeModal();
        }
    });
}

document.getElementById('feature-grid')?.addEventListener('click', (event) => {
    const button = event.target.closest('.plugin-switch');
    if (!button) return;
    const isOn = button.getAttribute('aria-pressed') === 'true';
    button.setAttribute('aria-pressed', String(!isOn));
    button.classList.toggle('is-on', !isOn);
    button.closest('[data-enabled]')?.setAttribute('data-enabled', String(!isOn));
});

bootContributeModal();

function animateCounter(el, target) {
    if (!el) return;
    const current = Number(el.textContent.replace(/,/g, '')) || 0;
    const duration = 1200;
    const start = performance.now();
    
    el.classList.add('counting');
    
    function update(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
        const val = Math.floor(eased * target);
        el.textContent = new Intl.NumberFormat('en-US').format(val);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            el.classList.remove('counting');
        }
    }
    
    requestAnimationFrame(update);
}

async function boot() {
    const DB_CONFIG = {
        url: atob('aHR0cHM6Ly9uaWdodGNvcmQtMTc0ZTktZGVmYXVsdC1ydGRiLmZpcmViYXNlaW8uY29t')
    };

    // Start backend fetching independently so it doesn't block GitHub/Firebase
    const loadBackend = async () => {
        try {
            const health = await readJson(getApiUrl('/api/health'));
            setHeaderStatus(`API ${health.status}`);
            const overview = await readJson(getApiUrl('/api/overview'));
            renderOverview(overview);
        } catch (error) {
            console.error(error);
            setHeaderStatus('API unavailable', false);
        }
    };
    loadBackend();
    
    // Set up direct download button on the homepage
    const winBtn = document.querySelector('.button-download-windows');
    const stableDownloads = document.getElementById('stable-downloads');

    if (stableDownloads) {
        fetch(`${DB_CONFIG.url}/downloads/count.json`)
            .then(r => r.json())
            .then(data => {
                const val = Number(data) || 0;
                animateCounter(stableDownloads, val);
                
                // Also update the 'Downloads' metric in the grid if present
                const metricCards = document.querySelectorAll('.metric-card');
                metricCards.forEach(card => {
                    const label = card.querySelector('span')?.textContent;
                    if (label === 'Downloads') {
                        const strong = card.querySelector('strong');
                        if (strong) strong.textContent = new Intl.NumberFormat('en-US').format(val);
                    }
                });
            }).catch(() => {});
    }

    if (winBtn) {
        fetch('https://api.github.com/repos/nightcordoff/nightcordclient-releases/releases/latest')
            .then(r => r.json())
            .then(data => {
                const exe = data?.assets?.find(a => a.name.endsWith('.exe'));
                if (exe && exe.browser_download_url) {
                    winBtn.href = exe.browser_download_url;
                }
            }).catch(() => {});
            
        winBtn.addEventListener('click', async () => {
            const now = Date.now();
            const LIMIT_WINDOW = 30 * 60 * 1000; // 30 minutes
            const MAX_CLICKS = 10;
            
            // Local check first to save API calls
            let clickHistory = JSON.parse(localStorage.getItem('nc_dl_history') || '[]');
            clickHistory = clickHistory.filter(t => now - t < LIMIT_WINDOW);
            
            if (clickHistory.length >= MAX_CLICKS) {
                console.warn('[RateLimit] Maximum downloads reached. Link remains active but counter increment skipped.');
                return;
            }

            // Update counter UI optimistically
            if (stableDownloads) {
                const current = Number(stableDownloads.textContent.replace(/,/g, '')) || 0;
                stableDownloads.textContent = new Intl.NumberFormat('en-US').format(current + 1);
                stableDownloads.classList.add('counting');
                setTimeout(() => stableDownloads.classList.remove('counting'), 600);
            }

            // Save new click locally
            clickHistory.push(now);
            localStorage.setItem('nc_dl_history', JSON.stringify(clickHistory));

            // Increment on Firebase
            fetch(`${DB_CONFIG.url}/downloads/count.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ".sv": { "increment": 1 } }),
                keepalive: true
            }).catch(console.error);

            // Update RateLimit structure in Firebase
            try {
                // We use a dummy fetch to get the IP if needed, or just use a unique client ID
                let clientId = localStorage.getItem('nc_client_id');
                if (!clientId) {
                    clientId = Math.random().toString(36).substring(2, 15);
                    localStorage.setItem('nc_client_id', clientId);
                }
                
                fetch(`${DB_CONFIG.url}/ratelimit/${clientId}/clicks.json`, {
                    method: 'POST',
                    body: JSON.stringify(now)
                });
            } catch(e) {}
        });
    }
}

boot();
