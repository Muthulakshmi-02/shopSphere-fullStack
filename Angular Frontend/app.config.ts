import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations'; // Use Noop if pkg is missing
import { routes } from './app.routes';
import { authInterceptor } from './Interceptor/authInterceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor])
    ),
    // This acts as a placeholder so the app doesn't crash
  ]
};