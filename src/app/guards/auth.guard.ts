import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Functional auth guard that redirects unauthenticated users to /login. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  if (auth.isAuthenticated()) return true;
  const router = inject(Router);
  return router.createUrlTree(['/login'], { queryParams: { redirectUrl: state.url } });
};
