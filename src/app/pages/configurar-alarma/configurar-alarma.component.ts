import { Component, inject, input, output, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActividadService } from '../../services/actividad.service';
import { SoundPickerService } from '../../services/sound-picker.service';
import { NotificationService } from '../../services/notification.service';
import { I18nService } from '../../services/i18n.service';
import { AuthService } from '../../services/auth.service';
import { Actividad } from '../../models/actividad.model';
import { Alarma } from '../../models/alarma.model';

@Component({
  selector: 'app-configurar-alarma',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-full pb-28 pt-3 px-4 max-w-md mx-auto">
      <!-- Top Brand Header Bar -->
      <header class="flex items-center justify-between py-2 mb-3">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-[#FF3300]"></span>
          <span class="text-xl font-extrabold tracking-tight text-neutral-900">
            Lumos
          </span>
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

      <!-- Selected Activity Summary Card -->
      <div class="bg-white rounded-2xl p-4 border border-neutral-200 border-l-4 border-l-[#FF3300] shadow-2xs mb-4">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black text-white flex items-center gap-1">
              <svg class="w-3 h-3 text-[#FFD54F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
              </svg>
              <span>{{ actividad().categoria }}</span>
            </span>

            <span class="text-xs font-semibold tabular-nums text-neutral-600 flex items-center gap-1">
              <svg class="w-3.5 h-3.5 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>{{ actividad().hora_inicio }} — {{ actividad().hora_fin }}</span>
            </span>
          </div>

          <div class="w-8 h-8 rounded-xl bg-red-50 text-[#FF3300] flex items-center justify-center">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </div>
        </div>

        <h3 class="text-base font-bold text-neutral-900 leading-snug mb-1">
          {{ actividad().titulo }}
        </h3>
        @if (actividad().ubicacion) {
          <p class="text-xs text-neutral-500 flex items-center gap-1">
            <svg class="w-3 h-3 text-[#FF3300]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>{{ actividad().ubicacion }}</span>
          </p>
        }
      </div>

      <!-- Multiple Alarms Manager Header & Tabs -->
      <div class="bg-neutral-50/90 rounded-2xl p-3.5 border border-neutral-200 mb-5">
        <div class="flex items-center justify-between mb-2.5">
          <div class="flex items-center gap-1.5 text-xs font-bold text-neutral-900 uppercase tracking-wide">
            <svg class="w-4 h-4 text-[#FF3300]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span>Configuraciones de Alarma ({{ alarmsList().length }})</span>
          </div>

          <button
            type="button"
            (click)="addNewAlarm()"
            class="text-xs font-bold text-[#FF3300] hover:text-[#E02E00] flex items-center gap-1 bg-white hover:bg-neutral-100 border border-red-200 px-3 py-1.5 rounded-xl shadow-2xs transition-all active:scale-95"
          >
            <span class="text-sm leading-none font-black">+</span>
            <span>Nueva Alarma</span>
          </button>
        </div>

        <!-- Alarm Selector Pill Tabs -->
        <div class="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          @for (alm of alarmsList(); let i = $index; track alm.id) {
            <button
              type="button"
              (click)="selectAlarmIndex(i)"
              class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 shrink-0 select-none"
              [ngClass]="activeAlarmIndex() === i
                ? 'bg-black text-white border-black shadow-xs'
                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'"
            >
              <span class="w-2 h-2 rounded-full" [ngClass]="activeAlarmIndex() === i ? 'bg-[#FF3300]' : 'bg-neutral-400'"></span>
              <span>Alarma {{ i + 1 }} ({{ getAnticipationLabel(alm.tiempo_anticipacion) }})</span>

              @if (alarmsList().length > 1) {
                <span
                  (click)="removeAlarm(i, $event)"
                  class="ml-1 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 text-xs px-1 rounded transition-colors"
                  title="Eliminar esta alarma"
                >✕</span>
              }
            </button>
          }
        </div>
      </div>

      @if (currentAlarm(); as alm) {
        <!-- 1. Editable Custom Alarm Message Section -->
        <div class="bg-white rounded-2xl p-4 border border-neutral-200 mb-5 space-y-2">
          <div class="flex items-center justify-between">
            <label class="flex items-center gap-1.5 text-xs font-bold text-neutral-900 uppercase tracking-wide">
              <svg class="w-4 h-4 text-[#FF3300]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <span>Mensaje de la Alarma</span>
            </label>
            <span class="text-[10px] font-bold text-[#FF3300] uppercase tracking-wider">Editable</span>
          </div>

          <p class="text-[11px] text-neutral-500">
            Escribe el texto personalizado que verás cuando suene esta alarma:
          </p>

          <textarea
            [ngModel]="alm.mensaje"
            (ngModelChange)="updateCurrentMessage($event)"
            rows="2"
            placeholder="Ej. ¡Hora de entrar a la reunión con el equipo!"
            class="w-full px-3.5 py-2.5 bg-neutral-50/80 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-900 focus:outline-none focus:border-[#FF3300]"
          ></textarea>
        </div>

        <!-- 2. Anticipation Time Section -->
        <div class="mb-5">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-1.5 text-xs font-bold text-neutral-900 uppercase tracking-wide">
              <svg class="w-4 h-4 text-[#FF3300]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 14 14"></polyline>
              </svg>
              <span>{{ i18n.t().alarm.anticipationTime }}</span>
            </div>
            <span class="text-[11px] font-bold text-[#FF3300]">
              {{ i18n.t().alarm.recommended }}
            </span>
          </div>

          <div class="grid grid-cols-3 gap-2">
            @for (chip of anticipationOptions; track chip.minutes) {
              <button
                type="button"
                (click)="updateCurrentAnticipation(chip.minutes)"
                class="py-2.5 px-2 rounded-xl text-xs font-semibold tracking-tight transition-all select-none text-center"
                [ngClass]="alm.tiempo_anticipacion === chip.minutes
                  ? 'bg-[#FF3300] text-white shadow-xs font-bold'
                  : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50'"
              >
                {{ chip.label }}
              </button>
            }
          </div>
        </div>

        <!-- 3. Tone and Volume Section -->
        <div class="bg-white rounded-2xl p-4 border border-neutral-200 mb-5 space-y-4">
          <div class="flex items-center gap-1.5 text-xs font-bold text-neutral-900 uppercase tracking-wide">
            <svg class="w-4 h-4 text-[#FF3300]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
            <span>{{ i18n.t().alarm.toneVolume }}</span>
          </div>

          <!-- Tone Selection Card -->
          <div class="p-3 bg-neutral-50/80 rounded-xl border border-neutral-200 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <!-- Play / Pause Preview Button -->
              <button
                type="button"
                (click)="toggleSoundPreview()"
                class="w-10 h-10 rounded-full bg-[#FF3300] text-white flex items-center justify-center hover:bg-[#E02E00] shadow-xs active:scale-95 transition-all shrink-0"
                title="Escuchar tono de prueba"
              >
                @if (soundService.isPlaying()) {
                  <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                  </svg>
                } @else {
                  <svg class="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                }
              </button>

              <div class="truncate">
                <span class="text-xs font-bold text-neutral-900 block leading-tight truncate">
                  {{ soundService.resolveToneName(alm.tono, alm.tono_nombre) }}
                </span>
                <span class="text-[11px] text-neutral-500">
                  {{ isCustomFile(alm.tono) ? 'Archivo multimedia local' : i18n.t().alarm.toneDesc }}
                </span>
              </div>
            </div>

            <!-- Change Tone Button (.mp3 / file picker) -->
            <button
              type="button"
              (click)="pickCustomMedia()"
              class="px-3 py-1.5 rounded-lg border border-neutral-300 text-xs font-bold text-neutral-800 bg-white hover:bg-neutral-100 shadow-2xs transition-colors shrink-0 ml-2"
            >
              {{ i18n.t().alarm.changeTone }}
            </button>
          </div>

          <!-- Volume Slider -->
          <div>
            <div class="flex items-center justify-between text-xs font-semibold text-neutral-700 mb-2">
              <span class="flex items-center gap-1.5">
                <svg class="w-4 h-4 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                </svg>
                <span>{{ i18n.t().alarm.volume }}</span>
              </span>
              <span class="font-bold tabular-nums text-neutral-900">{{ alm.volumen }}%</span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              [ngModel]="alm.volumen"
              (ngModelChange)="updateCurrentVolume($event)"
              class="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-[#FF3300]"
            />
          </div>

          <!-- Haptic Vibration Toggle -->
          <div class="flex items-center justify-between pt-1">
            <div>
              <span class="text-xs font-bold text-neutral-900 block leading-tight">
                {{ i18n.t().alarm.vibration }}
              </span>
              <span class="text-[11px] text-neutral-500">
                {{ i18n.t().alarm.vibrationDesc }}
              </span>
            </div>

            <button
              type="button"
              (click)="toggleCurrentVibration()"
              class="w-11 h-6 rounded-full transition-colors relative"
              [ngClass]="alm.vibracion ? 'bg-[#FF3300]' : 'bg-neutral-200'"
            >
              <span
                class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-xs"
                [ngClass]="alm.vibracion ? 'translate-x-5' : 'translate-x-0'"
              ></span>
            </button>
          </div>
        </div>

        <!-- 4. Insistence and Recurrence Section -->
        <div class="bg-white rounded-2xl p-4 border border-neutral-200 mb-5 space-y-3">
          <div class="flex items-center gap-1.5 text-xs font-bold text-neutral-900 uppercase tracking-wide">
            <svg class="w-4 h-4 text-[#FF3300]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
            <span>{{ i18n.t().alarm.insistenceFrequency }}</span>
          </div>

          <!-- Insistent Mode Switch -->
          <div class="flex items-center justify-between">
            <div>
              <span class="text-xs font-bold text-neutral-900 block leading-tight">
                {{ i18n.t().alarm.insistentMode }}
              </span>
              <span class="text-[11px] text-neutral-500">
                {{ i18n.t().alarm.insistentDesc }}
              </span>
            </div>

            <button
              type="button"
              (click)="toggleCurrentInsistence()"
              class="w-11 h-6 rounded-full transition-colors relative"
              [ngClass]="alm.recurrencia ? 'bg-[#FF3300]' : 'bg-neutral-200'"
            >
              <span
                class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-xs"
                [ngClass]="alm.recurrencia ? 'translate-x-5' : 'translate-x-0'"
              ></span>
            </button>
          </div>

          <!-- Frequency Pills -->
          <div class="pt-2">
            <span class="text-xs font-semibold text-neutral-600 block mb-2">
              {{ i18n.t().alarm.frequency }}
            </span>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                (click)="setCurrentFrequency('una_vez')"
                class="py-2 px-3 rounded-xl text-xs font-semibold tracking-tight transition-all border text-center"
                [ngClass]="alm.frecuencia === 'una_vez'
                  ? 'bg-black text-white border-black shadow-xs font-bold'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'"
              >
                <span>{{ i18n.t().alarm.freqOnce }}</span>
              </button>
              <button
                type="button"
                (click)="setCurrentFrequency('diariamente')"
                class="py-2 px-3 rounded-xl text-xs font-semibold tracking-tight transition-all border text-center"
                [ngClass]="alm.frecuencia === 'diariamente'
                  ? 'bg-black text-white border-black shadow-xs font-bold'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'"
              >
                <span>{{ i18n.t().alarm.freqDaily }}</span>
              </button>
              <button
                type="button"
                (click)="setCurrentFrequency('dias_habiles')"
                class="py-2 px-3 rounded-xl text-xs font-semibold tracking-tight transition-all border text-center"
                [ngClass]="alm.frecuencia === 'dias_habiles'
                  ? 'bg-black text-white border-black shadow-xs font-bold'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'"
              >
                <span>{{ i18n.t().alarm.freqWeekdays }}</span>
              </button>
              <button
                type="button"
                (click)="setCurrentFrequency('semanalmente')"
                class="py-2 px-3 rounded-xl text-xs font-semibold tracking-tight transition-all border text-center"
                [ngClass]="alm.frecuencia === 'semanalmente'
                  ? 'bg-black text-white border-black shadow-xs font-bold'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'"
              >
                <span>{{ i18n.t().alarm.freqWeekly }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 5. Notification Channels (Push and Fullscreen - Email Alert removed) -->
        <div class="bg-white rounded-2xl p-4 border border-neutral-200 mb-5 space-y-3.5">
          <div class="flex items-center gap-1.5 text-xs font-bold text-neutral-900 uppercase tracking-wide">
            <svg class="w-4 h-4 text-[#FF3300]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5M12 12h.01M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5M19.1 4.9C23 8.8 23 15.2 19.1 19.1"></path>
            </svg>
            <span>{{ i18n.t().alarm.channels }}</span>
          </div>

          <!-- Push notification -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <svg class="w-4 h-4 text-neutral-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <div>
                <span class="text-xs font-bold text-neutral-900 block leading-tight">
                  {{ i18n.t().alarm.pushNotification }}
                </span>
                <span class="text-[11px] text-neutral-500">
                  {{ i18n.t().alarm.pushDesc }}
                </span>
              </div>
            </div>

            <button
              type="button"
              (click)="toggleCurrentPush()"
              class="w-11 h-6 rounded-full transition-colors relative"
              [ngClass]="alm.notificacion_push ? 'bg-[#FF3300]' : 'bg-neutral-200'"
            >
              <span
                class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-xs"
                [ngClass]="alm.notificacion_push ? 'translate-x-5' : 'translate-x-0'"
              ></span>
            </button>
          </div>
        </div>
      }

      <!-- Save Alarm Action Button -->
      <div class="space-y-2">
        <button
          type="button"
          (click)="saveAllAlarmConfigurations()"
          class="w-full py-3.5 px-5 bg-[#FF3300] hover:bg-[#E02E00] active:scale-[0.98] text-white rounded-2xl font-bold tracking-tight shadow-md flex items-center justify-center gap-2 transition-all select-none"
        >
          <svg class="w-4 h-4 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>{{ i18n.t().alarm.saveConfig }} ({{ alarmsList().length }})</span>
        </button>

        <p class="text-[11px] text-center text-neutral-400">
          {{ i18n.t().alarm.syncNote }}
        </p>
      </div>
    </div>
  `
})
export class ConfigurarAlarmaComponent implements OnInit {
  readonly actividadService = inject(ActividadService);
  readonly auth = inject(AuthService);
  readonly soundService = inject(SoundPickerService);
  readonly notificationService = inject(NotificationService);
  readonly i18n = inject(I18nService);

  readonly actividad = input.required<Actividad>();
  readonly configSaved = output<void>();

  readonly alarmsList = signal<Alarma[]>([]);
  readonly activeAlarmIndex = signal<number>(0);

  readonly currentAlarm = computed(() => {
    const list = this.alarmsList();
    const idx = this.activeAlarmIndex();
    return list[idx] || list[0] || null;
  });

  anticipationOptions = [
    { label: 'En el momento', minutes: 0 },
    { label: '5 min antes', minutes: 5 },
    { label: '15 min antes', minutes: 15 },
    { label: '30 min antes', minutes: 30 },
    { label: '1 hora antes', minutes: 60 },
    { label: '1 día antes', minutes: 1440 }
  ];

  ngOnInit() {
    const act = this.actividad();
    const loadedAlarms: Alarma[] = [];

    // Check multiple alarm IDs
    if (act.alarmas_ids && act.alarmas_ids.length > 0) {
      for (const aId of act.alarmas_ids) {
        const al = this.actividadService.getAlarmaById(aId);
        if (al) loadedAlarms.push({ ...al });
      }
    } else if (act.alarma_id) {
      const al = this.actividadService.getAlarmaById(act.alarma_id);
      if (al) loadedAlarms.push({ ...al });
    }

    // If none exists, create a default alarm
    if (loadedAlarms.length === 0) {
      loadedAlarms.push(this.createDefaultAlarm(15));
    }

    this.alarmsList.set(loadedAlarms);
    this.activeAlarmIndex.set(0);
  }

  private createDefaultAlarm(anticipacion: number): Alarma {
    const act = this.actividad();
    const label = this.getAnticipationLabel(anticipacion);
    const locNote = act.ubicacion ? ` en ${act.ubicacion}` : '';
    return {
      id: 'alarm_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      tiempo_anticipacion: anticipacion,
      tono: 'default_radar_suave',
      volumen: 85,
      vibracion: true,
      recurrencia: true,
      frecuencia: 'una_vez',
      notificacion_push: true,
      pantalla_completa: true,
      mensaje: `Comienza en ${label}${locNote}.`
    };
  }

  getAnticipationLabel(minutes: number): string {
    const opt = this.anticipationOptions.find(o => o.minutes === minutes);
    return opt ? opt.label : `${minutes} min antes`;
  }

  getToneDisplayName(tono: string): string {
    if (!tono || tono === 'default_radar_suave') return 'Radar Suave (Predeterminado)';
    if (tono.startsWith('data:') || tono.startsWith('file:') || tono.includes('/') || tono.includes('\\')) {
      return 'Tono personalizado';
    }
    return tono;
  }

  isCustomFile(tono: string): boolean {
    return !!tono && (tono.startsWith('data:') || tono.startsWith('file:') || tono.endsWith('.mp3') || tono.endsWith('.wav') || tono.endsWith('.mp4'));
  }

  addNewAlarm() {
    // Add another alarm with next recommended time
    const existingTimes = this.alarmsList().map(a => a.tiempo_anticipacion);
    const candidateOptions = [0, 5, 15, 30, 60, 1440];
    const nextTime = candidateOptions.find(t => !existingTimes.includes(t)) ?? 5;

    const newAlarm = this.createDefaultAlarm(nextTime);
    this.alarmsList.update(list => [...list, newAlarm]);
    this.activeAlarmIndex.set(this.alarmsList().length - 1);
  }

  removeAlarm(index: number, event: Event) {
    event.stopPropagation();
    if (this.alarmsList().length <= 1) return;

    this.alarmsList.update(list => list.filter((_, i) => i !== index));
    if (this.activeAlarmIndex() >= this.alarmsList().length) {
      this.activeAlarmIndex.set(this.alarmsList().length - 1);
    }
  }

  selectAlarmIndex(index: number) {
    this.activeAlarmIndex.set(index);
    this.soundService.stopPreview();
  }

  updateCurrentAnticipation(minutes: number) {
    this.updateActiveAlarm(al => {
      const prevDefault = `Comienza en ${this.getAnticipationLabel(al.tiempo_anticipacion)}`;
      let nextMsg = al.mensaje;
      // If user hasn't heavily customized or it starts with default pattern, refresh it
      if (!nextMsg || nextMsg.startsWith('Comienza en ')) {
        const locNote = this.actividad().ubicacion ? ` en ${this.actividad().ubicacion}` : '';
        nextMsg = `Comienza en ${this.getAnticipationLabel(minutes)}${locNote}.`;
      }
      return { ...al, tiempo_anticipacion: minutes, mensaje: nextMsg };
    });
  }

  updateCurrentMessage(mensaje: string) {
    this.updateActiveAlarm(al => ({ ...al, mensaje }));
  }

  updateCurrentVolume(volumen: number) {
    this.updateActiveAlarm(al => ({ ...al, volumen }));
  }

  async toggleCurrentVibration() {
    const cur = this.currentAlarm();
    if (!cur) return;
    const next = !cur.vibracion;
    this.updateActiveAlarm(al => ({ ...al, vibracion: next }));
    if (next) {
      await this.notificationService.triggerHapticFeedback();
    }
  }

  toggleCurrentInsistence() {
    this.updateActiveAlarm(al => ({ ...al, recurrencia: !al.recurrencia }));
  }

  setCurrentFrequency(frecuencia: 'una_vez' | 'diariamente' | 'dias_habiles' | 'semanalmente') {
    this.updateActiveAlarm(al => ({ ...al, frecuencia }));
  }

  toggleCurrentPush() {
    this.updateActiveAlarm(al => ({ ...al, notificacion_push: !al.notificacion_push }));
  }

  toggleCurrentFullScreen() {
    this.updateActiveAlarm(al => ({ ...al, pantalla_completa: !al.pantalla_completa }));
  }

  private updateActiveAlarm(modifier: (al: Alarma) => Alarma) {
    const idx = this.activeAlarmIndex();
    this.alarmsList.update(list =>
      list.map((al, i) => (i === idx ? modifier(al) : al))
    );
  }

  toggleSoundPreview() {
    const cur = this.currentAlarm();
    if (cur) {
      this.soundService.playTone(cur.tono, cur.volumen);
    }
  }

  async pickCustomMedia() {
    const picked = await this.soundService.pickLocalFile();
    if (picked && picked.uri) {
      this.updateActiveAlarm(al => ({
        ...al,
        tono: picked.uri,
        tono_nombre: picked.name
      }));
    }
  }

  async saveAllAlarmConfigurations() {
    const act = this.actividad();
    const alarms = this.alarmsList();

    await this.actividadService.guardarAlarmasActividad(act, alarms);
    this.soundService.stopPreview();
    this.configSaved.emit();
  }
}
