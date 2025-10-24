import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink, RouterOutlet, Router } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { LocaleService } from './services/locale.service';
import { ThemeService } from './services/theme.service';
import { ThemeToggleComponent } from './components/theme-toggle/theme-toggle';
import { TranslocoPipe } from '@ngneat/transloco';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet, NzIconModule, NzLayoutModule, NzMenuModule, NzButtonModule, TranslocoPipe, NgOptimizedImage, ThemeToggleComponent],
  templateUrl: './app.html',
  styleUrl: './app.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  isCollapsed = false;
  readonly locale = inject(LocaleService);
  readonly theme = inject(ThemeService);
  readonly auth = inject(AuthService);
  private readonly _router = inject(Router);

  isActive = (path: string) => this._router.url.startsWith(path);
}
