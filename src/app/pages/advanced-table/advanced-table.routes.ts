import { Routes } from '@angular/router';

export const ADVANCED_TABLE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../advanced-table/advanced-table.component').then(m => m.AdvancedTableComponent)
  }
];
