const NICKNAME_KEY = "ai-tool-atlas-nickname";
const ALIAS_ID_KEY = "ai-tool-atlas-alias-id";

const adjectives = [
  "Rask", "Smart", "Kreativ", "Digital", "Modig", "Rolig", "Skarp", "Stille",
  "Glad", "Kjapp", "Lur", "Fin", "Kul", "Ivrig", "Trygg", "Stødig",
];

const nouns = [
  "Panda", "Robot", "Ugle", "Rev", "Hauk", "Ulv", "Bjørn", "Hare",
  "Koala", "Delfin", "Ørn", "Falk", "Tiger", "Gepard", "Grevling", "Elg",
];

export function generateNickname(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 100);
  return `${adj}${noun}${num}`;
}

export function getNickname(): string | null {
  return localStorage.getItem(NICKNAME_KEY);
}

export function setNickname(nickname: string): void {
  localStorage.setItem(NICKNAME_KEY, nickname);
}

export function getAliasId(): string | null {
  return localStorage.getItem(ALIAS_ID_KEY);
}

export function setAliasId(id: string): void {
  localStorage.setItem(ALIAS_ID_KEY, id);
}

const ADMIN_KEY = "ai-tool-atlas-admin";
const ADMIN_EXP_KEY = "ai-tool-atlas-admin-exp";

/** Returns the current admin session token, or null if missing/expired. */
export function getAdminToken(): string | null {
  const token = localStorage.getItem(ADMIN_KEY);
  if (!token) return null;
  const exp = Number(localStorage.getItem(ADMIN_EXP_KEY) || 0);
  if (!exp || Date.now() >= exp) {
    clearAdminToken();
    return null;
  }
  return token;
}

export function setAdminToken(token: string, expiresAt?: number): void {
  localStorage.setItem(ADMIN_KEY, token);
  localStorage.setItem(
    ADMIN_EXP_KEY,
    String(expiresAt ?? Date.now() + 8 * 60 * 60 * 1000),
  );
}

export function clearAdminToken(): void {
  localStorage.removeItem(ADMIN_KEY);
  localStorage.removeItem(ADMIN_EXP_KEY);
}
