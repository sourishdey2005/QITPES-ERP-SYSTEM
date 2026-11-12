// Owner login (Supabase-free) helpers.
//
// The owner account is validated locally in pages/Login.tsx. The flag stored in
// localStorage is the single source of truth for that login mode, so an empty
// Supabase session can never overwrite it and bounce the user back to /login.

export const OWNER_EMAIL = 'duttaarunima50@gmail.com';
export const OWNER_PASSWORD = '123456789';
export const OWNER_LOGIN_KEY = 'qitpes_owner_login';
export const OWNER_LOGIN_EVENT = 'qitpes-owner-login';
export const OWNER_LOGOUT_EVENT = 'qitpes-owner-logout';

export const isOwnerLoggedIn = (): boolean => {
  try {
    return localStorage.getItem(OWNER_LOGIN_KEY) === 'true';
  } catch {
    return false;
  }
};

export const setOwnerLoggedIn = (): void => {
  try {
    localStorage.setItem(OWNER_LOGIN_KEY, 'true');
  } catch {
    // localStorage can be unavailable (private mode); the in-memory
    // event below still logs the owner in for this tab session.
  }
  window.dispatchEvent(new Event(OWNER_LOGIN_EVENT));
};

export const clearOwnerLogin = (): void => {
  try {
    localStorage.removeItem(OWNER_LOGIN_KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(OWNER_LOGOUT_EVENT));
};

export const createOwnerSession = () => ({
  access_token: 'local-owner-session',
  token_type: 'bearer',
  user: {
    id: 'local-owner',
    email: OWNER_EMAIL,
    user_metadata: { full_name: 'Owner' },
  },
});

export const isValidOwnerCredentials = (email: string, password: string): boolean =>
  email.trim().toLowerCase() === OWNER_EMAIL.toLowerCase() &&
  password.trim() === OWNER_PASSWORD;
