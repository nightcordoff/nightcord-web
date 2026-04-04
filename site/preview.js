import { plugins } from './plugin-catalog.js';

const previewState = {
    mode: 'base',
    channel: 'announcements',
};

const previewData = {
    guild: 'Nightcord Lab',
    servers: ['NC', 'FX', 'PL', 'AI'],
    channels: [
        {
            id: 'announcements',
            label: 'announcements',
            topic: 'Nightcord release pulses and roadmap notes.',
            messages: [
                { user: 'Lune', role: 'Lead', text: 'Landing page refactor is live. Preview and admin now sit on distinct routes.', time: '09:12' },
                { user: 'Mika', role: 'Design', text: 'The animated background is subtle enough now to feel premium instead of noisy.', time: '09:14' },
                { user: 'Octane', role: 'Ops', text: 'Next target: a convincing in-browser client preview that shows the product story immediately.', time: '09:17' },
            ],
        },
        {
            id: 'showcase',
            label: 'showcase',
            topic: 'Visual previews and client surface experiments.',
            messages: [
                { user: 'Nox', role: 'Visual', text: 'Pinned a new mockup for the plugin tray. It reads much better with stronger depth.', time: '11:02' },
                { user: 'Lune', role: 'Lead', text: 'If Nightmagic is active, the right rail should reveal plugin toggles instead of static filler.', time: '11:07' },
                { user: 'Kiri', role: 'Build', text: 'The preview does not need real Discord code. It needs to communicate the experience.', time: '11:12' },
            ],
        },
        {
            id: 'plugin-lab',
            label: 'plugin-lab',
            topic: 'Experimental modules, overlays, and quality-of-life layers.',
            messages: [
                { user: 'Mika', role: 'Design', text: 'Base mode should feel clean. Nightmagic should feel like the same shell unlocked.', time: '13:23' },
                { user: 'Octane', role: 'Ops', text: 'We can fake focus mode, quick actions, plugin trays, and richer reactions in preview.', time: '13:29' },
                { user: 'Lune', role: 'Lead', text: 'Perfect. That gives us a visual sales pitch without touching any proprietary client.', time: '13:31' },
            ],
        },
    ],
    members: [
        { name: 'Lune', status: 'Shipping preview systems', accent: 'teal' },
        { name: 'Mika', status: 'Polishing motion and lighting', accent: 'pink' },
        { name: 'Octane', status: 'Wiring backend and release flow', accent: 'cyan' },
        { name: 'Kiri', status: 'Testing plugins and overlays', accent: 'violet' },
    ],
    nightmagic: {
        badges: ['Plugin tray', 'Smart reactions', 'Focus HUD'],
        actions: ['Plugins', 'Search+', 'Focus', 'FX tray'],
    },
};

