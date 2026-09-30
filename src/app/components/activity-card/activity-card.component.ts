import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Actividad } from '../../models/actividad.model';
import { Alarma } from '../../models/alarma.model';

@Component({
  selector: 'app-activity-card',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'block mb-3.5'
  },
  template: `
    <div
      class="relative bg-white rounded-2xl p-4 transition-all duration-200 border select-none cursor-pointer"
      [ngClass]="{
        'border-neutral-200 shadow-2xs': !isNow() && !actividad().completado,
        'border-[#FF3300] shadow-[0_2px_12px_rgba(255,51,0,0.12)] border-l-[3.5px] border-l-[#FF3300]': isNow(),
        'opacity-60 bg-neutral-50/80 border-neutral-200': actividad().completado
      }"
      (click)="cardClick.emit(actividad())"
    >
      <!-- Top Row: Time, Now Badge, Category / Status -->
      <div class="flex items-center justify-between gap-2 mb-1.5">
        <div class="flex items-center gap-2">
          <span
            class="text-xs font-semibold tabular-nums tracking-tight"
            [ngClass]="actividad().completado ? 'line-through text-neutral-400' : 'text-neutral-900 font-bold'"
          >
            {{ actividad().hora_inicio }} — {{ actividad().hora_fin }}
          </span>

          @if (isNow()) {
            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#FF3300] text-white">
              AHORA
            </span>
          }
        </div>

        <div class="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase">
          @if (actividad().completado) {
            <svg class="w-3.5 h-3.5 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span class="text-neutral-500">{{ actividad().categoria }}</span>
          } @else if (actividad().categoria === 'trabajo' && isPriority()) {
            <span class="text-[#FF3300] font-bold">PRIORIDAD</span>
          } @else {
            <span class="text-neutral-500">{{ actividad().categoria }}</span>
          }
        </div>
      </div>

      <!-- Main Activity Title -->
      <h3
        class="text-base font-bold text-neutral-900 leading-snug mb-3 tracking-tight"
        [ngClass]="{ 'line-through text-neutral-400': actividad().completado }"
      >
        {{ actividad().titulo }}
      </h3>

      <!-- Bottom Row: Location and Alarm status -->
      <div class="flex items-center justify-between text-xs text-neutral-500 pt-1 border-t border-neutral-100">
        <!-- Location -->
        <div class="flex items-center gap-1.5 truncate max-w-[65%]">
          @if (isLocationMeeting()) {
            <svg class="w-3.5 h-3.5 text-neutral-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="23 7 16 12 23 17 23 7"></polygon>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
            </svg>
          } @else if (isFood()) {
            <svg class="w-3.5 h-3.5 text-neutral-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 2v20"></path>
              <path d="M6 2v7a6 6 0 0 0 6 6v7"></path>
              <path d="M6 2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2"></path>
            </svg>
          } @else {
            <svg
              class="w-3.5 h-3.5 shrink-0"
              [ngClass]="isNow() ? 'text-[#FF3300]' : 'text-neutral-400'"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          }
          <span class="truncate text-neutral-600">{{ actividad().ubicacion || 'Sin ubicación' }}</span>
        </div>

        <!-- Alarm Indicator & Check Toggle -->
        <div class="flex items-center gap-2">
          @if (actividad().hora_alarma) {
            <div
              class="flex items-center gap-1 text-[11px] font-semibold tabular-nums"
              [ngClass]="isNow() || isPriority() ? 'text-[#FF3300]' : 'text-neutral-600'"
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span>{{ actividad().hora_alarma }}</span>
            </div>
          } @else {
            <div class="flex items-center gap-1 text-[11px] text-neutral-400">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                <path d="M18.63 13A17.89 17.89 0 0 1 18 8"></path>
                <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
              <span>Sin alarma</span>
            </div>
          }

          <!-- Quick Complete Checkbox -->
          <button
            type="button"
            (click)="$event.stopPropagation(); toggleComplete.emit(actividad().id || '')"
            class="w-5 h-5 rounded-full border flex items-center justify-center transition-colors ml-1"
            [ngClass]="actividad().completado ? 'bg-neutral-800 border-neutral-800 text-white' : 'border-neutral-300 hover:border-neutral-500'"
            title="Marcar como completada"
          >
            @if (actividad().completado) {
              <svg class="w-3 h-3 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            }
          </button>
        </div>
      </div>
    </div>
  `
})
export class ActivityCardComponent {
  readonly actividad = input.required<Actividad>();
  readonly alarma = input<Alarma | undefined>();
  readonly isNow = input<boolean>(false);
  readonly cardClick = output<Actividad>();
  readonly toggleComplete = output<string>();

  isLocationMeeting = computed(() => {
    const loc = this.actividad().ubicacion.toLowerCase();
    return loc.includes('meet') || loc.includes('zoom') || loc.includes('en línea') || loc.includes('online');
  });

  isFood = computed(() => {
    const loc = this.actividad().ubicacion.toLowerCase();
    const title = this.actividad().titulo.toLowerCase();
    return loc.includes('bistró') || loc.includes('café') || title.includes('almuerzo');
  });

  isPriority = computed(() => {
    return this.actividad().titulo.toLowerCase().includes('informe trimestral');
  });
}
