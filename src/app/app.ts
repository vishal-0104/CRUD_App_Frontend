import { Component, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth/auth.service';
import { User } from './auth/auth.types';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [
        CommonModule,
        RouterOutlet,
        RouterLink,
        RouterLinkActive,
        MatToolbarModule,
        MatSidenavModule,
        MatIconModule,
        MatButtonModule
    ],
    templateUrl: './app.html',
    styleUrls: ['./app.css']
})
export class AppComponent {
    isSidenavOpen = false;
    isMobile = window.innerWidth <= 768;
    currentUser: User | null = null;

    constructor(private authService: AuthService, private router: Router) {
        this.authService.currentUser$.subscribe(user => {
            this.currentUser = user;
        });
    }

    @HostListener('window:resize', ['$event'])
    onResize(event: Event) {
        this.isMobile = window.innerWidth <= 768;
        if (!this.isMobile) {
            this.isSidenavOpen = false;
        }
    }

    toggleSidenav() {
        this.isSidenavOpen = !this.isSidenavOpen;
    }

    logout() {
        this.authService.logout();
        this.isSidenavOpen = false;
        this.router.navigate(['/login']);
    }

    isAdmin(): boolean {
        return this.currentUser?.role === 'admin';
    }
}