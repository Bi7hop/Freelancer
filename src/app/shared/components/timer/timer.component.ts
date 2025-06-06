import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimerService } from '../../../core/services/timer.service';

@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
      <!-- Timer Display -->
      <div class="text-center mb-4">
        @if (timerService.timerIsRunning()) {
          <div class="mb-2">
            <span class="text-2xl font-mono font-bold text-green-400">
              {{ timerService.formattedTime() }}
            </span>
          </div>
          <p class="text-sm text-gray-400 mb-1">{{ activeProjectName }}</p>
          <p class="text-xs text-gray-500">{{ timerService.currentDescription() || 'Arbeitszeit' }}</p>
        } @else {
          <div class="mb-2">
            <span class="text-2xl font-mono font-bold text-gray-400">00:00:00</span>
          </div>
          <p class="text-sm text-gray-400">Timer bereit</p>
        }
      </div>

      <!-- Timer Controls -->
      <div class="flex gap-2 justify-center">
        @if (!timerService.timerIsRunning()) {
          <!-- Start Button -->
          @if (projectId) {
            <button 
              (click)="startTimer()"
              class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white transition-colors flex items-center gap-2 text-sm"
            >
              ▶️ Start
            </button>
          } @else {
            <button 
              disabled
              class="bg-gray-600 px-4 py-2 rounded-lg text-gray-400 cursor-not-allowed text-sm"
            >
              Projekt auswählen
            </button>
          }
        } @else {
          <!-- Stop Button -->
          <button 
            (click)="stopTimer()"
            class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white transition-colors flex items-center gap-2 text-sm"
          >
            ⏹️ Stop
          </button>
          
          <!-- Cancel Button -->
          <button 
            (click)="cancelTimer()"
            class="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg text-white transition-colors flex items-center gap-2 text-sm"
          >
            ❌ Abbruch
          </button>
        }
      </div>

      <!-- Project Time Summary -->
      @if (projectId) {
        <div class="mt-4 pt-4 border-t border-gray-700">
          <div class="text-center">
            <p class="text-xs text-gray-500 mb-1">Heute gearbeitet</p>
            <p class="text-lg font-bold text-blue-400">
              {{ timerService.getProjectTotalHours(projectId)() }}h
            </p>
          </div>
        </div>
      }
    </div>
  `
})
export class TimerComponent {
  @Input() projectId: string | null = null;
  @Input() projectName: string = '';

  private description = signal<string>('');

  constructor(public timerService: TimerService) {}

  get activeProjectName(): string {
    return this.projectName || 'Unbekanntes Projekt';
  }

  startTimer(): void {
    if (this.projectId) {
      const success = this.timerService.startTimer(
        this.projectId, 
        this.description() || `Arbeit an ${this.projectName}`
      );
      
      if (success) {
        console.log(`Timer gestartet für: ${this.projectName}`);
      }
    }
  }

  stopTimer(): void {
    const timeEntry = this.timerService.stopTimer();
    if (timeEntry) {
      console.log(`Zeit gespeichert: ${timeEntry.duration / 3600}h für ${this.projectName}`);
    }
  }

  cancelTimer(): void {
    this.timerService.cancelTimer();
    console.log('Timer abgebrochen');
  }

  setDescription(desc: string): void {
    this.description.set(desc);
  }
}