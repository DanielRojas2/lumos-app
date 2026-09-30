import { Component, inject, input, output, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActividadService } from '../../services/actividad.service';
import { SoundPickerService } from '../../services/sound-picker.service';
import { NotificationService } from '../../services/notification.service';
import { I18nService } from '../../services/i18n.service';
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
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
            alt="Avatar"
            class="w-full h-full object-cover"
          />
        </div>
      </header>

      <!-- Selected Activity Summary Card -->
      <div class="bg-white rounded-2xl p-4 border border-neutral-200 border-l-4 border-l-[#FF3300] shadow-2xs mb-5">
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
        <p class="text-xs text-neutral-500 flex items-center gap-1">
          <svg class="w-3 h-3 text-[#FF3300]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span>{{ actividad().ubicacion }}</span>
        </p>
      </div>

      <!-- Anticipation Time Section -->
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
              (click)="selectedAnticipation.set(chip.minutes)"
              class="py-2.5 px-2 rounded-xl text-xs font-semibold tracking-tight transition-all select-none text-center"
              [ngClass]="selectedAnticipation() === chip.minutes
                ? 'bg-[#FF3300] text-white shadow-xs'
                : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50'"
            >
              {{ chip.label }}
            </button>
          }
        </div>
      </div>

      <!-- Tone and Volume Section -->
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
              class="w-10 h-10 rounded-full bg-[#FF3300] text-white flex items-center justify-center hover:bg-[#E02E00] shadow-xs active:scale-95 transition-all"
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

            <div>
              <span class="text-xs font-bold text-neutral-900 block leading-tight">
                {{ soundService.currentTone().name }}
              </span>
              <span class="text-[11px] text-neutral-500">
                {{ soundService.currentTone().isCustom ? 'Archivo multimedia local' : i18n.t().alarm.toneDesc }}
              </span>
            </div>
          </div>

          <!-- Change Tone Button (.mp4 / file picker) -->
          <button
            type="button"
            (click)="pickCustomMedia()"
            class="px-3 py-1.5 rounded-lg border border-neutral-300 text-xs font-bold text-neutral-800 bg-white hover:bg-neutral-100 shadow-2xs transition-colors"
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
            <span class="font-bold tabular-nums text-neutral-900">{{ volume() }}%</span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            [(ngModel)]="volume"
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
            (click)="toggleVibration()"
            class="w-11 h-6 rounded-full transition-colors relative"
            [ngClass]="vibration() ? 'bg-[#FF3300]' : 'bg-neutral-200'"
          >
            <span
              class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-xs"
              [ngClass]="vibration() ? 'translate-x-5' : 'translate-x-0'"
            ></span>
          </button>
        </div>
      </div>

      <!-- Insistence and Recurrence Section -->
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
            (click)="insistentMode.set(!insistentMode())"
            class="w-11 h-6 rounded-full transition-colors relative"
            [ngClass]="insistentMode() ? 'bg-[#FF3300]' : 'bg-neutral-200'"
          >
            <span
              class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-xs"
              [ngClass]="insistentMode() ? 'translate-x-5' : 'translate-x-0'"
            ></span>
          </button>
        </div>

        <!-- Frequency Pills -->
        <div class="pt-2">
          <span class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">
            {{ i18n.t().alarm.frequency }}
          </span>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              (click)="frequency.set('una_vez')"
              class="py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-between"
              [ngClass]="frequency() === 'una_vez'
                ? 'bg-red-50/50 text-[#FF3300] border-[#FF3300]'
                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'"
            >
              <span>{{ i18n.t().alarm.freqOnce }}</span>
              @if (frequency() === 'una_vez') {
                <svg class="w-3.5 h-3.5 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              }
            </button>

            <button
              type="button"
              (click)="frequency.set('diariamente')"
              class="py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-between"
              [ngClass]="frequency() === 'diariamente'
                ? 'bg-red-50/50 text-[#FF3300] border-[#FF3300]'
                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'"
            >
              <span>{{ i18n.t().alarm.freqDaily }}</span>
            </button>

            <button
              type="button"
              (click)="frequency.set('dias_habiles')"
              class="py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-between"
              [ngClass]="frequency() === 'dias_habiles'
                ? 'bg-red-50/50 text-[#FF3300] border-[#FF3300]'
                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'"
            >
              <span>{{ i18n.t().alarm.freqWeekdays }}</span>
            </button>

            <button
              type="button"
              (click)="frequency.set('semanalmente')"
              class="py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-between"
              [ngClass]="frequency() === 'semanalmente'
                ? 'bg-red-50/50 text-[#FF3300] border-[#FF3300]'
                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'"
            >
              <span>{{ i18n.t().alarm.freqWeekly }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Notification Channels -->
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
            (click)="channelPush.set(!channelPush())"
            class="w-11 h-6 rounded-full transition-colors relative"
            [ngClass]="channelPush() ? 'bg-[#FF3300]' : 'bg-neutral-200'"
          >
            <span
              class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-xs"
              [ngClass]="channelPush() ? 'translate-x-5' : 'translate-x-0'"
            ></span>
          </button>
        </div>

        <!-- Fullscreen Wakeup -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <svg class="w-4 h-4 text-neutral-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 3 21 3 21 9"></polyline>
              <polyline points="9 21 3 21 3 15"></polyline>
              <line x1="21" y1="3" x2="14" y2="10"></line>
              <line x1="3" y1="21" x2="10" y2="14"></line>
            </svg>
            <div>
              <span class="text-xs font-bold text-neutral-900 block leading-tight">
                {{ i18n.t().alarm.fullScreen }}
              </span>
              <span class="text-[11px] text-neutral-500">
                {{ i18n.t().alarm.fullScreenDesc }}
              </span>
            </div>
          </div>

          <button
            type="button"
            (click)="channelFullScreen.set(!channelFullScreen())"
            class="w-11 h-6 rounded-full transition-colors relative"
            [ngClass]="channelFullScreen() ? 'bg-[#FF3300]' : 'bg-neutral-200'"
          >
            <span
              class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-xs"
              [ngClass]="channelFullScreen() ? 'translate-x-5' : 'translate-x-0'"
            ></span>
          </button>
        </div>

        <!-- Email Alert -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <svg class="w-4 h-4 text-neutral-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <div>
              <span class="text-xs font-bold text-neutral-900 block leading-tight">
                {{ i18n.t().alarm.emailAlert }}
              </span>
              <span class="text-[11px] text-neutral-500">
                {{ i18n.t().alarm.emailDesc }}
              </span>
            </div>
          </div>

          <button
            type="button"
            (click)="channelEmail.set(!channelEmail())"
            class="w-11 h-6 rounded-full transition-colors relative"
            [ngClass]="channelEmail() ? 'bg-[#FF3300]' : 'bg-neutral-200'"
          >
            <span
              class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-xs"
              [ngClass]="channelEmail() ? 'translate-x-5' : 'translate-x-0'"
            ></span>
          </button>
        </div>
      </div>

      <!-- Live Simulation Native Card -->
      <div class="mb-5">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-1.5 text-xs font-bold text-neutral-900 uppercase tracking-wide">
            <svg class="w-4 h-4 text-[#FF3300]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
            <span>{{ i18n.t().alarm.preview }}</span>
          </div>
          <span class="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
            {{ i18n.t().alarm.simulation }}
          </span>
        </div>

        <div class="bg-black text-white rounded-2xl p-4 shadow-xl border border-neutral-800">
          <div class="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <div class="flex items-center gap-1.5">
              <div class="w-4 h-4 rounded bg-[#FF3300] flex items-center justify-center text-[10px] text-white font-bold">
                ⏰
              </div>
              <span class="font-bold tracking-wider text-neutral-200 uppercase text-[11px]">
                LUMOS AGENDA
              </span>
            </div>
            <span class="tabular-nums text-[11px]">Ahora • 09:45 AM</span>
          </div>

          <div class="flex items-start justify-between gap-3 mb-4">
            <div>
              <h4 class="text-sm font-bold text-white mb-0.5">
                {{ actividad().titulo }}
              </h4>
              <p class="text-xs text-neutral-400">
                {{ i18n.t().alarm.startsIn }} {{ selectedAnticipation() }} minutos en {{ actividad().ubicacion }}.
              </p>
            </div>

            <div class="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center text-[#FF3300] shrink-0">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </div>
          </div>

          <!-- Simulation Interactive Buttons -->
          <div class="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              class="py-2 px-3 rounded-xl bg-neutral-900 border border-neutral-700 text-xs font-semibold text-neutral-200 hover:bg-neutral-800 transition-colors"
            >
              {{ i18n.t().alarm.snooze5m }}
            </button>
            <button
              type="button"
              class="py-2 px-3 rounded-xl bg-[#FF3300] text-xs font-bold text-white hover:bg-[#E02E00] shadow-sm transition-colors"
            >
              {{ i18n.t().alarm.viewDetails }}
            </button>
          </div>
        </div>
      </div>

      <!-- Save Alarm Action Button -->
      <div class="space-y-2">
        <button
          type="button"
          (click)="saveAlarmConfiguration()"
          class="w-full py-3.5 px-5 bg-[#FF3300] hover:bg-[#E02E00] active:scale-[0.98] text-white rounded-2xl font-bold tracking-tight shadow-md flex items-center justify-center gap-2 transition-all select-none"
        >
          <svg class="w-4 h-4 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>{{ i18n.t().alarm.saveConfig }}</span>
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
  readonly soundService = inject(SoundPickerService);
  readonly notificationService = inject(NotificationService);
  readonly i18n = inject(I18nService);

  readonly actividad = input.required<Actividad>();
  readonly configSaved = output<void>();

  readonly selectedAnticipation = signal<number>(15);
  readonly volume = signal<number>(85);
  readonly vibration = signal<boolean>(true);
  readonly insistentMode = signal<boolean>(true);
  readonly frequency = signal<'una_vez' | 'diariamente' | 'dias_habiles' | 'semanalmente'>('una_vez');

  readonly channelPush = signal<boolean>(true);
  readonly channelFullScreen = signal<boolean>(true);
  readonly channelEmail = signal<boolean>(true);

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
    if (act.alarma_id) {
      const alm = this.actividadService.getAlarmaById(act.alarma_id);
      if (alm) {
        this.selectedAnticipation.set(alm.tiempo_anticipacion);
        this.volume.set(alm.volumen);
        this.vibration.set(alm.vibracion);
        this.insistentMode.set(alm.recurrencia);
        this.frequency.set(alm.frecuencia || 'una_vez');
        this.channelPush.set(alm.notificacion_push);
        this.channelFullScreen.set(alm.pantalla_completa);
      }
    }
  }

  toggleSoundPreview() {
    this.soundService.playPreview(this.volume());
  }

  async pickCustomMedia() {
    await this.soundService.pickLocalFile();
  }

  async toggleVibration() {
    const next = !this.vibration();
    this.vibration.set(next);
    if (next) {
      await this.notificationService.triggerHapticFeedback();
    }
  }

  async saveAlarmConfiguration() {
    const act = this.actividad();
    const currentTone = this.soundService.currentTone();

    const alarma: Alarma = {
      id: act.alarma_id || 'alarm_' + Date.now(),
      tiempo_anticipacion: this.selectedAnticipation(),
      tono: currentTone.uri,
      volumen: this.volume(),
      vibracion: this.vibration(),
      recurrencia: this.insistentMode(),
      frecuencia: this.frequency(),
      notificacion_push: this.channelPush(),
      pantalla_completa: this.channelFullScreen(),
      mensaje: `Comienza en ${this.selectedAnticipation()} minutos en ${act.ubicacion}.`
    };

    // Calculate alarm time string
    const [h, m] = act.hora_inicio.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m - this.selectedAnticipation(), 0);
    const rh = String(date.getHours()).padStart(2, '0');
    const rm = String(date.getMinutes()).padStart(2, '0');

    await this.actividadService.actualizarActividad(
      {
        ...act,
        alarma_id: alarma.id,
        hora_alarma: `${rh}:${rm}`
      },
      alarma
    );

    this.soundService.stopPreview();
    this.configSaved.emit();
  }
}
