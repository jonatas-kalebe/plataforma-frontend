import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {routes} from './app.routes';
import {PreloadAllModules, provideRouter, withPreloading} from '@angular/router';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient() // Essencial para permitir chamadas de API
  ]
};
