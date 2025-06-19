import { Component, OnInit, OnDestroy } from '@angular/core'; // Add OnDestroy
import { ActivatedRoute, Router } from '@angular/router';
import { UserService, User, CreateUser } from '../user';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../auth/auth.service';
import { Subscription } from 'rxjs'; // Add Subscription
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-user-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatTooltipModule,
        MatSnackBarModule,
        MatSelectModule
    ],
    templateUrl: './user-form.html',
    styleUrls: ['./user-form.css'],
    animations: [
        trigger('fadeIn', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(20px)' }),
                animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
            ])
        ]),
        trigger('errorShake', [
            transition(':enter', [
                style({ transform: 'translateX(0)' }),
                animate('200ms ease-in-out', style({ transform: 'translateX(-10px)' })),
                animate('200ms ease-in-out', style({ transform: 'translateX(10px)' })),
                animate('200ms ease-in-out', style({ transform: 'translateX(0)' }))
            ])
        ])
    ]
})
export class UserFormComponent implements OnInit, OnDestroy { // Add OnDestroy
    userForm: FormGroup;
    editMode = false;
    userId: string | null = null;
    currentUser: User | null = null;
    originalEmail: string | null = null;
    roles = ['user', 'admin'];
    private userSubscription: Subscription; // Add subscription property

