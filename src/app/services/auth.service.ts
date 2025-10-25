import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Simple auth service using Angular signals.
 * - Persists a mock token and username in storage (localStorage when "remember" is true, otherwise sessionStorage).
 * - SSR-safe: guards all direct storage access.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _isAuthenticated = signal<boolean>(false);
  private readonly _username = signal<string | null>(null);
  private readonly _router = inject(Router);

  // public read-only selectors
  readonly isAuthenticated = computed(() => this._isAuthenticated());
  readonly username = computed(() => this._username());

  constructor() {
    // Initialize from storage (SSR-safe)
    const store = getBestStorage();
    if (store) {
      const token = store.getItem(AUTH_TOKEN_KEY);
      const username = store.getItem(AUTH_USERNAME_KEY);
      if (token && username) {
        this._isAuthenticated.set(true);
        this._username.set(username);
      }
    }
  }

  /**
   * Mock login: accepts any non-empty credentials.
   * When remember=true uses localStorage, else sessionStorage.
   */
  login(username: string, password: string, remember: boolean): boolean {
    if (!username || !password) return false;
    const store = remember ? getLocalStorage() : getSessionStorage();
    if (store) {
      store.setItem(AUTH_TOKEN_KEY, 'mock-token');
      store.setItem(AUTH_USERNAME_KEY, username);
    }
    this._isAuthenticated.set(true);
    this._username.set(username);
    return true;
  }

  logout(): void {
    // clear from both storages to be safe
    getLocalStorage()?.removeItem(AUTH_TOKEN_KEY);
    getLocalStorage()?.removeItem(AUTH_USERNAME_KEY);
    getSessionStorage()?.removeItem(AUTH_TOKEN_KEY);
    getSessionStorage()?.removeItem(AUTH_USERNAME_KEY);
    this._isAuthenticated.set(false);
    this._username.set(null);
    // redirect to login
    this._router.navigateByUrl('/login');
  }
}

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USERNAME_KEY = 'auth_username';

function getBestStorage(): Storage | null {
  return getLocalStorage() ?? getSessionStorage();
}

function getLocalStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && 'localStorage' in window) return window.localStorage;
  } catch {}
  return null;
}

function getSessionStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && 'sessionStorage' in window) return window.sessionStorage;
  } catch {}
  return null;
}
