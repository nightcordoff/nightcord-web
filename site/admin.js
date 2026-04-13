const session = {
    token: localStorage.getItem('nightcord.session.token') || '',
    user: null,
};

const elements = {
    status: document.getElementById('header-status'),
    footer: document.getElementById('footer-runtime'),
    seededCreds: document.getElementById('seeded-creds'),
    authStatus: document.getElementById('auth-status'),
    adminStatus: document.getElementById('admin-status'),
    loginForm: document.getElementById('login-form'),
    loginEmail: document.getElementById('login-email'),
    loginPassword: document.getElementById('login-password'),
    logoutButton: document.getElementById('logout-button'),
    passwordForm: document.getElementById('password-form'),
    currentPassword: document.getElementById('current-password'),
    newPassword: document.getElementById('new-password'),
    createUserForm: document.getElementById('create-user-form'),
    createEmail: document.getElementById('create-email'),
    createDisplayName: document.getElementById('create-display-name'),
    createAdminTitle: document.getElementById('create-admin-title'),
    createPassword: document.getElementById('create-password'),
    createRole: document.getElementById('create-role'),
    createManageAdmins: document.getElementById('create-manage-admins'),
    userList: document.getElementById('user-list'),
};

async function readJson(url, options) {
    const response = await fetch(url, {
        headers: {
            ...(session.token ? { Authorization: `Bearer ${session.token}` } : {}),
            ...(options?.headers || {}),
        },
        ...options,
    });
    if (!response.ok) {
        let message = `Request failed: ${response.status}`;
        try {
            const payload = await response.json();
            message = payload.error || message;
        } catch {
            // ignore
        }
        throw new Error(message);
    }
    return response.json();
}

function setHeaderStatus(message, ok = true) {
    elements.status.textContent = message;
    elements.status.style.color = ok ? 'var(--teal)' : '#ff9ccf';
    elements.status.style.background = ok ? 'rgba(122, 244, 209, 0.08)' : 'rgba(255, 126, 201, 0.1)';
}

function setAuthStatus(message, error = false) {
    elements.authStatus.textContent = message;
    elements.authStatus.style.color = error ? '#ffb6d4' : 'var(--muted)';
}

function setAdminStatus(message, error = false) {
    elements.adminStatus.textContent = message;
    elements.adminStatus.style.color = error ? '#ffb6d4' : 'var(--muted)';
}

function renderSeededCreds(auth) {
    elements.seededCreds.innerHTML = `
        <strong>Seeded superadmin</strong>
        <div>${auth.default_superadmin.email}</div>
        <div>${auth.default_superadmin.password}</div>
        <div>${auth.admin_count} active admin account(s).</div>
    `;
}

function setSession(token, user) {
    session.token = token;
    session.user = user;
    if (token) {
        localStorage.setItem('nightcord.session.token', token);
    } else {
        localStorage.removeItem('nightcord.session.token');
    }
    renderSession();
}

function renderSession() {
    if (session.user) {
        setAuthStatus(`Logged in as ${session.user.display_name} (${session.user.role})`);
    } else {
        setAuthStatus('Not authenticated.');
        elements.userList.innerHTML = '';
    }
}

function renderUsers(users) {
    elements.userList.innerHTML = users.map((user) => `
        <article class="user-card" data-user-id="${user.id}">
            <div class="user-head">
                <div>
                    <h4>${user.display_name}</h4>
                    <p class="user-meta">${user.email}</p>
                </div>
                <small>${user.role}</small>
            </div>
            <div class="user-fields">
                <label>
                    <span>Display name</span>
                    <input type="text" data-field="display_name" value="${user.display_name}">
                </label>
                <label>
                    <span>Admin title</span>
                    <input type="text" data-field="admin_title" value="${user.admin_title || ''}">
                </label>
                <label>
                    <span>Role</span>
                    <select data-field="role">
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>admin</option>
                        <option value="superadmin" ${user.role === 'superadmin' ? 'selected' : ''}>superadmin</option>
                        <option value="viewer" ${user.role === 'viewer' ? 'selected' : ''}>viewer</option>
                    </select>
                </label>
                <label class="checkbox-row">
                    <input type="checkbox" data-field="can_manage_admins" ${user.can_manage_admins ? 'checked' : ''}>
                    <span>Can manage admins</span>
                </label>
                <label class="checkbox-row">
                    <input type="checkbox" data-field="active" ${user.active ? 'checked' : ''}>
                    <span>Active</span>
                </label>
            </div>
            <div class="user-actions">
                <button class="button button-secondary" type="button" data-action="save">Save changes</button>
            </div>
        </article>
    `).join('');
}

