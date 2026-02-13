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

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_KEY);
}

export function setAdminToken(token: string): void {
  localStorage.setItem(ADMIN_KEY, token);
}

export function clearAdminToken(): void {
  localStorage.removeItem(ADMIN_KEY);
}
