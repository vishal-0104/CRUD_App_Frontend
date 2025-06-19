import { Routes } from '@angular/router';
import { UserListComponent } from './user-list/user-list';
import { UserFormComponent } from './user-form/user-form';
import { UserDetailsComponent } from './user-details/user-details';
import { LoginComponent } from './auth/login/login';
import { SignupComponent } from './auth/signup/signup';
import { AuthGuard } from './auth/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'users', component: UserListComponent, canActivate: [AuthGuard] },
    { path: 'add', component: UserFormComponent, canActivate: [AuthGuard] },
    { path: 'edit/:id', component: UserFormComponent, canActivate: [AuthGuard] },
    { path: 'user-details', component: UserDetailsComponent, canActivate: [AuthGuard] },
    { path: 'login', component: LoginComponent },
    { path: 'signup', component: SignupComponent },
    { path: '**', redirectTo: '/login' }
];