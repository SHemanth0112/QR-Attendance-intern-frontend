import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SessionService, Session } from '../../services/session.service';
import { AuthService, User } from '../../services/auth.service';
import { AttendanceService } from '../../services/attendance.service';
import { QrScannerComponent } from '../qr-scanner/qr-scanner.component';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, QrScannerComponent],
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.css']
})
export class StudentDashboardComponent implements OnInit {
  sessions: Session[] = [];
  currentUser: User | null = null;
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  selectedSession: Session | null = null;
  showScanner: boolean = false;
  sessionToScan: Session | null = null;
  attendanceStatus: Map<string, boolean> = new Map();

  constructor(
    private sessionService: SessionService,
    private authService: AuthService,
    private attendanceService: AttendanceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user?.role !== 'student') {
        this.router.navigate(['/']);
      }
    });
    this.loadSessions();
  }

  loadSessions(): void {
    this.isLoading = true;
    this.sessionService.getSessions().subscribe({
      next: (response) => {
        if (response.success && response.sessions) {
          this.sessions = response.sessions;
          // Check attendance status for each session
          this.sessions.forEach(session => {
            this.checkSessionAttendance(session.id);
          });
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to load sessions';
        this.isLoading = false;
      }
    });
  }

  checkSessionAttendance(sessionId: string): void {
    this.attendanceService.checkAttendance(sessionId).subscribe({
      next: (response) => {
        if (response.success) {
          this.attendanceStatus.set(sessionId, response.attended || false);
        }
      },
      error: (error) => {
        console.error('Check attendance error:', error);
      }
    });
  }

  hasAttended(sessionId: string): boolean {
    return this.attendanceStatus.get(sessionId) || false;
  }

  viewSessionDetails(session: Session): void {
    this.selectedSession = session;
  }

  closeModal(): void {
    this.selectedSession = null;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString();
  }

  isUpcoming(session: Session): boolean {
    const sessionDate = new Date(session.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return sessionDate >= today;
  }

  isPast(session: Session): boolean {
    const sessionDate = new Date(session.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return sessionDate < today;
  }

  openScanner(session: Session): void {
    this.sessionToScan = session;
    this.showScanner = true;
    this.closeModal();
  }

  closeScanner(): void {
    this.showScanner = false;
    this.sessionToScan = null;
  }

  onQRScanned(qrData: string): void {
    this.showScanner = false;
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.attendanceService.markAttendance(qrData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.successMessage = 'Attendance marked successfully! ✓';
          // Update attendance status
          if (this.sessionToScan) {
            this.attendanceStatus.set(this.sessionToScan.id, true);
          }
          // Reload sessions to update count
          this.loadSessions();
          setTimeout(() => this.successMessage = '', 5000);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Failed to mark attendance';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });

    this.sessionToScan = null;
  }
}