function slugify(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

const elements = {
    headerStatus: document.getElementById('header-status'),
    footerRuntime: document.getElementById('footer-runtime'),
    modeSwitch: document.getElementById('mode-switch'),
    channelTabs: document.getElementById('channel-tabs'),
    serverStack: document.getElementById('server-stack'),
    channelList: document.getElementById('channel-list'),
    previewGuild: document.getElementById('preview-guild'),
    chatTitle: document.getElementById('chat-title'),
    chatSubtitle: document.getElementById('chat-subtitle'),
    previewBadges: document.getElementById('preview-badges'),
    messageList: document.getElementById('message-list'),
    composerHint: document.getElementById('composer-hint'),
    composerActions: document.getElementById('composer-actions'),
    memberList: document.getElementById('member-list'),
    memberCaption: document.getElementById('member-caption'),
    pluginLayer: document.getElementById('plugin-layer'),
    previewShell: document.getElementById('preview-shell'),
};

function currentChannel() {
    return previewData.channels.find((channel) => channel.id === previewState.channel) || previewData.channels[0];
}

function renderStaticBits() {
    elements.previewGuild.textContent = previewData.guild;
    elements.footerRuntime.textContent = 'Nightcord preview · original mock client shell';
    elements.serverStack.innerHTML = previewData.servers.map((server, index) => `
        <button class="server-pill ${index === 0 ? 'is-active' : ''}" type="button">${server}</button>
    `).join('');
}

function renderChannels() {
    elements.channelTabs.innerHTML = previewData.channels.map((channel) => `
        <button class="channel-tab ${channel.id === previewState.channel ? 'is-active' : ''}" type="button" data-channel-tab="${channel.id}"># ${channel.label}</button>
    `).join('');

    elements.channelList.innerHTML = previewData.channels.map((channel) => `
        <button class="channel-row ${channel.id === previewState.channel ? 'is-active' : ''}" type="button" data-channel-row="${channel.id}">
            <span>#</span>
            <span>${channel.label}</span>
        </button>
    `).join('');
}

function renderMembers() {
    elements.memberCaption.textContent = previewState.mode === 'nightmagic' ? 'Nightmagic enhanced room' : 'Base room state';
    elements.memberList.innerHTML = previewData.members.map((member) => `
        <article class="member-card">
            <div class="member-avatar member-${member.accent}">${member.name.slice(0, 1)}</div>
            <div>
                <strong>${member.name}</strong>
                <p>${member.status}</p>
            </div>
        </article>
    `).join('');
}

function renderChannelContent() {
    const channel = currentChannel();
    elements.chatTitle.textContent = `# ${channel.label}`;
    elements.chatSubtitle.textContent = channel.topic;
    elements.composerHint.textContent = `Message #${channel.label}`;

    elements.messageList.innerHTML = channel.messages.map((message, index) => `
        <article class="message-item" style="animation-delay:${index * 90}ms">
            <div class="message-avatar">${message.user.slice(0, 1)}</div>
            <div class="message-body">
                <div class="message-head">
                    <strong>${message.user}</strong>
                    <span class="role-pill role-${slugify(message.role)}">${message.role}</span>
                    <small>${message.time}</small>
                </div>
                <p>${message.text}</p>
                ${previewState.mode === 'nightmagic' ? '<div class="message-enhance">Nightmagic: semantic reactions + quick plugin context</div>' : ''}
            </div>
        </article>
    `).join('');
}

function renderMode() {
    const isNightmagic = previewState.mode === 'nightmagic';
    elements.previewShell.classList.toggle('is-nightmagic', isNightmagic);
    elements.headerStatus.textContent = isNightmagic ? 'Nightmagic mode' : 'Base preview';
    elements.headerStatus.style.color = isNightmagic ? 'var(--pink)' : 'var(--teal)';
    elements.headerStatus.style.background = isNightmagic ? 'rgba(255, 126, 201, 0.12)' : 'rgba(122, 244, 209, 0.08)';

    elements.modeSwitch.querySelectorAll('[data-mode]').forEach((button) => {
        button.classList.toggle('is-active', button.dataset.mode === previewState.mode);
    });

    elements.previewBadges.innerHTML = isNightmagic
        ? [...previewData.nightmagic.badges, `${plugins.length} plugins`].map((badge) => `<span class="preview-badge">${badge}</span>`).join('')
        : '<span class="preview-badge is-muted">Base client shell</span>';

    const actions = isNightmagic ? previewData.nightmagic.actions : ['Attach', 'GIF', 'Emoji'];
    elements.composerActions.innerHTML = actions.map((action) => `<span class="composer-pill">${action}</span>`).join('');

    const layer = isNightmagic ? plugins.map((plugin) => ({
        category: plugin.category,
        name: plugin.name,
        desc: plugin.description,
        isCatalog: true,
    })) : [
        { name: 'Core shell', desc: 'Channels, messages, and members only.' },
        { name: 'No plugin overlays', desc: 'Base mode keeps the preview intentionally clean.' },
    ];
    elements.pluginLayer.innerHTML = layer.map((item) => `
        <article class="plugin-layer-item${item.isCatalog ? ' plugin-layer-item-catalog' : ''}">
            ${item.category ? `<span class="plugin-layer-category">${item.category}</span>` : ''}
            <strong>${item.name}</strong>
            <p>${item.desc}</p>
        </article>
    `).join('');
}

function renderAll() {
    renderStaticBits();
    renderChannels();
    renderMembers();
    renderChannelContent();
    renderMode();
}

elements.modeSwitch.addEventListener('click', (event) => {
    const button = event.target.closest('[data-mode]');
    if (!button) return;
    previewState.mode = button.dataset.mode;
    renderAll();
});

document.addEventListener('click', (event) => {
    const channelButton = event.target.closest('[data-channel-tab], [data-channel-row]');
    if (!channelButton) return;
    previewState.channel = channelButton.dataset.channelTab || channelButton.dataset.channelRow;
    renderAll();
});

renderAll();