import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { NzI18nService } from 'ng-zorro-antd/i18n';
import { en_US, cs_CZ } from 'ng-zorro-antd/i18n';
import { isPlatformBrowser, registerLocaleData } from '@angular/common';
import { cs as dfCs, enUS as dfEnUS } from 'date-fns/locale';
import en from '@angular/common/locales/en';
import cs from '@angular/common/locales/cs';

registerLocaleData(en);
registerLocaleData(cs);

export type AppLang = 'en' | 'cs';

@Injectable({ providedIn: 'root' })
export class LocaleService {
  readonly lang = signal<AppLang>('en');
  private readonly platformId = inject(PLATFORM_ID);

  constructor(private transloco: TranslocoService, private nzI18n: NzI18nService) {
    // Preload available languages to avoid key flicker on first switch
    this.transloco.load('en').subscribe({ next: () => {}, error: () => {} });
    this.transloco.load('cs').subscribe({ next: () => {}, error: () => {} });

    // Initialize from persisted preference if available
    let initial: AppLang = 'en';
    if (isPlatformBrowser(this.platformId)) {
      const saved = (localStorage.getItem('app.lang') as AppLang | null);
      if (saved === 'en' || saved === 'cs') {
        initial = saved;
      }
    }
    this.apply(initial);
  }

  set(lang: AppLang) {
    if (lang === this.lang()) return;
    this.apply(lang);
  }

  private apply(lang: AppLang) {
    this.lang.set(lang);
    this.transloco.setActiveLang(lang);
    this.nzI18n.setLocale(lang === 'cs' ? cs_CZ : en_US);
    // Set date-fns locale so components like DatePicker have correct week start (Mon for CZ)
    this.nzI18n.setDateLocale(lang === 'cs' ? dfCs : dfEnUS);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('app.lang', lang);
      document.documentElement.lang = lang;
    }
  }
}
