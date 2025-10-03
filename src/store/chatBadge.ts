// Simple global unread badge store with localStorage persistence
// Avoids external deps; components can subscribe to sync UI.

type Listener = (count: number) => void;

class ChatBadgeStore {
  private count = 0;
  private userId: string | null = null;
  private listeners = new Set<Listener>();

  private get storageKey() {
    return this.userId ? `chat:badge:${this.userId}` : null;
  }

  setUser(userId: string | null) {
    this.userId = userId || null;
    // load persisted value for this user
    const key = this.storageKey;
    if (!key) {
      this.set(0, false);
      return;
    }
    try {
      const raw = window.localStorage.getItem(key);
      const n = raw ? parseInt(raw, 10) : 0;
      this.set(Number.isFinite(n) ? n : 0, false);
    } catch {
      this.set(0, false);
    }
  }

  get() {
    return this.count;
  }

  set(n: number, persist: boolean = true) {
    const next = Math.max(0, n | 0);
    if (next === this.count) return;
    this.count = next;
    if (persist) {
      const key = this.storageKey;
      if (key) {
        try {
          window.localStorage.setItem(key, String(this.count));
        } catch {
          // ignore storage errors
        }
      }
    }
    this.listeners.forEach((fn) => {
      try {
        fn(this.count);
      } catch {
        // no-op
      }
    });
  }

  increment(delta = 1) {
    this.set(this.count + (delta | 0));
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}

export const chatBadge = new ChatBadgeStore();

