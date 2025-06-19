import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    constructor(private authService: AuthService, private router: Router) {}

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean> | boolean {
        return this.authService.sessionReady$.pipe(
            take(1),
            switchMap(ready => {
                if (!ready) {
                    return this.authService.validateSession();
                }
                return this.authService.currentUser$.pipe(
                    take(1),
                    map(user => {
                        console.log('AuthGuard: Checking user for route', state.url, user); // Debug
                        if (!user || !this.authService.isLoggedIn()) {
                            console.log('AuthGuard: Redirecting to login'); // Debug
                            this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
                            return false;
                        }

                        // Only restrict /add to admins, allow /edit and /users for both
                        const adminOnlyRoutes = ['/add'];
                        const requiresAdmin = adminOnlyRoutes.some(path => state.url === path || state.url.startsWith(path));
                        if (requiresAdmin && user.role !== 'admin') {
                            console.log('AuthGuard: Redirecting to user-details (not admin)'); // Debug
                            this.router.navigate(['/user-details']);
                            return false;
                        }

                        return true;
                    })
                );
            })
        );
    }
}