import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimerService } from '../../core/services/timer.service';

// Temporäre Interface-Definition (später aus core/models importieren)
interface Project {
  id: string;
  name: string;
  client: string;
  status: string;
  progress: number;
  hours: number;
  budget: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  // Signals für reaktive Daten
  currentDate = signal<string>('');
  monthlyRevenue = signal<number>(6840);
  weeklyHours = signal<number>(47.2);
  openInvoices = signal<number>(3);
  openInvoicesAmount = signal<number>(2450);
  
  constructor(public timerService: TimerService) {}
  
  // Signal für Projekte
  projects = signal<Project[]>([
    {
      id: '1',
      name: 'Fliesen Runnbaum - Website + PHP Admin',
      client: 'Fliesen Runnbaum GmbH',
      status: 'active',
      progress: 78,
      hours: 67.5,
      budget: 4500
    },
    {
      id: '2',
      name: 'Zahnarztpraxis Online-Terminbuchung',
      client: 'Dr. Müller Zahnärzte',
      status: 'active',
      progress: 45,
      hours: 32.0,
      budget: 3200
    },
    {
      id: '3',
      name: 'Bäckerei Weber - E-Shop',
      client: 'Bäckerei Weber',
      status: 'active',
      progress: 92,
      hours: 41.5,
      budget: 2800
    }
  ]);

  // Computed Signals - werden automatisch aktualisiert
  activeProjects = computed(() => 
    this.projects().filter(project => project.status === 'active')
  );

  totalBudget = computed(() => 
    this.activeProjects().reduce((sum, project) => sum + project.budget, 0)
  );

  averageProgress = computed(() => {
    const active = this.activeProjects();
    if (active.length === 0) return 0;
    return Math.round(active.reduce((sum, project) => sum + project.progress, 0) / active.length);
  });

  ngOnInit(): void {
    this.currentDate.set(this.formatCurrentDate());
  }

  private formatCurrentDate(): string {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return now.toLocaleDateString('de-DE', options);
  }

  // Timer-Funktionen
  startProjectTimer(projectId: string, projectName: string): void {
    const success = this.timerService.startTimer(projectId, `Arbeit an ${projectName}`);
    if (success) {
      console.log(`Timer gestartet für Projekt: ${projectName}`);
    } else {
      alert('Timer läuft bereits für ein anderes Projekt!');
    }
  }

  stopTimer(): void {
    const timeEntry = this.timerService.stopTimer();
    if (timeEntry) {
      console.log('Zeit gespeichert:', timeEntry);
      // Optional: Toast-Nachricht anzeigen
    }
  }

  cancelTimer(): void {
    this.timerService.cancelTimer();
  }

  getActiveProjectName(): string {
    const activeProjectId = this.timerService.activeProjectId();
    if (activeProjectId) {
      const project = this.projects().find(p => p.id === activeProjectId);
      return project ? project.name : 'Unbekanntes Projekt';
    }
    return '';
  }
}