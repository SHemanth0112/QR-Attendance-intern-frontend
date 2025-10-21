import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Session {
  id: string;
  sessionId: string;
  subject: string;
  date: string | Date;
  startTime: string;
  endTime: string;
  description?: string;
  venue?: string;
  qrCode: string;
  teacherName: string;
  isActive: boolean;
  attendanceCount: number;
  createdAt: string | Date;
}

export interface SessionResponse {
  success: boolean;
  message?: string;
  session?: Session;
  sessions?: Session[];
  count?: number;
}

export interface CreateSessionData {
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
  description?: string;
  venue?: string;
  sessionId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private apiUrl = 'http://localhost:5000/api/sessions';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  createSession(data: CreateSessionData): Observable<SessionResponse> {
    return this.http.post<SessionResponse>(this.apiUrl, data, {
      headers: this.getHeaders()
    });
  }

  getSessions(): Observable<SessionResponse> {
    return this.http.get<SessionResponse>(this.apiUrl, {
      headers: this.getHeaders()
    });
  }

  getSession(id: string): Observable<SessionResponse> {
    return this.http.get<SessionResponse>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  updateSession(id: string, data: Partial<CreateSessionData>): Observable<SessionResponse> {
    return this.http.put<SessionResponse>(`${this.apiUrl}/${id}`, data, {
      headers: this.getHeaders()
    });
  }

  deleteSession(id: string): Observable<SessionResponse> {
    return this.http.delete<SessionResponse>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  toggleSessionStatus(id: string): Observable<SessionResponse> {
    return this.http.patch<SessionResponse>(`${this.apiUrl}/${id}/toggle`, {}, {
      headers: this.getHeaders()
    });
  }
}

