import { Component, OnInit, signal, Inject } from '@angular/core';
import { UserService, User } from '../user';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../auth/auth.service';
import { take } from 'rxjs/operators';

@Component({
    selector: 'app-user-list',
    standalone: true,
    imports: [
        MatTableModule,
        MatButtonModule,
        MatCardModule,
        MatProgressSpinnerModule,
        MatIconModule,
        MatTooltipModule,
        MatDialogModule,
        MatSnackBarModule
    ],
    templateUrl: './user-list.html',
    styleUrls: ['./user-list.css'],
    animations: [
        trigger('fadeIn', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(20px)' }),
                animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
            ])
        ]),
        trigger('rowFadeIn', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateX(-20px)' }),
                animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
            ])
        ])
    ]
})
export class UserListComponent implements OnInit {
    users = signal<User[]>([]);
    displayedColumns: string[] = ['id', 'name', 'email', 'role', 'actions'];
    isLoading = signal(true);
    currentUser: User | null = null;

    constructor(
        private userService: UserService,
        private router: Router,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private authService: AuthService
    ) {
        this.authService.currentUser$.subscribe(user => {
            this.currentUser = user;
            if (!user) {
                this.snackBar.open('Please log in to access this page', 'Close', { duration: 3000 });
                this.router.navigate(['/login']);
            }
        });
    }

    ngOnInit(): void {
        this.authService.currentUser$.pipe(take(1)).subscribe(user => {
            if (user?.role === 'admin') {
                this.loadUsers();
            } else {
                this.snackBar.open('Access denied: Only admins can view this page', 'Close', { duration: 3000 });
                this.router.navigate(['/user-details']);
            }
        });
    }

    loadUsers() {
        this.isLoading.set(true);
        this.userService.getAllUsers().subscribe({
            next: (data: User[]) => {
                this.users.set(data);
                this.isLoading.set(false);
            },
            error: (error: any) => {
                this.isLoading.set(false);
                if (error.status === 403 || error.status === 401) {
                    this.snackBar.open('Unauthorized access. Please log in again.', 'Close', { duration: 3000 });
                    this.authService.logout();
                    this.router.navigate(['/login']);
                } else {
                    this.snackBar.open('Failed to load users: ' + (error.error?.message || 'Unknown error'), 'Close', { duration: 3000 });
                }
            }
        });
    }

    navigateToAdd() {
        this.router.navigate(['/add']);
    }

    editUser(id: string) {
        this.router.navigate([`/edit/${id}`]);
    }

    deleteUser(id: string) {
        if (this.currentUser?.id === id) {
            this.snackBar.open('You cannot delete your own account', 'Close', { duration: 3000 });
            return;
        }

        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            width: '300px',
            data: { message: 'Are you sure you want to delete this user?' }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.isLoading.set(true);
                this.userService.deleteUser(id).subscribe({
                    next: () => {
                        this.loadUsers();
                        this.snackBar.open('User deleted successfully', 'Close', { duration: 3000 });
                    },
                    error: (error: any) => {
                        this.isLoading.set(false);
                        const errorMessage = error.error?.message || 'Failed to delete user';
                        this.snackBar.open(errorMessage, 'Close', { duration: 3000 });
                    }
                });
            }
        });
    }
}

@Component({
    selector: 'app-confirm-dialog',
    standalone: true,
    imports: [MatDialogModule, MatButtonModule],
    template: `
        <h1 mat-dialog-title>Confirm</h1>
        <div mat-dialog-content>{{ data.message }}</div>
        <div mat-dialog-actions>
            <button mat-button (click)="onNoClick()">No</button>
            <button mat-button color="warn" [mat-dialog-close]="true">Yes</button>
        </div>
    `
})
export class ConfirmDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<ConfirmDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { message: string }
    ) {}

    onNoClick(): void {
        this.dialogRef.close();
    }
}