import { useEffect, useState } from "react";

export type Role = "officer" | "admin";

export interface Session {
  name: string;
  role: Role;
  dept: string;
}

const KEY = "mplads.session";

export function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function writeSession(s: Session) {
  window.localStorage.setItem(KEY, JSON.stringify(s));
}

export function clearSession() {
  window.localStorage.removeItem(KEY);
}

/** Hydration-safe session read. */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setSession(readSession());
    setReady(true);
  }, []);
  return { session, ready, setSession };
}
