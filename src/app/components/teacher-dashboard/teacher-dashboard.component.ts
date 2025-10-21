import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionService, Session } from '../../services/session.service';
import { AuthService, User } from '../../services/auth.service';
import { AttendanceService } from '../../services/attendance.service';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './teacher-dashboard.component.html',
  styleUrls: ['./teacher-dashboard.component.css']
})
export class TeacherDashboardComponent implements OnInit, OnDestroy {
  sessionForm: FormGroup;
  sessions: Session[] = [];
  currentUser: User | null = null;
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  showForm: boolean = false;
  selectedSession: Session | null = null;
  currentQRCode: string = '';
  qrRefreshInterval: any = null;

  constructor(
    private fb: FormBuilder,
    private sessionService: SessionService,
    private authService: AuthService,
    private attendanceService: AttendanceService,
    private router: Router
  ) {
    this.sessionForm = this.fb.group({
      subject: ['', [Validators.required, Validators.minLength(2)]],
      date: ['', [Validators.required]],
      startTime: ['', [Validators.required]],
      endTime: ['', [Validators.required]],
      venue: [''],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user?.role !== 'teacher') {
        this.router.navigate(['/']);
      }
    });
    this.loadSessions();
  }

  ngOnDestroy(): void {
    // Clear QR refresh interval when component is destroyed
    if (this.qrRefreshInterval) {
      clearInterval(this.qrRefreshInterval);
    }
  }

  loadSessions(): void {
    this.isLoading = true;
    this.sessionService.getSessions().subscribe({
      next: (response) => {
        if (response.success && response.sessions) {
          this.sessions = response.sessions;
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to load sessions';
        this.isLoading = false;
      }
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.sessionForm.reset();
      this.errorMessage = '';
      this.successMessage = '';
    }
  }

  onSubmit(): void {
    if (this.sessionForm.invalid) {
      this.markFormGroupTouched(this.sessionForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.sessionService.createSession(this.sessionForm.value).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.successMessage = 'Session created successfully!';
          this.sessionForm.reset();
          this.loadSessions();
          setTimeout(() => {
            this.showForm = false;
            this.successMessage = '';
          }, 2000);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Failed to create session';
      }
    });
  }

  viewQR(session: Session): void {
    this.selectedSession = session;
    this.currentQRCode = session.qrCode;
    
    // Start QR refresh every 5 seconds
    this.startQRRefresh(session.id);
  }

  closeQRModal(): void {
    this.selectedSession = null;
    // Stop QR refresh when modal closes
    if (this.qrRefreshInterval) {
      clearInterval(this.qrRefreshInterval);
      this.qrRefreshInterval = null;
    }
  }

  private startQRRefresh(sessionId: string): void {
    // Clear any existing interval
    if (this.qrRefreshInterval) {
      clearInterval(this.qrRefreshInterval);
    }

    // Refresh QR every 5 seconds
    this.qrRefreshInterval = setInterval(() => {
      this.refreshQRCode(sessionId);
    }, 5000);
  }

  private refreshQRCode(sessionId: string): void {
    this.attendanceService.generateFreshQR(sessionId).subscribe({
      next: (response) => {
        if (response.success && response.qrCode) {
          this.currentQRCode = response.qrCode;
        }
      },
      error: (error) => {
        console.error('QR refresh error:', error);
      }
    });
  }

  downloadQR(session: Session): void {
    const link = document.createElement('a');
    link.download = `QR-${session.sessionId}.png`;
    link.href = session.qrCode;
    link.click();
  }

  toggleStatus(session: Session): void {
    if (confirm(`Are you sure you want to ${session.isActive ? 'deactivate' : 'activate'} this session?`)) {
      this.sessionService.toggleSessionStatus(session.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadSessions();
          }
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Failed to toggle session status';
        }
      });
    }
  }

  deleteSession(session: Session): void {
    if (confirm(`Are you sure you want to delete session "${session.subject}"?`)) {
      this.sessionService.deleteSession(session.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.successMessage = 'Session deleted successfully';
            this.loadSessions();
            setTimeout(() => this.successMessage = '', 3000);
          }
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Failed to delete session';
        }
      });
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString();
  }

  get subject() { return this.sessionForm.get('subject'); }
  get date() { return this.sessionForm.get('date'); }
  get startTime() { return this.sessionForm.get('startTime'); }
  get endTime() { return this.sessionForm.get('endTime'); }
}

