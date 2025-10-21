import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface AttendanceRecord {
  id: string;
  sessionCode: string;
  subject: string;
  date: string | Date;
  startTime: string;
  endTime: string;
  teacherName: string;
  scannedAt: string | Date;
  status: string;
}

export interface AttendanceResponse {
  success: boolean;
  message?: string;
  attendance?: any;
  count?: number;
  attended?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private apiUrl = `${environment.apiUrl}/attendance`;
  private qrUrl = `${environment.apiUrl}/qr`;

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

  markAttendance(qrData: string): Observable<AttendanceResponse> {
    return this.http.post<AttendanceResponse>(
      `${this.apiUrl}/mark`,
      { qrData },
      { headers: this.getHeaders() }
    );
  }

  getMyAttendance(): Observable<AttendanceResponse> {
    return this.http.get<AttendanceResponse>(
      `${this.apiUrl}/my-attendance`,
      { headers: this.getHeaders() }
    );
  }

  checkAttendance(sessionId: string): Observable<AttendanceResponse> {
    return this.http.get<AttendanceResponse>(
      `${this.apiUrl}/check/${sessionId}`,
      { headers: this.getHeaders() }
    );
  }

  getSessionAttendance(sessionId: string): Observable<AttendanceResponse> {
    return this.http.get<AttendanceResponse>(
      `${this.apiUrl}/session/${sessionId}`,
      { headers: this.getHeaders() }
    );
  }

  generateFreshQR(sessionId: string): Observable<any> {
    return this.http.get<any>(
      `${this.qrUrl}/generate/${sessionId}`,
      { headers: this.getHeaders() }
    );
  }
}

