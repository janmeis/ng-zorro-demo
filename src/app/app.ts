import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet, Router } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { ThemeService } from './services/theme.service';
import { HeaderBarComponent } from './components/header-bar/header-bar';
import { TranslocoPipe } from '@ngneat/transloco';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet, NzIconModule, NzLayoutModule, NzMenuModule, TranslocoPipe, HeaderBarComponent],
  templateUrl: './app.html',
  styleUrl: './app.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  isCollapsed = false;
  readonly theme = inject(ThemeService);
  private readonly _router = inject(Router);

  isActive = (path: string) => this._router.url.startsWith(path);
}