    constructor(
        private fb: FormBuilder,
        private userService: UserService,
        private route: ActivatedRoute,
        private router: Router,
        private authService: AuthService,
        private snackBar: MatSnackBar
    ) {
        this.userForm = this.fb.group({
            name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.minLength(6)]],
            role: ['user']
        });

        console.log('UserFormComponent: Constructor called'); // Debug
        this.userSubscription = this.authService.currentUser$.subscribe(user => {
            console.log('UserFormComponent: currentUser$ emitted', user); // Debug
            this.currentUser = user;
        });
    }

    delete(): void {
        if (this.userId && confirm('Are you sure you want to delete this user?')) {
            this.userService.deleteUser(this.userId).subscribe({
                next: () => {
                    this.snackBar.open('User deleted successfully', 'Close', { duration: 3000 });
                    this.router.navigate(['/users']);
                },
                error: (error) => {
                    console.error('Delete user error:', error);
                    const errorMessage = error.error?.message || 'Failed to delete user';
                    this.snackBar.open(errorMessage, 'Close', { duration: 3000 });
                    if (error.status === 403) {
                        this.snackBar.open('You can only delete your own account or contact an admin.', 'Close', { duration: 5000 });
                    } else if (error.status === 401) {
                        this.snackBar.open('Session expired. Please log in again.', 'Close', { duration: 5000 });
                        this.authService.logout();
                        this.router.navigate(['/login']);
                    }
                }
            });
        }
    }

    ngOnInit(): void {
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.editMode = true;
                this.userId = id;
                this.userForm.get('password')?.disable();
                this.userForm.get('role')?.disable();
                this.userService.getUser(this.userId).subscribe({
                    next: (user) => {
                        this.originalEmail = user.email;
                        this.userForm.patchValue(user);
                    },
                    error: (error) => {
                        const errorMessage = error.status === 404 ? 'User not found' : error.error?.message || 'Failed to load user';
                        this.snackBar.open(errorMessage, 'Close', { duration: 3000 });
                        this.router.navigate(['/users']); // Redirect to user list on error
                    }
                });
            } else if (this.route.snapshot.url[0]?.path === 'add') {
                this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
                this.userForm.get('password')?.updateValueAndValidity();
                if (this.currentUser?.role !== 'admin') {
                    this.snackBar.open('Access denied: Only admins can add users', 'Close', { duration: 3000 });
                    this.router.navigate(['/user-details']);
                }
            } else {
                console.error('Unexpected route:', this.route.snapshot.url);
                this.snackBar.open('Invalid route. Redirecting...', 'Close', { duration: 3000 });
                this.router.navigate(['/users']);
            }
        });
    }

    ngOnDestroy(): void { // Add ngOnDestroy
        console.log('UserFormComponent: ngOnDestroy called'); // Debug
        if (this.userSubscription) {
            this.userSubscription.unsubscribe();
        }
    }

    save() {
        if (this.userForm.valid) {
            if (this.editMode) {
                const updateUser: Partial<User> = {
                    name: this.userForm.value.name,
                    email: this.userForm.value.email
                };
                let redirectTo = '/users'; // Default redirect

                // Set redirectTo based on user role
                if (this.currentUser && this.currentUser.role === 'admin') {
                    redirectTo = '/users';
                } else if (this.currentUser) {
                    redirectTo = '/user-details';
                }

                this.userService.updateUser(this.userId!, updateUser).subscribe({
                    next: (updatedUser) => {
                        let message = 'User updated successfully';

                        if (this.currentUser && this.currentUser.id === this.userId) {
                            const updatedCurrentUser: User = {
                                id: this.currentUser.id,
                                name: updatedUser.name,
                                email: updatedUser.email,
                                role: this.currentUser.role
                            };
                            this.authService.updateCurrentUser(updatedCurrentUser);

                            if (this.originalEmail !== updatedUser.email) {
                                message = 'Your email has changed. Please log in with your new email.';
                                this.authService.logout();
                                redirectTo = '/login';
                                this.snackBar.open(message, 'Log in now', { duration: 7000 })
                                    .onAction()
                                    .subscribe(() => {
                                        this.router.navigate([redirectTo]);
                                    });
                            } else {
                                this.snackBar.open(message, 'Close', { duration: 3000 });
                            }
                        } else if (this.currentUser?.role !== 'admin') {
                            this.snackBar.open('You can only update your own profile.', 'Close', { duration: 3000 });
                            this.router.navigate([redirectTo]);
                            return;
                        } else {
                            this.snackBar.open(message, 'Close', { duration: 3000 });
                        }

                        console.log('Redirecting to:', redirectTo, 'Current User:', this.currentUser);
                        this.router.navigate([redirectTo]).then(() => {
                            console.log('Navigation completed to:', redirectTo);
                        }).catch(err => {
                            console.error('Navigation error:', err);
                        });
                    },
                    error: (error) => {
                        console.error('Update user error:', error.status, error.message, error.error);
                        const errorMessage = error.status === 403 ? 'You can only update your own profile.' : error.error?.message || 'Failed to update user';
                        this.snackBar.open(errorMessage, 'Close', { duration: 3000 });
                        if (error.status === 401) {
                            this.snackBar.open('Session expired. Please log in again.', 'Close', { duration: 5000 });
                            this.authService.logout();
                            this.router.navigate(['/login']);
                        } else if (error.status === 403) {
                            this.snackBar.open('Access denied. You can only update your own profile.', 'Close', { duration: 5000 });
                        }
                    }
                });
            } else {
                const createUser: CreateUser = {
                    name: this.userForm.value.name,
                    email: this.userForm.value.email,
                    password: this.userForm.value.password,
                    role: this.userForm.value.role
                };

                console.log('Adding user:', createUser);
                this.userService.addUser(createUser).subscribe({
                    next: (user) => {
                        console.log('User added successfully:', user);
                        this.snackBar.open('User added successfully', 'Close', { duration: 3000 });
                        this.router.navigate(['/users']);
                    },
                    error: (error) => {
                        console.error('Add user error:', error);
                        const errorMessage = error.error?.message || 'Failed to add user';
                        this.snackBar.open(errorMessage, 'Close', { duration: 3000 });
                        if (error.status === 403 || error.status === 401) {
                            this.snackBar.open('Session expired. Please log in again.', 'Close', { duration: 5000 });
                            this.authService.logout();
                            this.router.navigate(['/login']);
                        }
                    }
                });
            }
        }
    }

    cancel() {
        this.router.navigate(['/users']);
    }
}