import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimerService } from '../../core/services/timer.service';

interface Project {
  id: string;
  name: string;
  client: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  progress: number;
  hours: number;
  budget: number;
  hourlyRate: number;
  deadline: Date;
  createdAt: Date;
  description?: string;
}

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent implements OnInit {
  // Signals für State Management
  projects = signal<Project[]>([]);
  searchTerm = signal<string>('');
  selectedStatus = signal<string>('');
  showModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  currentProject = signal<Partial<Project>>({});

  constructor(public timerService: TimerService) {}

  // Computed Signals - automatisch aktualisiert bei Änderungen
  filteredProjects = computed(() => {
    const projects = this.projects();
    const search = this.searchTerm().toLowerCase();
    const status = this.selectedStatus();
    
    return projects.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(search) ||
                           project.client.toLowerCase().includes(search);
      const matchesStatus = !status || project.status === status;
      
      return matchesSearch && matchesStatus;
    });
  });

  // Projekt-Statistiken als Computed Signals
  activeProjectsCount = computed(() => 
    this.projects().filter(p => p.status === 'active').length
  );

  completedProjectsCount = computed(() => 
    this.projects().filter(p => p.status === 'completed').length
  );

  totalBudget = computed(() => 
    this.projects().reduce((sum, p) => sum + p.budget, 0)
  );

  averageProgress = computed(() => {
    const activeProjects = this.projects().filter(p => p.status === 'active');
    if (activeProjects.length === 0) return 0;
    return Math.round(
      activeProjects.reduce((sum, p) => sum + p.progress, 0) / activeProjects.length
    );
  });

  // Status-Verteilung für bessere Übersicht
  statusDistribution = computed(() => {
    const projects = this.projects();
    return {
      active: projects.filter(p => p.status === 'active').length,
      completed: projects.filter(p => p.status === 'completed').length,
      paused: projects.filter(p => p.status === 'paused').length,
      cancelled: projects.filter(p => p.status === 'cancelled').length
    };
  });

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    // Demo-Daten - später durch Service ersetzen
    this.projects.set([
      {
        id: '1',
        name: 'Fliesen Runnbaum - Website + PHP Admin',
        client: 'Fliesen Runnbaum GmbH',
        status: 'active',
        progress: 78,
        hours: 67.5,
        budget: 4500,
        hourlyRate: 75,
        deadline: new Date('2024-07-15'),
        createdAt: new Date('2024-05-01'),
        description: 'Komplette Website mit Produktkatalog und PHP Admin-Panel'
      },
      {
        id: '2',
        name: 'Zahnarztpraxis Online-Terminbuchung',
        client: 'Dr. Müller Zahnärzte',
        status: 'active',
        progress: 45,
        hours: 32.0,
        budget: 3200,
        hourlyRate: 80,
        deadline: new Date('2024-08-01'),
        createdAt: new Date('2024-05-15'),
        description: 'Online-Terminbuchungssystem mit Kalenderintegration'
      },
      {
        id: '3',
        name: 'Bäckerei Weber - E-Shop',
        client: 'Bäckerei Weber',
        status: 'completed',
        progress: 100,
        hours: 41.5,
        budget: 2800,
        hourlyRate: 70,
        deadline: new Date('2024-06-01'),
        createdAt: new Date('2024-04-01'),
        description: 'Online-Shop für Backwaren mit Vorbestellfunktion'
      },
      {
        id: '4',
        name: 'Autohaus Schmidt - CRM System',
        client: 'Autohaus Schmidt',
        status: 'paused',
        progress: 25,
        hours: 15.0,
        budget: 5500,
        hourlyRate: 85,
        deadline: new Date('2024-09-15'),
        createdAt: new Date('2024-06-01'),
        description: 'Kundenverwaltungssystem mit Fahrzeugdatenbank'
      }
    ]);
  }

  // Actions mit Signals
  updateSearchTerm(term: string): void {
    this.searchTerm.set(term);
  }

  updateSelectedStatus(status: string): void {
    this.selectedStatus.set(status);
  }

  openNewProjectModal(): void {
    this.isEditing.set(false);
    this.currentProject.set({
      name: '',
      client: '',
      status: 'active',
      progress: 0,
      hours: 0,
      budget: 0,
      hourlyRate: 75,
      deadline: new Date(),
      description: ''
    });
    this.showModal.set(true);
  }

  editProject(project: Project): void {
    this.isEditing.set(true);
    this.currentProject.set({ ...project });
    this.showModal.set(true);
  }

  saveProject(): void {
    const currentProject = this.currentProject();
    
    if (this.isEditing()) {
      // Projekt aktualisieren mit Signal update
      this.projects.update(projects => 
        projects.map(project => 
          project.id === currentProject.id 
            ? { ...currentProject } as Project
            : project
        )
      );
    } else {
      // Neues Projekt erstellen
      const newProject: Project = {
        ...currentProject,
        id: Date.now().toString(),
        createdAt: new Date(),
        progress: 0,
        hours: 0
      } as Project;
      
      this.projects.update(projects => [...projects, newProject]);
    }
    
    this.closeModal();
  }

  deleteProject(projectId: string): void {
    if (confirm('Möchten Sie dieses Projekt wirklich löschen?')) {
      this.projects.update(projects => 
        projects.filter(p => p.id !== projectId)
      );
    }
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
    }
  }

  // Progress manuell setzen - für später implementieren
  updateProjectProgress(projectId: string, newProgress: number): void {
    // Clamp progress zwischen 0 und 100
    const clampedProgress = Math.max(0, Math.min(100, newProgress));
    
    this.projects.update(projects =>
      projects.map(project =>
        project.id === projectId
          ? { ...project, progress: clampedProgress }
          : project
      )
    );
  }

  updateProjectStatus(projectId: string, newStatus: Project['status']): void {
    this.projects.update(projects =>
      projects.map(project =>
        project.id === projectId
          ? { ...project, status: newStatus }
          : project
      )
    );
  }

  addProjectHours(projectId: string, additionalHours: number): void {
    this.projects.update(projects =>
      projects.map(project =>
        project.id === projectId
          ? { ...project, hours: project.hours + additionalHours }
          : project
      )
    );
  }

  closeModal(): void {
    this.showModal.set(false);
    this.currentProject.set({});
  }

  getStatusClass(status: string): string {
    const statusClasses = {
      'active': 'bg-green-500/20 text-green-400 border border-green-500/30',
      'completed': 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      'paused': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
      'cancelled': 'bg-red-500/20 text-red-400 border border-red-500/30'
    };
    return statusClasses[status as keyof typeof statusClasses] || '';
  }

  getStatusLabel(status: string): string {
    const statusLabels = {
      'active': 'Aktiv',
      'completed': 'Abgeschlossen',
      'paused': 'Pausiert',
      'cancelled': 'Abgebrochen'
    };
    return statusLabels[status as keyof typeof statusLabels] || status;
  }

  isDeadlineClose(deadline: Date): boolean {
    const today = new Date();
    const daysUntilDeadline = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return daysUntilDeadline <= 7 && daysUntilDeadline >= 0;
  }
}