import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher';
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'teacher';
}

export interface LoginData {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Check if user is already logged in
    const token = this.getToken();
    if (token) {
      this.loadCurrentUser();
    }
  }

  register(data: RegisterData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap(response => {
        if (response.success && response.token && response.user) {
          this.setToken(response.token);
          this.currentUserSubject.next(response.user);
        }
      })
    );
  }

  login(data: LoginData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data).pipe(
      tap(response => {
        if (response.success && response.token && response.user) {
          this.setToken(response.token);
          this.currentUserSubject.next(response.user);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
  }

  loadCurrentUser(): void {
    const token = this.getToken();
    if (!token) {
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<{ success: boolean; user: User }>(`${this.apiUrl}/me`, { headers })
      .subscribe({
        next: (response) => {
          if (response.success && response.user) {
            this.currentUserSubject.next(response.user);
          }
        },
        error: () => {
          this.logout();
        }
      });
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}

