import { Routes } from '@angular/router';

export const BASIC_FORM_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./basic-form.component').then(m => m.BasicFormComponent)
  }
];
