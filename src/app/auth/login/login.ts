import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../auth.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatSnackBarModule
    ],
    templateUrl: './login.html',
    styleUrls: ['./login.css'],
    animations: [
        trigger('fadeIn', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(20px)' }),
                animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
            ])
        ])
    ]
})
export class LoginComponent {
    loginForm: FormGroup;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private snackBar: MatSnackBar
    ) {
        if (!this.authService.isLoggedIn()) {
            this.authService.logout();
        }

        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required]
        });
    }

    onSubmit(): void {
        if (this.loginForm.valid) {
            const { email, password } = this.loginForm.value;
            console.log('Submitting login:', { email, password }); // Debug
            this.authService.login(email, password).subscribe({
                next: (response) => {
                    console.log('Login successful:', response); // Debug
                    if (!response.token) {
                        this.snackBar.open('No token received. Please try again.', 'Close', { duration: 5000 });
                        return;
                    }
                    const message = response.role === 'admin'
                        ? 'Welcome, Admin! You have full access.'
                        : 'Welcome! You can view your details.';
                    this.snackBar.open(message, 'Close', { duration: 3000 });

                    if (response.role === 'admin') {
                        this.router.navigate(['/users']); // Redirect to /users for admins
                    } else {
                        this.router.navigate(['/user-details']); // Redirect to /user-details for users
                    }
                },
                error: (error) => {
                    console.error('Login error:', error); // Debug
                    const errorMessage = error.error?.message || 'Login failed. Please check your credentials.';
                    this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
                }
            });
        }
    }
}