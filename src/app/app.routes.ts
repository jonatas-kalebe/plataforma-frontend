import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./pages/pages.routes').then(
        (r) => r.PAGES_ROUTES
      ),
  },
  {
    path: 'shell',
    loadComponent: () =>
      import('./pages/landing/landing.component').then(
        (c) => c.LandingComponent
      ),
    title: 'Athenity - Inovação em Software',
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
