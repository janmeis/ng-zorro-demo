import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslocoPipe } from '@ngneat/transloco';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'theme-toggle' },
  template: `
    <button
      type="button"
      class="theme-btn"
      (click)="theme.toggle()"
      [attr.aria-pressed]="isDark()"
      [attr.title]="(nextTitleKey() | transloco)"
      [attr.aria-label]="(nextTitleKey() | transloco)"
    >
      <span class="theme-chip" [class.theme-chip--dark]="chipDark()"></span>
    </button>
  `,
  styles: [
    `
    .theme-btn {
      background: transparent;
      border: none;
      padding: 6px 8px;
      border-radius: 4px;
      cursor: pointer;
      color: inherit;
      outline: 1px solid transparent;
    }

    .theme-btn:hover,
    .theme-btn[aria-pressed="true"] {
      outline: 1px solid #1890ff;
    }

    :host-context(.dark-theme) .theme-btn:hover,
    :host-context(.dark-theme) .theme-btn[aria-pressed="true"] {
      outline: 1px solid #177ddc;
    }

    .theme-chip {
      display: block;
      width: 32px;
      height: 16px;
      border-radius: 2px;
      background: #ffffff;
      border: 1px solid #d9d9d9;
    }

    .theme-chip--dark {
      background: #000000;
      border-color: #434343;
    }
    `,
  ],
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeService);
  readonly isDark = computed(() => this.theme.theme() === 'dark');
  readonly nextTitleKey = computed(() => (this.isDark() ? 'app.actions.light' : 'app.actions.dark'));
  readonly chipDark = computed(() => !this.isDark());
}
