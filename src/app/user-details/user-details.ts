import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService, User } from '../user';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../auth/auth.service';

@Component({
    selector: 'app-user-details',
    standalone: true,
    imports: [
        MatCardModule,
        MatButtonModule,
        MatIconModule
    ],
    template: `
        @if (user) {
            <mat-card class="user-card">
                <mat-card-header>
                    <mat-card-title>{{ user.name }}</mat-card-title>
                    <mat-card-subtitle>{{ user.email }}</mat-card-subtitle>
                </mat-card-header>
                <mat-card-actions>
                    <button mat-raised-button color="primary" (click)="editUser()">
                        <mat-icon>edit</mat-icon> Edit
                    </button>
                    <button mat-raised-button color="warn" (click)="deleteUser()">
                        <mat-icon>delete</mat-icon> Delete
                    </button>
                </mat-card-actions>
            </mat-card>
        } @else {
            <p>Loading user details...</p>
        }
    `,
    styles: `
        .user-card {
            width: 300px;
            margin: 20px auto;
            background-color: #2a2a2a;
            color: white;
        }
        mat-card-header {
            background: linear-gradient(90deg, #673ab7, #9c27b0);
            padding: 10px;
        }
        mat-card-title {
            font-size: 1.2rem;
        }
        mat-card-subtitle {
            color: #b0b0b0;
        }
        mat-card-actions {
            display: flex;
            justify-content: space-between;
            padding: 10px;
        }
        .light-theme .user-card {
            background-color: #f5f5f5;
            color: black;
        }
        .light-theme mat-card-subtitle {
            color: #333333;
        }
    `
})
export class UserDetailsComponent implements OnInit {
    user: User | null = null;

    constructor(
        private userService: UserService,
        private authService: AuthService,
        private router: Router,
        private snackBar: MatSnackBar
    ) {}

    ngOnInit(): void {
        this.loadUser();
    }

    loadUser(): void {
        this.userService.getCurrentUser().subscribe({
            next: (user: User) => {
                this.user = user;
            },
            error: (error: any) => {
                if (error.status === 403 || error.status === 401) {
                    this.snackBar.open('Unauthorized access. Please log in again.', 'Close', { duration: 3000 });
                    this.authService.logout();
                    this.router.navigate(['/login']);
                } else {
                    this.snackBar.open('Failed to load user details: ' + (error.error?.message || 'Unknown error'), 'Close', { duration: 3000 });
                }
            }
        });
    }

    editUser(): void {
        if (this.user) {
            this.router.navigate([`/edit/${this.user.id}`]);
        }
    }

    deleteUser(): void {
        if (this.user) {
            this.userService.deleteUser(this.user.id).subscribe({
                next: () => {
                    this.snackBar.open('Account deleted successfully', 'Close', { duration: 3000 });
                    this.authService.logout();
                    this.router.navigate(['/login']);
                },
                error: (error: any) => {
                    this.snackBar.open('Failed to delete account: ' + (error.error?.message || 'Unknown error'), 'Close', { duration: 3000 });
                }
            });
        }
    }
}