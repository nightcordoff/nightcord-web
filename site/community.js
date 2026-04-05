async function readJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }
    return response.json();
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function formatNumber(value) {
    if (typeof value !== 'number') {
        return '--';
    }
    return new Intl.NumberFormat('en-US').format(value);
}

function setStatus(message, error = false) {
    const status = document.getElementById('discord-live-status');
    if (!status) return;
    status.textContent = message;
    status.style.color = error ? '#d7b9b9' : 'var(--muted)';
}

function formatTeamRole(role) {
    const normalized = String(role || '').toLowerCase();
    if (normalized.includes('principal developer')) {
        return '👑 Principal Developer';
    }
    if (normalized.includes('co-developer')) {
        return '🛠️ Co-Developer';
    }
    if (normalized.includes('developer')) {
        return '💻 Developer';
    }
    if (normalized.includes('owner')) {
        return '👑 Owner';
    }
    if (normalized.includes('team')) {
        return '✨ Team';
    }
    return `✨ ${role}`.trim();
}

function renderHierarchy(items) {
    const container = document.getElementById('discord-hierarchy-list');
    if (!container) return;
    if (!items.length) {
        container.innerHTML = '<div class="discord-empty-state">No hierarchy data available right now.</div>';
        return;
    }

    container.innerHTML = items.map((item) => {
        if (item.type === 'category') {
            return `<div class="discord-hierarchy-category">${escapeHtml(item.name)}</div>`;
        }
        const icon = item.type === 'voice' ? '🔊' : '#';
        return `
            <article class="discord-hierarchy-item">
                <span class="discord-hierarchy-icon">${icon}</span>
                <span class="discord-hierarchy-name">${escapeHtml(item.name)}</span>
            </article>
        `;
    }).join('');
}

function renderMembers(members) {
    const container = document.getElementById('discord-member-list');
    if (!container) return;
    if (!members.length) {
        container.innerHTML = '<div class="discord-empty-state">Widget member presence is not exposed right now.</div>';
        return;
    }

    container.innerHTML = members.map((member) => {
        const avatar = member.avatar_url
            ? `<img class="discord-member-avatar" src="${member.avatar_url}" alt="">`
            : `<span class="discord-member-avatar discord-member-avatar-fallback">${member.username.slice(0, 1)}</span>`;

        return `
            <article class="discord-member-item">
                <div class="discord-member-meta">
                    ${avatar}
                    <div>
                        <strong>${member.username}</strong>
                        <span>${member.status}</span>
                    </div>
                </div>
                <span class="discord-status-dot discord-status-${member.status}"></span>
            </article>
        `;
    }).join('');
}

function renderDiscord(data) {
    const icon = document.getElementById('discord-live-icon');
    const name = document.getElementById('discord-server-name');
    const description = document.getElementById('discord-server-description');
    const members = document.getElementById('discord-member-count');
    const online = document.getElementById('discord-online-count');
    const invite = document.getElementById('discord-invite-link');

    if (icon) {
        if (data.icon_url) {
            icon.innerHTML = `<img src="${data.icon_url}" alt="">`;
        } else {
            icon.textContent = (data.server_name || 'N').slice(0, 1);
        }
    }

    if (name) name.textContent = data.server_name || 'Nightcord';
    if (description) description.textContent = data.description || 'Join the Nightcord Discord server.';
    if (members) members.textContent = formatNumber(data.member_count);
    if (online) online.textContent = formatNumber(data.online_count);
    if (invite && data.invite_url) invite.href = data.invite_url;

    renderHierarchy(Array.isArray(data.hierarchy) ? data.hierarchy : []);
    renderMembers(Array.isArray(data.members) ? data.members : []);
}

function renderTeamMembers(containerId, members) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!members.length) {
        container.innerHTML = '<div class="discord-empty-state">No visible profiles in this group yet.</div>';
        return;
    }

    container.innerHTML = members.map((member) => {
        const avatar = member.avatar_url
            ? `<img class="team-avatar-image" src="${escapeHtml(member.avatar_url)}" alt="">`
            : `<span class="team-avatar-fallback">${escapeHtml(member.global_name.slice(0, 1))}</span>`;

        const statusMap = { online: 'Online', idle: 'Away', dnd: 'Do Not Disturb', offline: 'Offline' };
        const statusLabel = member.custom_status
            ? escapeHtml(member.custom_status)
            : (member.blurb ? escapeHtml(member.blurb) : statusMap[member.status] || 'Offline');

        return `
            <article class="team-card glass-dark">
                <div class="team-avatar-wrap">
                    <div class="team-avatar">${avatar}</div>
                    <span class="discord-status-dot discord-status-${escapeHtml(member.status || 'offline')}"></span>
                </div>
                <h4>${escapeHtml(member.global_name)}</h4>
                <p>${statusLabel}</p>
            </article>
        `;
    }).join('');
}

function renderTeam(data) {
    const title = document.getElementById('team-title');
    const subtitle = document.getElementById('team-subtitle');
    if (title) title.textContent = data.title || 'Meet the Team';
    if (subtitle) subtitle.textContent = data.subtitle || 'The people building Nightcord right now.';

    const members = Array.isArray(data.members) ? data.members : [];
    renderTeamMembers('team-owner-grid', members.filter((member) => member.section === 'Owner'));
    renderTeamMembers('team-core-grid', members.filter((member) => member.section === 'Team'));
    renderTeamMembers('team-moderation-grid', members.filter((member) => member.section === 'Moderation'));
    renderTeamMembers('team-helper-grid', members.filter((member) => member.section === 'Helper'));
    renderTeamMembers('team-contributor-grid', members.filter((member) => member.section === 'Contributor'));
}

async function bootCommunityDiscord() {
    try {
        const payload = await readJson('/api/community/discord');
        renderDiscord(payload);
    } catch (error) {
        console.error(error);
        setStatus('Discord data unavailable right now.', true);
        renderHierarchy([]);
        renderMembers([]);
    }
}

async function bootCommunityTeam() {
    try {
        const payload = await readJson('/api/community/team');
        renderTeam(payload);
    } catch (error) {
        console.error(error);
        const subtitle = document.getElementById('team-subtitle');
        if (subtitle) {
            subtitle.textContent = 'Public Discord profiles are unavailable right now.';
        }
        renderTeamMembers('team-owner-grid', []);
        renderTeamMembers('team-core-grid', []);
        renderTeamMembers('team-moderation-grid', []);
        renderTeamMembers('team-helper-grid', []);
        renderTeamMembers('team-contributor-grid', []);
    }
}

bootCommunityTeam();
bootCommunityDiscord();