import { HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { inject } from '@angular/core';

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    console.log('Interceptor: Processing request', req.url); // Debug
    const authService = inject(AuthService);
    const token = authService.getToken();
    console.log('Interceptor: Token', token); // Debug
    console.log('Interceptor: environment.apiBaseUrl', environment.apiBaseUrl); // Debug
    if (token && req.url.includes(environment.apiBaseUrl)) {
        const cloned = req.clone({
            headers: req.headers.set('Authorization', `Bearer ${token}`)
        });
        console.log('Interceptor: Added Authorization header', cloned.headers.get('Authorization')); // Debug
        return next(cloned);
    }
    console.log('Interceptor: No token or non-API request'); // Debug
    return next(req);
}