import { Injectable, signal, computed } from '@angular/core';

export interface TimeEntry {
  id: string;
  projectId: string;
  description: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  date: Date;
}

@Injectable({
  providedIn: 'root'
})
export class TimerService {
  // Timer State
  private isRunning = signal<boolean>(false);
  private startTime = signal<Date | null>(null);
  private currentProjectId = signal<string | null>(null);
  private _currentDescription = signal<string>('');
  private elapsedSeconds = signal<number>(0);
  
  // Time Entries Storage
  private timeEntries = signal<TimeEntry[]>([]);
  
  // Timer Interval
  private timerInterval: any = null;

  // Public Computed Signals
  readonly timerIsRunning = computed(() => this.isRunning());
  readonly activeProjectId = computed(() => this.currentProjectId());
  readonly currentElapsedTime = computed(() => this.elapsedSeconds());
  readonly currentDescription = computed(() => this._currentDescription());
  
  // Formatierte Zeit anzeigen
  readonly formattedTime = computed(() => {
    const seconds = this.elapsedSeconds();
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  });

  // Alle Time Entries für ein Projekt
  getProjectTimeEntries(projectId: string) {
    return computed(() => 
      this.timeEntries().filter(entry => entry.projectId === projectId)
    );
  }

  // Gesamte Stunden für ein Projekt
  getProjectTotalHours(projectId: string) {
    return computed(() => {
      const entries = this.timeEntries().filter(entry => entry.projectId === projectId);
      const totalSeconds = entries.reduce((sum, entry) => sum + entry.duration, 0);
      return Math.round((totalSeconds / 3600) * 10) / 10; // Auf 1 Dezimalstelle runden
    });
  }

  // Timer starten
  startTimer(projectId: string, description: string = ''): boolean {
    if (this.isRunning()) {
      console.warn('Timer läuft bereits');
      return false;
    }

    const now = new Date();
    this.startTime.set(now);
    this.currentProjectId.set(projectId);
    this._currentDescription.set(description);
    this.elapsedSeconds.set(0);
    this.isRunning.set(true);

    // Timer-Interval starten
    this.timerInterval = setInterval(() => {
      if (this.startTime()) {
        const elapsed = Math.floor((Date.now() - this.startTime()!.getTime()) / 1000);
        this.elapsedSeconds.set(elapsed);
      }
    }, 1000);

    console.log(`Timer gestartet für Projekt: ${projectId}`);
    return true;
  }

  // Timer stoppen und Time Entry speichern
  stopTimer(): TimeEntry | null {
    if (!this.isRunning() || !this.startTime() || !this.currentProjectId()) {
      console.warn('Timer läuft nicht');
      return null;
    }

    const endTime = new Date();
    const duration = this.elapsedSeconds();
    
    const timeEntry: TimeEntry = {
      id: Date.now().toString(),
      projectId: this.currentProjectId()!,
      description: this._currentDescription(),
      startTime: this.startTime()!,
      endTime: endTime,
      duration: duration,
      date: new Date()
    };

    // Time Entry speichern
    this.timeEntries.update(entries => [...entries, timeEntry]);

    // Timer zurücksetzen
    this.resetTimer();

    console.log('Timer gestoppt. Time Entry gespeichert:', timeEntry);
    return timeEntry;
  }

  // Timer abbrechen ohne zu speichern
  cancelTimer(): void {
    if (this.isRunning()) {
      this.resetTimer();
      console.log('Timer abgebrochen');
    }
  }

  // Timer pausieren/fortsetzen
  pauseTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  resumeTimer(): void {
    if (this.isRunning() && !this.timerInterval) {
      // Startzeit anpassen für korrekte Weiterführung
      const now = new Date();
      const elapsed = this.elapsedSeconds();
      this.startTime.set(new Date(now.getTime() - elapsed * 1000));
      
      this.timerInterval = setInterval(() => {
        if (this.startTime()) {
          const elapsed = Math.floor((Date.now() - this.startTime()!.getTime()) / 1000);
          this.elapsedSeconds.set(elapsed);
        }
      }, 1000);
    }
  }

  // Timer komplett zurücksetzen
  private resetTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    
    this.isRunning.set(false);
    this.startTime.set(null);
    this.currentProjectId.set(null);
    this._currentDescription.set('');
    this.elapsedSeconds.set(0);
  }

  // Alle Time Entries für Analytics
  getAllTimeEntries() {
    return computed(() => this.timeEntries());
  }

  // Time Entry manuell hinzufügen
  addManualTimeEntry(projectId: string, description: string, hours: number, date: Date = new Date()): void {
    const timeEntry: TimeEntry = {
      id: Date.now().toString(),
      projectId: projectId,
      description: description,
      startTime: new Date(date.getTime() - hours * 3600 * 1000),
      endTime: date,
      duration: hours * 3600,
      date: date
    };

    this.timeEntries.update(entries => [...entries, timeEntry]);
  }

  // Service cleanup
  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }
}