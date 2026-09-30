import { Component, inject, computed, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActividadService } from '../../services/actividad.service';
import { AuthService } from '../../services/auth.service';
import { I18nService } from '../../services/i18n.service';
import { Actividad, CategoriaActividad } from '../../models/actividad.model';
import { TimeDistributionBarComponent } from '../../components/time-distribution-bar/time-distribution-bar.component';
import { CategoryChipComponent } from '../../components/category-chip/category-chip.component';

@Component({
  selector: 'app-resumen',
  standalone: true,
  imports: [
    CommonModule,
    TimeDistributionBarComponent,
    CategoryChipComponent
  ],
  template: `
    <div class="min-h-full pb-28 pt-3 px-4 max-w-md mx-auto">
      <!-- Top Brand Header Bar -->
      <header class="flex items-center justify-between py-2 mb-2">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-[#FF3300]"></span>
          <div>
            <h2 class="text-xl font-extrabold tracking-tight text-neutral-900 leading-tight">
              Lumos
            </h2>
            <span class="text-[10px] font-bold text-neutral-400 tracking-wider uppercase block">
              {{ i18n.t().summary.title }}
            </span>
          </div>
        </div>

        <div class="w-8 h-8 rounded-full overflow-hidden border border-neutral-300">
          @if (auth.currentUser()?.photoURL) {
            <img
              [src]="auth.currentUser()?.photoURL"
              alt="Avatar"
              class="w-full h-full object-cover"
            />
          } @else {
            <div class="w-full h-full bg-neutral-100 flex items-center justify-center text-neutral-600">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
          }
        </div>
      </header>

      <!-- Segmented View Control & Date Range Navigator -->
      <div class="flex items-center justify-between py-2 mb-3">
        <!-- Week / Month Pill Switch -->
        <div class="bg-neutral-100 p-1 rounded-xl flex items-center gap-1 border border-neutral-200">
          <button
            type="button"
            (click)="viewMode.set('semana')"
            class="px-3 py-1 rounded-lg text-xs font-bold transition-all"
            [ngClass]="viewMode() === 'semana' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500 hover:text-neutral-800'"
          >
            {{ i18n.t().summary.week }}
          </button>
          <button
            type="button"
            (click)="viewMode.set('mes')"
            class="px-3 py-1 rounded-lg text-xs font-bold transition-all"
            [ngClass]="viewMode() === 'mes' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500 hover:text-neutral-800'"
          >
            {{ i18n.t().summary.month }}
          </button>
        </div>

        <!-- Date Range Navigator -->
        <div class="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-800">
          <button type="button" class="p-1 hover:text-[#FF3300] transition-colors">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <span class="tabular-nums px-1 tracking-tight">14 — 20 Oct</span>
          <button type="button" class="p-1 hover:text-[#FF3300] transition-colors">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>

      <!-- Compact Week Strip Row -->
      <div class="flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar py-1 mb-5">
        @for (day of weekDays; track day.label) {
          <div
            class="flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-xl select-none transition-all"
            [ngClass]="day.isCurrent
              ? 'bg-black text-white shadow-sm'
              : 'bg-white text-neutral-700 border border-neutral-200'"
          >
            <span
              class="text-[9px] font-bold uppercase tracking-wider mb-0.5"
              [ngClass]="day.isCurrent ? 'text-red-400' : 'text-neutral-400'"
            >
              {{ day.isCurrent ? 'HOY' : day.label }}
            </span>
            <span class="text-sm font-bold tabular-nums">{{ day.number }}</span>
            <span
              class="w-1 h-1 rounded-full mt-1"
              [ngClass]="day.isCurrent ? 'bg-[#FF3300]' : 'bg-neutral-300'"
            ></span>
          </div>
        }
      </div>

      <!-- Time Distribution Metrics Card -->
      <div class="mb-5">
        <app-time-distribution-bar [data]="actividadService.distribucionHoras()" />
      </div>

      <!-- Category Filter Pills -->
      <div class="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 mb-5">
        <app-category-chip
          label="Todos"
          [active]="selectedCategory() === 'todos'"
          variant="dark"
          (selected)="selectedCategory.set('todos')"
        />
        <app-category-chip
          [label]="i18n.t().categories.trabajo"
          [active]="selectedCategory() === 'trabajo'"
          variant="dark"
          (selected)="selectedCategory.set('trabajo')"
        />
        <app-category-chip
          [label]="i18n.t().categories.clases"
          [active]="selectedCategory() === 'clases'"
          variant="dark"
          (selected)="selectedCategory.set('clases')"
        />
        <app-category-chip
          [label]="i18n.t().categories.tareas"
          [active]="selectedCategory() === 'tareas'"
          variant="dark"
          (selected)="selectedCategory.set('tareas')"
        />
      </div>

      <!-- Upcoming Alarms Section -->
      <div class="space-y-4">
        <!-- Section Header -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5 text-xs font-bold text-neutral-900 uppercase tracking-wide">
            <svg class="w-4 h-4 text-[#FF3300]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span>{{ i18n.t().summary.upcomingAlarms }}</span>
          </div>

          <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-[#FF3300] border border-red-100">
            {{ activeAlarmsCount() }} {{ i18n.t().summary.activeAlarms }}
          </span>
        </div>

        <!-- Group 1: HOY -->
        <div class="space-y-2.5">
          <div class="flex items-center gap-2 text-xs font-bold text-neutral-800 tracking-wider uppercase">
            <span class="w-1.5 h-1.5 rounded-full bg-[#FF3300]"></span>
            <span>{{ i18n.t().summary.todayHeader }} • JUEVES 17</span>
          </div>

          @for (item of todayAlarms(); track item.actividad.id) {
            <div
              class="bg-white rounded-2xl p-4 border border-neutral-200 shadow-2xs flex items-center justify-between"
              [ngClass]="item.actividad.categoria === 'trabajo' ? 'border-l-4 border-l-[#FF3300]' : 'border-l-4 border-l-black'"
            >
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold tabular-nums text-neutral-900">
                    {{ item.actividad.hora_inicio }} — {{ item.actividad.hora_fin }}
                  </span>
                  <span class="px-2 py-0.2 rounded text-[10px] font-semibold uppercase bg-neutral-100 text-neutral-600">
                    {{ item.actividad.categoria }}
                  </span>
                </div>

                <h4 class="text-sm font-bold text-neutral-900 leading-snug">
                  {{ item.actividad.titulo }}
                </h4>

                <div class="flex items-center gap-3 text-xs text-neutral-500">
                  <span class="truncate max-w-[150px]">{{ item.actividad.ubicacion }}</span>
                  <span class="text-[#FF3300] font-bold tabular-nums flex items-center gap-1">
                    <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    -{{ item.alarma?.tiempo_anticipacion || 15 }} min
                  </span>
                </div>
              </div>

              <!-- Quick Toggle Alarm Switch -->
              <button
                type="button"
                (click)="actividadService.toggleAlarma(item.actividad.id || '')"
                class="w-11 h-6 rounded-full transition-colors relative shrink-0"
                [ngClass]="item.alarma?.notificacion_push ? 'bg-black text-[#FF3300]' : 'bg-neutral-200 text-neutral-400'"
              >
                <span
                  class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform shadow-xs flex items-center justify-center text-[10px]"
                  [ngClass]="item.alarma?.notificacion_push ? 'translate-x-5 bg-[#FF3300] text-white' : 'translate-x-0 bg-white'"
                >
                  <svg class="w-3 h-3 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  </svg>
                </span>
              </button>
            </div>
          }
        </div>

        <!-- Group 2: MAÑANA -->
        <div class="space-y-2.5 pt-2">
          <div class="flex items-center gap-2 text-xs font-bold text-neutral-800 tracking-wider uppercase">
            <span class="w-1.5 h-1.5 rounded-full bg-neutral-900"></span>
            <span>{{ i18n.t().summary.tomorrowHeader }} • VIERNES 18</span>
          </div>

          @for (item of tomorrowAlarms(); track item.actividad.id) {
            <div
              class="bg-white rounded-2xl p-4 border border-neutral-200 shadow-2xs flex items-center justify-between"
              [ngClass]="{
                'border-l-4 border-l-[#FF3300]': item.actividad.categoria === 'trabajo' && item.alarma?.notificacion_push,
                'border-l-4 border-l-black': item.actividad.categoria === 'clases' && item.alarma?.notificacion_push,
                'border-l-4 border-l-neutral-300 opacity-60': !item.alarma?.notificacion_push
              }"
            >
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold tabular-nums text-neutral-900">
                    {{ item.actividad.hora_inicio }} — {{ item.actividad.hora_fin }}
                  </span>
                  <span class="px-2 py-0.2 rounded text-[10px] font-semibold uppercase bg-neutral-100 text-neutral-600">
                    {{ item.actividad.categoria }}
                  </span>
                </div>

                <h4 class="text-sm font-bold text-neutral-900 leading-snug">
                  {{ item.actividad.titulo }}
                </h4>

                <div class="flex items-center gap-3 text-xs text-neutral-500">
                  <span class="truncate max-w-[150px]">{{ item.actividad.ubicacion }}</span>
                  @if (item.alarma?.notificacion_push) {
                    <span class="text-[#FF3300] font-bold tabular-nums flex items-center gap-1">
                      <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      -{{ item.alarma?.tiempo_anticipacion || 15 }} min
                    </span>
                  } @else {
                    <span class="text-neutral-400 font-medium flex items-center gap-1">
                      <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                        <path d="M18.63 13A17.89 17.89 0 0 1 18 8"></path>
                      </svg>
                      {{ i18n.t().summary.inactive }}
                    </span>
                  }
                </div>
              </div>

              <!-- Quick Toggle Alarm Switch -->
              <button
                type="button"
                (click)="actividadService.toggleAlarma(item.actividad.id || '')"
                class="w-11 h-6 rounded-full transition-colors relative shrink-0"
                [ngClass]="item.alarma?.notificacion_push ? 'bg-black' : 'bg-neutral-200'"
              >
                <span
                  class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform shadow-xs flex items-center justify-center text-[10px]"
                  [ngClass]="item.alarma?.notificacion_push ? 'translate-x-5 bg-[#FF3300] text-white' : 'translate-x-0 bg-white'"
                >
                  <svg class="w-3 h-3 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  </svg>
                </span>
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class ResumenComponent {
  readonly actividadService = inject(ActividadService);
  readonly auth = inject(AuthService);
  readonly i18n = inject(I18nService);

  readonly viewMode = signal<'semana' | 'mes'>('semana');
  readonly selectedCategory = signal<CategoriaActividad | 'todos'>('todos');

  weekDays = [
    { label: 'LUN', number: 14, isCurrent: false },
    { label: 'MAR', number: 15, isCurrent: false },
    { label: 'MIÉ', number: 16, isCurrent: false },
    { label: 'JUE', number: 17, isCurrent: true },
    { label: 'VIE', number: 18, isCurrent: false },
    { label: 'SÁB', number: 19, isCurrent: false },
    { label: 'DOM', number: 20, isCurrent: false }
  ];

  readonly todayAlarms = computed(() => {
    const list = this.actividadService.actividades();
    const map = this.actividadService.alarmas();
    const cat = this.selectedCategory();
    const todayStr = new Date().toISOString().split('T')[0];

    return list
      .filter((a) => a.fecha_actividad === todayStr && a.alarma_id)
      .filter((a) => (cat === 'todos' ? true : a.categoria === cat))
      .map((a) => ({ actividad: a, alarma: a.alarma_id ? map[a.alarma_id] : undefined }));
  });

  readonly tomorrowAlarms = computed(() => {
    const list = this.actividadService.actividades();
    const map = this.actividadService.alarmas();
    const cat = this.selectedCategory();
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    return list
      .filter((a) => a.fecha_actividad === tomorrowStr && a.alarma_id)
      .filter((a) => (cat === 'todos' ? true : a.categoria === cat))
      .map((a) => ({ actividad: a, alarma: a.alarma_id ? map[a.alarma_id] : undefined }));
  });

  readonly activeAlarmsCount = computed(() => {
    const today = this.todayAlarms().filter((i) => i.alarma?.notificacion_push).length;
    const tomorrow = this.tomorrowAlarms().filter((i) => i.alarma?.notificacion_push).length;
    return today + tomorrow;
  });
}
