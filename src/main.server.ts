import { bootstrapApplication, type BootstrapContext } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

const bootstrap = (context: BootstrapContext) => {
  return bootstrapApplication(AppComponent, {
    ...config,
    providers: [
      ...config.providers,
      { provide: 'BOOTSTRAP_CONTEXT', useValue: context }
    ]
  });
};

export default bootstrap;
