import { authApi } from './api/authApi';

const SESSION_KEY = 'qm_auth_session';
const JWT_KEY = 'qm_jwt_token';
const HISTORY_KEY = 'qm_history_';

// ─── Session helpers ──────────────────────────────────────────────────────
export function getSession() {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        const session = JSON.parse(raw);
        if (!session?.token || !session?.user?.email) return null;
        // Check exp in JWT payload
        const parts = session.token.split('.');
        if (parts.length !== 3) return null;
        const payload = JSON.parse(atob(
            parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            localStorage.removeItem(SESSION_KEY);
            localStorage.removeItem(JWT_KEY);
            return null;
        }
        return session;
    } catch { return null; }
}

export function logoutUser() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(JWT_KEY);
}

function saveSession(data) {
    const session = {
        token: data.token,
        user: {
            name: data.username,
            email: data.email,
            role: data.role,
            provider: data.provider,
        }
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(JWT_KEY, data.token);
    return session;
}

// ─── Register ─────────────────────────────────────────────────────────────
export async function registerWithEmail({ name, email, password }) {
    try {
        const { data } = await authApi.signup({ name, email, password });
        return { ok: true, session: saveSession(data) };
    } catch (err) {
        const msg = err.response?.data?.message ||
            err.response?.data?.errors?.email ||
            'Registration failed';
        return { ok: false, error: msg };
    }
}

// ─── Login ────────────────────────────────────────────────────────────────
export async function loginWithEmail({ email, password }) {
    try {
        const { data } = await authApi.login({ email, password });
        return { ok: true, session: saveSession(data) };
    } catch (err) {
        const msg = err.response?.data?.message || 'Invalid credentials';
        return { ok: false, error: msg };
    }
}

// ─── Google Login ─────────────────────────────────────────────────────────
// Decodes Google JWT credential client-side, then:
// 1. Tries login first (user may already exist from Google)
// 2. If login fails (user not found), registers them
// This avoids the "Email already registered" error on second Google login
export async function loginWithGoogleCredential(credentialResponse) {
    if (!credentialResponse?.credential) {
        return { ok: false, error: 'Google token not found.' };
    }
    try {
        const parts = credentialResponse.credential.split('.');
        const payload = JSON.parse(atob(
            parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        const email = payload.email || '';
        const name = payload.name || 'Google User';

        if (!email) return { ok: false, error: 'Google email missing.' };

        // Deterministic password derived from Google sub (unique per Google account)
        const googlePassword = `gauth_${payload.sub}`;

        // Try login first — if user already registered via Google
        try {
            const { data } = await authApi.login({ email, password: googlePassword });
            return { ok: true, session: saveSession(data) };
        } catch (_) {
            // Login failed → register the user
            const { data } = await authApi.signup({
                name,
                email,
                password: googlePassword,
            });
            return { ok: true, session: saveSession(data) };
        }
    } catch (err) {
        const msg = err.response?.data?.message || 'Google login failed. Please try again.';
        return { ok: false, error: msg };
    }
}

// ─── History (local) ──────────────────────────────────────────────────────
export function getUserHistory(email) {
    if (!email) return [];
    try {
        const raw = localStorage.getItem(HISTORY_KEY + email.toLowerCase());
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

export function addHistoryItem(email, item) {
    if (!email || !item?.detail) return;
    const key = HISTORY_KEY + email.toLowerCase();
    const current = getUserHistory(email);
    const updated = [{
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        ...item
    }, ...current].slice(0, 20);
    localStorage.setItem(key, JSON.stringify(updated));
}
