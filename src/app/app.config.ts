import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { icons } from './icons-provider';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import { en_US, provideNzI18n } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import cs from '@angular/common/locales/cs';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideTransloco } from '@ngneat/transloco';
import { provideTranslocoLoader } from '@ngneat/transloco';
import { TranslocoHttpLoader } from './i18n-loader';

registerLocaleData(en);
registerLocaleData(cs);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideNzIcons(icons),
    provideNzI18n(en_US),
    provideAnimationsAsync(),
    provideHttpClient(withFetch()),
    provideTransloco({
      config: {
        availableLangs: ['en', 'cs'],
        defaultLang: 'en',
        reRenderOnLangChange: true,
        fallbackLang: 'en',
        missingHandler: { useFallbackTranslation: true },
        prodMode: true,
      },
    }),
    provideTranslocoLoader(TranslocoHttpLoader),
  ],
};
