import { Routes } from '@angular/router';

export const BASIC_TABLE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./basic-table.component').then(m => m.BasicTableComponent)
  }
];
