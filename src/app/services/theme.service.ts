import { Injectable, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly storageKey = 'app-theme';
  private readonly darkLinkId = 'nz-theme-dark-link';
  readonly theme = signal<Theme>('light');

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Initialize from storage
      const saved = (localStorage.getItem(this.storageKey) as Theme | null) ?? 'light';
      this.theme.set(saved);

      // Apply on changes
      effect(() => {
        const t = this.theme();
        this.applyTheme(t);
        try {
          localStorage.setItem(this.storageKey, t);
        } catch {}
      });
    }
  }

  set(theme: Theme) {
    this.theme.set(theme);
  }

  toggle() {
    this.theme.update((t) => (t === 'light' ? 'dark' : 'light'));
  }

  private applyTheme(theme: Theme) {
    if (!isPlatformBrowser(this.platformId)) return;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark-theme');
      this.loadDarkStylesheet();
    } else {
      root.classList.remove('dark-theme');
      this.unloadDarkStylesheet();
    }
  }

  private loadDarkStylesheet() {
    const doc = document;
    let link = doc.getElementById(this.darkLinkId) as HTMLLinkElement | null;
    if (link) return; // already loaded
    link = doc.createElement('link');
    link.id = this.darkLinkId;
    link.rel = 'stylesheet';
    link.href = this.resolveThemeHref('theme-dark.css');
    doc.head.appendChild(link);
  }

  private unloadDarkStylesheet() {
    const link = document.getElementById(this.darkLinkId);
    if (link && link.parentNode) {
      link.parentNode.removeChild(link);
    }
  }

  private resolveThemeHref(file: string): string {
    // Respect <base href> from index.html; using relative URL is typically sufficient
    // This also works in dev server and production as the CSS is emitted to root
    return file;
  }
}
