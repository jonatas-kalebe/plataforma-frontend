import { Routes } from '@angular/router';

export const PAGES_ROUTES: Routes = [
  {
    path: '',

    loadComponent: () =>
      import('./landing/landing.component').then(
        (c) => c.LandingComponent
      ),
    title: 'Athenity - Inovação em Software',
  },
];
