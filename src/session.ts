import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { UserSession } from "./types.js";

type SessionStore = Record<string, UserSession>;

const DEFAULT_SESSIONS_PATH = "data/sessions.json";

function loadStore(path: string): SessionStore {
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf8")) as SessionStore;
  } catch {
    return {};
  }
}

function saveStore(path: string, store: SessionStore): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(store, null, 2), "utf8");
}

export function getSession(userId: string, path: string = DEFAULT_SESSIONS_PATH): UserSession {
  const store = loadStore(path);
  return store[userId] ?? { conversationStep: 0 };
}

export function updateSession(
  userId: string,
  updates: Partial<UserSession>,
  path: string = DEFAULT_SESSIONS_PATH
): UserSession {
  const store = loadStore(path);
  const current = store[userId] ?? { conversationStep: 0 };
  // Parsed filters use `undefined` for anything not mentioned this turn.
  // Spreading those in as-is would erase fields captured on earlier turns.
  const defined = Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined)
  ) as Partial<UserSession>;
  const merged: UserSession = { ...current, ...defined };
  store[userId] = merged;
  saveStore(path, store);
  return merged;
}

export function clearSession(userId: string, path: string = DEFAULT_SESSIONS_PATH): void {
  const store = loadStore(path);
  delete store[userId];
  saveStore(path, store);
}
