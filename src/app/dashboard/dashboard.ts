import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UserListComponent } from '../user-list/user-list';
import { UserDetailsComponent } from '../user-details/user-details';
import { User } from '../auth/auth.types';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        MatButtonModule,
        MatIconModule,
        UserListComponent,
        UserDetailsComponent
    ],
    template: `
        <div class="dashboard">
            <div class="header">
                <h1>Welcome, {{ currentUser?.name }}</h1>
                @if (currentUser?.role === 'admin') {
                    <button mat-raised-button color="primary" (click)="addUser()">
                        <mat-icon>add</mat-icon> Add User
                    </button>
                }
            </div>
            @if (currentUser?.role === 'admin') {
                <app-user-list></app-user-list>
            } @else {
                <app-user-details></app-user-details>
            }
        </div>
    `,
    styles: `
        .dashboard {
            padding: 20px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        h1 {
            font-size: 2rem;
            color: #ffffff;
        }
        .light-theme h1 {
            color: #000000;
        }
        button[color="primary"] {
            background-color: #9c27b0;
            color: white;
        }
        button[color="primary"]:hover {
            background-color: #ab47bc;
        }
    `
})
export class DashboardComponent implements OnInit {
    currentUser: User | null = null;

    constructor(
        private authService: AuthService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.authService.currentUser$.subscribe(user => {
            this.currentUser = user;
            if (!user) {
                this.router.navigate(['/login']);
            }
        });
    }

    addUser(): void {
        this.router.navigate(['/add']);
    }
}