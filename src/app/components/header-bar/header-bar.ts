import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle';
import { LangSwitcherComponent } from '../lang-switcher/lang-switcher';
import { AuthActionComponent } from '../auth-action/auth-action';

@Component({
  selector: 'app-header-bar',
  imports: [NzIconModule, ThemeToggleComponent, LangSwitcherComponent, AuthActionComponent],
  template: `
    <div class="app-header">
      <span class="header-trigger" (click)="onToggle()">
        <nz-icon class="trigger" [nzType]="isCollapsed() ? 'menu-unfold' : 'menu-fold'" />
      </span>
      <div class="lang-switcher">
        <app-theme-toggle></app-theme-toggle>
        <app-lang-switcher></app-lang-switcher>
        <app-auth-action></app-auth-action>
      </div>
    </div>
  `,
  styles: [
    `:host{display:block}`,
    `.app-header{position:relative;height:64px;padding:0;background:#fff;box-shadow:0 1px 4px rgba(0,21,41,.08)}`,
    `.header-trigger{height:64px;padding:20px 24px;font-size:20px;cursor:pointer;transition:all .3s,padding 0s}`,
    `.header-trigger .trigger:hover{color:#1890ff}`,
    `.lang-switcher{position:absolute;right:16px;top:0;height:64px;display:flex;align-items:center;gap:8px}`,
    `:host-context(.dark-theme) .app-header{background:#141414;color:#f0f0f0;box-shadow:0 1px 4px rgba(0,0,0,.45)}`
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderBarComponent {
  readonly isCollapsed = input<boolean>(false);
  readonly toggle = output<void>();
  onToggle() { this.toggle.emit(); }
}
