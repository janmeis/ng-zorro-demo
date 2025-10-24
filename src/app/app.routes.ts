import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/welcome' },
  { path: 'welcome', canActivate: [authGuard], loadChildren: () => import('./pages/welcome/welcome.routes').then(m => m.WELCOME_ROUTES) },
  { path: 'login', loadChildren: () => import('./pages/login/login.routes').then(m => m.LOGIN_ROUTES) },
  { path: 'basic-form', canActivate: [authGuard], loadChildren: () => import('./pages/basic-form/basic-form.routes').then(m => m.BASIC_FORM_ROUTES) },
  { path: 'basic-table', canActivate: [authGuard], loadChildren: () => import('./pages/basic-table/basic-table.routes').then(m => m.BASIC_TABLE_ROUTES) }
];
