import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { TranslocoPipe } from '@ngneat/transloco';
import { LocaleService } from '../../services/locale.service';

@Component({
  selector: 'app-lang-switcher',
  imports: [NgOptimizedImage, TranslocoPipe],
  template: `
    <button
      type="button"
      class="lang-btn"
      (click)="locale.set('en')"
      [attr.aria-pressed]="locale.lang()==='en'"
      [attr.title]="('app.actions.english' | transloco)"
    >
      <img ngSrc="/assets/flags/gb.svg" width="32" height="16" [attr.alt]="('app.actions.english' | transloco)" class="lang-flag" />
    </button>
    <button
      type="button"
      class="lang-btn"
      (click)="locale.set('cs')"
      [attr.aria-pressed]="locale.lang()==='cs'"
      [attr.title]="('app.actions.czech' | transloco)"
    >
      <img ngSrc="/assets/flags/cz.svg" width="24" height="16" [attr.alt]="('app.actions.czech' | transloco)" class="lang-flag" />
    </button>
  `,
  styles: [
    `:host{display:contents}`,
    `.lang-btn{background:transparent;border:none;padding:6px;border-radius:4px;cursor:pointer;outline:1px solid transparent}`,
    `.lang-btn[aria-pressed="true"],.lang-btn:hover{outline:1px solid #1890ff}`,
    `:host-context(.dark-theme) .lang-btn[aria-pressed="true"],:host-context(.dark-theme) .lang-btn:hover{outline:1px solid #177ddc}`,
    `.lang-flag{display:block;box-shadow:0 0 1px rgba(0,0,0,.2)}`
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LangSwitcherComponent {
  readonly locale = inject(LocaleService);
}
