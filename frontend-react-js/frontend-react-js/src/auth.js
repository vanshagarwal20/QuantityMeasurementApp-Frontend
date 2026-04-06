const USERS_KEY = 'qm_users';
const SESSION_KEY = 'qm_auth_session';
const HISTORY_PREFIX = 'qm_history_';

function readJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function toBase64Url(value) {
    const encoded = btoa(unescape(encodeURIComponent(value)));
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value) {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    return decodeURIComponent(escape(atob(padded)));
}

function createJwt(user) {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        sub: user.email,
        name: user.name,
        email: user.email,
        iat: now,
        exp: now + (7 * 24 * 60 * 60)
    };

    const header = { alg: 'HS256', typ: 'JWT' };
    const headerPart = toBase64Url(JSON.stringify(header));
    const payloadPart = toBase64Url(JSON.stringify(payload));
    const signaturePart = toBase64Url(`${user.email}.${now}.${Math.random().toString(36).slice(2)}`);

    return `${headerPart}.${payloadPart}.${signaturePart}`;
}

function getUsers() {
    return readJSON(USERS_KEY, []);
}

function saveUsers(users) {
    writeJSON(USERS_KEY, users);
}

function saveSession(user) {
    const token = createJwt(user);
    const session = { token, user };
    writeJSON(SESSION_KEY, session);
    return session;
}

export function getSession() {
    const session = readJSON(SESSION_KEY, null);
    if (!session?.token || !session?.user?.email) return null;

    try {
        const tokenParts = session.token.split('.');
        if (tokenParts.length !== 3) return null;
        const payload = JSON.parse(fromBase64Url(tokenParts[1]));
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            localStorage.removeItem(SESSION_KEY);
            return null;
        }
        return session;
    } catch {
        localStorage.removeItem(SESSION_KEY);
        return null;
    }
}

export function logoutUser() {
    localStorage.removeItem(SESSION_KEY);
}

export function registerWithEmail({ name, email, password }) {
    const normalizedEmail = email.trim().toLowerCase();
    const users = getUsers();
    const exists = users.find((u) => u.email === normalizedEmail);
    if (exists) {
        return { ok: false, error: 'Account already exists for this email.' };
    }

    const newUser = {
        name: name.trim(),
        email: normalizedEmail,
        password,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);
    return { ok: true, session: saveSession({ name: newUser.name, email: newUser.email }) };
}

export function loginWithEmail({ email, password }) {
    const normalizedEmail = email.trim().toLowerCase();
    const users = getUsers();
    const matchedUser = users.find((u) => u.email === normalizedEmail && u.password === password);

    if (!matchedUser) {
        return { ok: false, error: 'Invalid email or password.' };
    }

    return {
        ok: true,
        session: saveSession({ name: matchedUser.name, email: matchedUser.email })
    };
}

export function loginWithGoogleCredential(credentialResponse) {
    if (!credentialResponse?.credential) {
        return { ok: false, error: 'Google token not found.' };
    }

    try {
        const tokenParts = credentialResponse.credential.split('.');
        if (tokenParts.length < 2) return { ok: false, error: 'Invalid Google token.' };
        const payload = JSON.parse(fromBase64Url(tokenParts[1]));

        const user = {
            name: payload.name || 'Google User',
            email: (payload.email || '').toLowerCase()
        };

        if (!user.email) {
            return { ok: false, error: 'Google email missing.' };
        }

        return { ok: true, session: saveSession(user) };
    } catch {
        return { ok: false, error: 'Unable to decode Google token.' };
    }
}

export function getUserHistory(email) {
    if (!email) return [];
    return readJSON(`${HISTORY_PREFIX}${email.toLowerCase()}`, []);
}

export function addHistoryItem(email, item) {
    if (!email || !item?.detail) return;

    const key = `${HISTORY_PREFIX}${email.toLowerCase()}`;
    const current = readJSON(key, []);
    const updated = [{
        id: crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        at: new Date().toISOString(),
        ...item
    }, ...current].slice(0, 20);

    writeJSON(key, updated);
}