async function loadOverview() {
    const health = await readJson(getApiUrl('/api/health'));
    setHeaderStatus(`API ${health.status}`);
    const overview = await readJson(getApiUrl('/api/overview'));
    elements.footer.textContent = `${overview.brand} runtime · ${overview.runtime}`;
    renderSeededCreds(overview.auth);
}

async function loadUsers() {
    if (!session.user?.can_manage_admins) {
        elements.userList.innerHTML = '';
        return;
    }
    const payload = await readJson(getApiUrl('/api/admin/users'));
    renderUsers(payload.users);
    setAdminStatus(`Loaded ${payload.users.length} account(s).`);
}

async function refreshSession() {
    if (!session.token) {
        renderSession();
        return;
    }
    try {
        const payload = await readJson(getApiUrl('/api/auth/me'));
        session.user = payload.user;
        renderSession();
        await loadUsers();
    } catch {
        setSession('', null);
    }
}

elements.loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
        const payload = await readJson(getApiUrl('/api/auth/login'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: elements.loginEmail.value,
                password: elements.loginPassword.value,
            }),
        });
        setSession(payload.token, payload.user);
        elements.loginPassword.value = '';
        await loadUsers();
    } catch (error) {
        setAuthStatus(error.message, true);
    }
});

elements.logoutButton.addEventListener('click', async () => {
    try {
        await readJson(getApiUrl('/api/auth/logout'), { method: 'POST' });
    } catch {
        // ignore logout errors
    }
    setSession('', null);
    setAdminStatus('Logged out.');
});

elements.passwordForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
        await readJson(getApiUrl('/api/auth/change-password'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                current_password: elements.currentPassword.value,
                new_password: elements.newPassword.value,
            }),
        });
        elements.currentPassword.value = '';
        elements.newPassword.value = '';
        setAuthStatus('Password updated.');
    } catch (error) {
        setAuthStatus(error.message, true);
    }
});

elements.createUserForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
        await readJson(getApiUrl('/api/admin/users'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: elements.createEmail.value,
                display_name: elements.createDisplayName.value,
                admin_title: elements.createAdminTitle.value,
                password: elements.createPassword.value,
                role: elements.createRole.value,
                can_manage_admins: elements.createManageAdmins.checked,
            }),
        });
        elements.createUserForm.reset();
        await loadUsers();
        setAdminStatus('Account created.');
    } catch (error) {
        setAdminStatus(error.message, true);
    }
});

elements.userList.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action="save"]');
    if (!button) return;
    const card = button.closest('[data-user-id]');
    const userId = card.dataset.userId;

    try {
        await readJson(getApiUrl(`/api/admin/users/${userId}`), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                display_name: card.querySelector('[data-field="display_name"]').value,
                admin_title: card.querySelector('[data-field="admin_title"]').value,
                role: card.querySelector('[data-field="role"]').value,
                can_manage_admins: card.querySelector('[data-field="can_manage_admins"]').checked,
                active: card.querySelector('[data-field="active"]').checked,
            }),
        });
        await loadUsers();
        setAdminStatus('Account updated.');
    } catch (error) {
        setAdminStatus(error.message, true);
    }
});

Promise.all([loadOverview(), refreshSession()]).catch((error) => {
    console.error(error);
    setHeaderStatus('API unavailable', false);
});