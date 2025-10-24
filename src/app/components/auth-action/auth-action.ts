import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { TranslocoPipe } from '@ngneat/transloco';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-action',
  imports: [NzButtonModule, RouterLink, TranslocoPipe],
  template: `
    @if (auth.isAuthenticated()) {
      <button nz-button nzType="default" (click)="logout()">{{ 'app.actions.logout' | transloco }}</button>
    } @else {
      <a nz-button nzType="default" routerLink="/login">{{ 'login.logIn' | transloco }}</a>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthActionComponent {
  readonly auth = inject(AuthService);
  logout() { this.auth.logout(); }
}
