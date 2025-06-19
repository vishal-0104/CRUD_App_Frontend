import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, tap, switchMap, delay } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthResponse, User } from './auth.types';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
    sub: string;
    role: string;
    iat: number;
    exp: number;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = `${environment.apiBaseUrl}/api/auth`;
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();
    private sessionReadySubject = new BehaviorSubject<boolean>(false);
    public sessionReady$ = this.sessionReadySubject.asObservable();

    constructor(private http: HttpClient) {
        this.initializeUser();
    }

    private initializeUser(): void {
        const user = localStorage.getItem('currentUser');
        const token = localStorage.getItem('token');
        console.log('Initializing user:', { user, token }); // Debug
        if (user && token && this.isTokenValid(token)) {
            const parsedUser = JSON.parse(user);
            this.currentUserSubject.next(parsedUser);
            this.sessionReadySubject.next(true);
            this.validateSession().pipe(delay(100)).subscribe(isValid => {
                console.log('Session validation result:', isValid); // Debug
                if (!isValid) {
                    this.logout();
                }
            });
        } else {
            this.logout();
        }
    }

    signup(email: string, password: string, name: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/signup`, { name, email, password }).pipe(
            tap(response => {
                console.log('Signup response:', response); // Debug
                if (response.token) {
                    this.setUserSession(response);
                }
            })
        );
    }

    login(email: string, password: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
            tap(response => {
                console.log('Login response:', response); // Debug
                if (response.token) {
                    this.setUserSession(response);
                    this.validateSession().pipe(delay(100)).subscribe(isValid => {
                        if (!isValid) {
                            this.logout();
                        }
                    });
                } else {
                    console.error('No token in login response:', response); // Debug
                }
            })
        );
    }

    private setUserSession(response: AuthResponse): void {
        const user: User = {
            id: response.id,
            name: response.name,
            email: response.email,
            role: response.role
        };
        localStorage.setItem('token', response.token!);
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('role', response.role);
        localStorage.setItem('name', response.name);
        console.log('Session set:', { user, token: response.token }); // Debug
        this.currentUserSubject.next(user);
        this.sessionReadySubject.next(true);
    }

    logout(): void {
        console.log('Logging out'); // Debug
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('role');
        localStorage.removeItem('name');
        this.currentUserSubject.next(null);
        this.sessionReadySubject.next(false);
    }

    isLoggedIn(): boolean {
        const token = localStorage.getItem('token');
        const isValid = !!token && this.isTokenValid(token);
        console.log('isLoggedIn:', isValid); // Debug
        return isValid;
    }

    getToken(): string | null {
        const token = localStorage.getItem('token');
        console.log('getToken:', token); // Debug
        return token;
    }

    updateCurrentUser(updatedUser: User): void {
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        localStorage.setItem('role', updatedUser.role);
        localStorage.setItem('name', updatedUser.name);
        this.currentUserSubject.next(updatedUser);
        console.log('Updated current user:', updatedUser); // Debug
    }

    private isTokenValid(token: string): boolean {
        try {
            const decodedToken = jwtDecode<DecodedToken>(token);
            const currentTime = Math.floor(Date.now() / 1000);
            const isValid = decodedToken.exp > currentTime;
            console.log('Token valid:', isValid, decodedToken); // Debug
            return isValid;
        } catch (error) {
            console.error('Invalid token:', error); // Debug
            return false;
        }
    }

    validateSession(): Observable<boolean> {
        if (!this.isLoggedIn()) {
            console.log('validateSession: Not logged in'); // Debug
            return of(false);
        }
        return this.http.get<User>(`${environment.apiBaseUrl}/api/users/me`).pipe(
            tap(user => {
                console.log('validateSession: User fetched', user); // Debug
                this.updateCurrentUser(user);
                this.sessionReadySubject.next(true);
            }),
            switchMap(() => of(true)),
            catchError(error => {
                console.error('Session validation failed:', error); // Debug
                // Only logout on 401 (Unauthorized), not 403 (Forbidden)
                if (error.status === 401) {
                    this.logout();
                }
                return of(false);
            })
        );
    }

    // validateSession(): Observable<boolean> {
    //     if (!this.isLoggedIn()) {
    //         console.log('validateSession: Not logged in'); // Debug
    //         return of(false); // Don't call logout() here
    //     }
    //     return this.http.get<User>(`${environment.apiBaseUrl}/api/users/me`).pipe(
    //         tap(user => {
    //             console.log('validateSession: User fetched', user); // Debug
    //             this.updateCurrentUser(user);
    //             this.sessionReadySubject.next(true);
    //         }),
    //         switchMap(() => of(true)),
    //         catchError(error => {
    //             console.error('Session validation failed:', error); // Debug
    //             return of(false); // Don't call logout() here
    //         })
    //     );
    // }
}