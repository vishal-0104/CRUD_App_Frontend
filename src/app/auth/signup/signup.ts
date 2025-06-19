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
    selector: 'app-signup',
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
    templateUrl: './signup.html',
    styleUrls: ['./signup.css'],
    animations: [
        trigger('fadeIn', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(20px)' }),
                animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
            ])
        ])
    ]
})
export class SignupComponent {
    signupForm: FormGroup;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private snackBar: MatSnackBar
    ) {
        this.signupForm = this.fb.group({
            name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    onSubmit(): void {
        if (this.signupForm.valid) {
            const { name, email, password } = this.signupForm.value;
            this.authService.signup(email, password, name).subscribe({
                next: () => {
                    // Clear localStorage to ensure no previous user data persists
                    localStorage.removeItem('token');
                    localStorage.removeItem('currentUser');
                    this.authService.logout(); // Ensure currentUserSubject is reset
                    this.snackBar.open('Signup successful! Please log in.', 'Close', { duration: 3000 });
                    this.router.navigate(['/login']);
                },
                error: (error) => {
                    const errorMessage = error.error?.message || 'Signup failed. Please try again.';
                    this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
                }
            });
        }
    }
}