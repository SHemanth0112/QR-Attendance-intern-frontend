import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { TeacherDashboardComponent } from './components/teacher-dashboard/teacher-dashboard.component';
import { StudentDashboardComponent } from './components/student-dashboard/student-dashboard.component';
import { AuthService } from './services/auth.service';

// Auth Guard Function
export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.isLoggedIn()) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};

// Role Guard Function
export const roleGuard = (allowedRole: 'teacher' | 'student') => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    
    const user = authService.getCurrentUser();
    if (user && user.role === allowedRole) {
      return true;
    } else {
      router.navigate(['/']);
      return false;
    }
  };
};

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { 
    path: 'teacher-dashboard', 
    component: TeacherDashboardComponent,
    canActivate: [authGuard, roleGuard('teacher')]
  },
  { 
    path: 'student-dashboard', 
    component: StudentDashboardComponent,
    canActivate: [authGuard, roleGuard('student')]
  },
  { path: '**', redirectTo: '' }
];
