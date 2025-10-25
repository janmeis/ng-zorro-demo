import { Pipe, PipeTransform, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslocoService } from '@ngneat/transloco';

@Pipe({
  name: 'localDate',
  // Pure false so it re-runs when language changes; avoids coupling network requests to lang
  pure: false,
  standalone: true,
})
export class LocalDatePipe implements PipeTransform {
  private readonly t = inject(TranslocoService);

  private resolveLocale(): string {
    const lang = this.t.getActiveLang?.() ?? 'en';
    // Map app languages to locales used by DatePipe
    switch (lang) {
      case 'cs':
        return 'cs';
      case 'en':
      default:
        return 'en-US';
    }
  }

  transform(value: any, format: string = 'mediumDate', timezone?: string | null): string | null {
    const locale = this.resolveLocale();
    const datePipe = new DatePipe(locale);
    return datePipe.transform(value, format, timezone ?? undefined);
  }
}
