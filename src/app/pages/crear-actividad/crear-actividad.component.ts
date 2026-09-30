import { Component, inject, input, output, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActividadService } from '../../services/actividad.service';
import { I18nService } from '../../services/i18n.service';
import { Actividad, CategoriaActividad } from '../../models/actividad.model';
import { Alarma } from '../../models/alarma.model';
import { CategoryChipComponent } from '../../components/category-chip/category-chip.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-crear-actividad',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CategoryChipComponent
  ],
  template: `
    <div class="min-h-full pb-28 pt-3 px-4 max-w-md mx-auto">
      <!-- Top Brand Header Bar -->
      <header class="flex items-center justify-between py-2 mb-2">
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

      <!-- Subtitle and Title with Reset Button -->
      <div class="mt-2 mb-4 flex items-center justify-between">
        <div>
          <span class="text-xs font-bold text-[#FF3300] tracking-wider uppercase block">
            {{ i18n.t().create.subtitle }}
          </span>
          <h2 class="text-2xl font-black text-neutral-900 tracking-tight">
            {{ editActivity() ? i18n.t().create.editTitle : i18n.t().create.title }}
          </h2>
        </div>

        <button
          type="button"
          (click)="resetForm()"
          class="w-9 h-9 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition-colors"
          title="Restablecer formulario"
        >
          <svg class="w-4 h-4 stroke-[2]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
          </svg>
        </button>
      </div>

      <!-- Reactive Form -->
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <!-- Title Field -->
        <div>
          <label class="block text-xs font-bold text-neutral-800 mb-1.5">
            {{ i18n.t().create.titleField }}
          </label>
          <input
            type="text"
            formControlName="titulo"
            [placeholder]="i18n.t().create.titlePlaceholder"
            class="w-full px-4 py-3 bg-white rounded-xl border border-neutral-300 text-sm font-medium focus:outline-none focus:border-[#FF3300] focus:ring-1 focus:ring-[#FF3300] transition-all"
          />
        </div>

        <!-- Category Selector -->
        <div>
          <label class="block text-xs font-bold text-neutral-800 mb-2">
            {{ i18n.t().create.category }}
          </label>
          <div class="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <app-category-chip
              [label]="i18n.t().categories.trabajo"
              [active]="form.get('categoria')?.value === 'trabajo'"
              variant="accent"
              (selected)="setCategory('trabajo')"
            />
            <app-category-chip
              [label]="i18n.t().categories.clases"
              [active]="form.get('categoria')?.value === 'clases'"
              variant="accent"
              (selected)="setCategory('clases')"
            />
            <app-category-chip
              [label]="i18n.t().categories.tareas"
              [active]="form.get('categoria')?.value === 'tareas'"
              variant="accent"
              (selected)="setCategory('tareas')"
            />
            <app-category-chip
              [label]="i18n.t().categories.personal"
              [active]="form.get('categoria')?.value === 'personal'"
              variant="accent"
              (selected)="setCategory('personal')"
            />
          </div>
        </div>

        <!-- Date & Time Section Container -->
        <div class="bg-white rounded-2xl p-4 border border-neutral-200 space-y-3">
          <!-- Section Title & All day toggle -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-xs font-bold text-neutral-900">
              <svg class="w-4 h-4 text-[#FF3300]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>{{ i18n.t().create.dateTime }}</span>
            </div>

            <div class="flex items-center gap-2">
              <span class="text-xs text-neutral-500 font-medium">{{ i18n.t().create.allDay }}</span>
              <button
                type="button"
                (click)="isAllDay.set(!isAllDay())"
                class="w-10 h-6 rounded-full transition-colors relative"
                [ngClass]="isAllDay() ? 'bg-[#FF3300]' : 'bg-neutral-200'"
              >
                <span
                  class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-xs"
                  [ngClass]="isAllDay() ? 'translate-x-4' : 'translate-x-0'"
                ></span>
              </button>
            </div>
          </div>

          <!-- Date Sub-card -->
          <div class="p-3 bg-neutral-50/80 rounded-xl border border-neutral-200 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <svg class="w-4 h-4 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
              </svg>
              <div>
                <span class="text-[10px] font-bold text-neutral-400 tracking-wider block uppercase">
                  {{ i18n.t().create.date }}
                </span>
                <input
                  type="date"
                  formControlName="fecha_actividad"
                  class="bg-transparent text-xs font-bold text-neutral-800 focus:outline-none cursor-pointer"
                />
              </div>
            </div>
            <svg class="w-4 h-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>

          <!-- Time Inputs: Start & End -->
          @if (!isAllDay()) {
            <div class="grid grid-cols-2 gap-3">
              <!-- Start Time -->
              <div class="p-3 bg-neutral-50/80 rounded-xl border border-neutral-200">
                <span class="text-[10px] font-bold text-neutral-400 tracking-wider block uppercase mb-1">
                  {{ i18n.t().create.startTime }}
                </span>
                <div class="flex items-center justify-between">
                  <input
                    type="time"
                    formControlName="hora_inicio"
                    class="bg-transparent text-sm font-bold text-neutral-800 tabular-nums focus:outline-none"
                  />
                  <svg class="w-4 h-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
              </div>

              <!-- End Time -->
              <div class="p-3 bg-neutral-50/80 rounded-xl border border-neutral-200">
                <span class="text-[10px] font-bold text-neutral-400 tracking-wider block uppercase mb-1">
                  {{ i18n.t().create.endTime }}
                </span>
                <div class="flex items-center justify-between">
                  <input
                    type="time"
                    formControlName="hora_fin"
                    class="bg-transparent text-sm font-bold text-neutral-800 tabular-nums focus:outline-none"
                  />
                  <svg class="w-4 h-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Location Section Container -->
        <div class="bg-white rounded-2xl p-4 border border-neutral-200 space-y-3">
          <div class="flex items-center gap-2 text-xs font-bold text-neutral-900">
            <svg class="w-4 h-4 text-[#FF3300]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>{{ i18n.t().create.location }}</span>
          </div>

          <input
            type="text"
            formControlName="ubicacion"
            [placeholder]="i18n.t().create.locationPlaceholder"
            class="w-full px-3.5 py-2.5 bg-neutral-50/80 rounded-xl border border-neutral-200 text-xs font-medium focus:outline-none focus:border-[#FF3300]"
          />

          <!-- Quick Location Presets -->
          <div class="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
            @for (preset of locationPresets; track preset.key) {
              <button
                type="button"
                (click)="setLocation(preset.value)"
                class="px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all select-none border"
                [ngClass]="form.get('ubicacion')?.value === preset.value
                  ? 'bg-black text-white border-black shadow-xs'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'"
              >
                {{ preset.label }}
              </button>
            }
          </div>
        </div>

        <!-- Alarm & Reminder Master Section -->
        <div class="bg-white rounded-2xl p-4 border border-neutral-200 space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-red-50 text-[#FF3300] flex items-center justify-center">
                <svg class="w-4 h-4 stroke-[2]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              </div>
              <div>
                <span class="text-xs font-bold text-neutral-900 block leading-tight">
                  {{ i18n.t().create.alarmReminder }}
                </span>
                <span class="text-[11px] text-neutral-500">
                  {{ i18n.t().create.alarmDesc }}
                </span>
              </div>
            </div>

            <!-- Master Alarm Toggle Switch -->
            <button
              type="button"
              (click)="hasAlarm.set(!hasAlarm())"
              class="w-11 h-6 rounded-full transition-colors relative"
              [ngClass]="hasAlarm() ? 'bg-[#FF3300]' : 'bg-neutral-200'"
            >
              <span
                class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-xs"
                [ngClass]="hasAlarm() ? 'translate-x-5' : 'translate-x-0'"
              ></span>
            </button>
          </div>

          <!-- Active Alarm Details Row -->
          @if (hasAlarm()) {
            <div class="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between">
              <div class="flex items-center gap-2 text-xs font-semibold text-neutral-700">
                <svg class="w-4 h-4 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
                <span>{{ anticipationMinutes() }} {{ i18n.t().create.minutesBefore }}</span>
              </div>

              <div class="flex items-center gap-2">
                <span class="text-[10px] font-bold tracking-wider text-[#FF3300] uppercase">
                  {{ i18n.t().create.active }}
                </span>
                <button
                  type="button"
                  (click)="openAlarmConfig.emit()"
                  class="text-xs text-neutral-500 hover:text-neutral-800 underline font-medium"
                >
                  Personalizar
                </button>
              </div>
            </div>
          }
        </div>

        <!-- Notes Section Container -->
        <div class="bg-white rounded-2xl p-4 border border-neutral-200 space-y-2">
          <div class="flex items-center gap-2 text-xs font-bold text-neutral-900">
            <svg class="w-4 h-4 text-[#FF3300]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <span>{{ i18n.t().create.notes }}</span>
          </div>

          <textarea
            formControlName="notas"
            rows="3"
            [placeholder]="i18n.t().create.notesPlaceholder"
            class="w-full p-3 bg-neutral-50/80 rounded-xl border border-neutral-200 text-xs font-medium focus:outline-none focus:border-[#FF3300] resize-none"
          ></textarea>

          <!-- Character counter & toolbar icons -->
          <div class="flex items-center justify-between text-neutral-400 text-xs pt-1">
            <div class="flex items-center gap-3">
              <button type="button" class="hover:text-neutral-600">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                </svg>
              </button>
              <button type="button" class="hover:text-neutral-600">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
              </button>
            </div>
            <span class="text-[11px] tabular-nums">
              {{ form.get('notas')?.value?.length || 0 }} {{ i18n.t().create.characters }}
            </span>
          </div>
        </div>

        <!-- Submission Buttons -->
        <div class="pt-2 space-y-2">
          <!-- Primary Save Button -->
          <button
            type="submit"
            [disabled]="form.invalid"
            class="w-full py-3.5 px-5 bg-[#FF3300] hover:bg-[#E02E00] active:scale-[0.98] disabled:opacity-50 text-white rounded-2xl font-bold tracking-tight shadow-md flex items-center justify-center gap-2 transition-all select-none"
          >
            <svg class="w-4 h-4 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>{{ editActivity() ? i18n.t().create.updateBtn : i18n.t().create.saveBtn }}</span>
          </button>

          <!-- Cancel Button -->
          <button
            type="button"
            (click)="cancel.emit()"
            class="w-full py-3 px-5 bg-white hover:bg-neutral-50 active:scale-[0.98] text-neutral-800 rounded-2xl font-bold tracking-tight border border-neutral-200 transition-all select-none"
          >
            {{ i18n.t().create.cancelBtn }}
          </button>
        </div>
      </form>
    </div>
  `
})
export class CrearActividadComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly actividadService = inject(ActividadService);
  readonly auth = inject(AuthService);
  readonly i18n = inject(I18nService);

  readonly editActivity = input<Actividad | null>(null);
  readonly formSaved = output<void>();
  readonly cancel = output<void>();
  readonly openAlarmConfig = output<void>();

  readonly isAllDay = signal<boolean>(false);
  readonly hasAlarm = signal<boolean>(true);
  readonly anticipationMinutes = signal<number>(15);

  form!: FormGroup;

  locationPresets = [
    { key: 'oficina', label: 'Oficina', value: 'Oficina Central' },
    { key: 'online', label: 'En línea', value: 'Google Meet' },
    { key: 'universidad', label: 'Universidad', value: 'Edificio Central, Aula Magna 101' },
    { key: 'casa', label: 'Casa', value: 'Casa' }
  ];

  ngOnInit() {
    this.initForm();
  }

  private initForm() {
    const act = this.editActivity();
    const todayStr = this.actividadService.selectedDate() || new Date().toISOString().split('T')[0];

    this.form = this.fb.group({
      titulo: [act ? act.titulo : 'Presentación de Proyecto Final', [Validators.required, Validators.minLength(3)]],
      categoria: [act ? act.categoria : 'clases', Validators.required],
      fecha_actividad: [act ? act.fecha_actividad : todayStr, Validators.required],
      hora_inicio: [act ? act.hora_inicio : '10:00', Validators.required],
      hora_fin: [act ? act.hora_fin : '12:00', Validators.required],
      ubicacion: [act ? act.ubicacion : 'Edificio Central, Aula Magna 101', Validators.required],
      notas: [act ? act.notas : 'Llevar proyector, diapositivas impresas y notas de apoyo.']
    });

    if (act) {
      this.hasAlarm.set(!!act.alarma_id);
    }
  }

  setCategory(cat: CategoriaActividad) {
    this.form.patchValue({ categoria: cat });
  }

  setLocation(val: string) {
    this.form.patchValue({ ubicacion: val });
  }

  resetForm() {
    this.form.reset({
      titulo: '',
      categoria: 'trabajo',
      fecha_actividad: new Date().toISOString().split('T')[0],
      hora_inicio: '09:00',
      hora_fin: '10:00',
      ubicacion: '',
      notas: ''
    });
    this.hasAlarm.set(true);
  }

  async onSubmit() {
    if (this.form.invalid) return;

    const val = this.form.value;
    const act = this.editActivity();

    let alarma: Alarma | undefined;
    if (this.hasAlarm()) {
      alarma = {
        id: act?.alarma_id || 'alarm_' + Date.now(),
        tiempo_anticipacion: this.anticipationMinutes(),
        tono: 'default_radar_suave',
        volumen: 85,
        vibracion: true,
        recurrencia: true,
        frecuencia: 'solo_una_vez' as any,
        notificacion_push: true,
        pantalla_completa: true,
        mensaje: `Comienza en ${this.anticipationMinutes()} minutos en ${val.ubicacion || 'tu actividad'}.`
      };
    }

    if (act) {
      await this.actividadService.actualizarActividad(
        {
          ...act,
          ...val,
          hora_alarma: this.hasAlarm() ? this.calculateAlarmTimeString(val.hora_inicio, this.anticipationMinutes()) : ''
        },
        alarma
      );
    } else {
      await this.actividadService.agregarActividad(
        {
          id_usuario: this.auth.currentUser()?.uid || 'guest',
          titulo: val.titulo,
          categoria: val.categoria,
          ubicacion: val.ubicacion,
          fecha_actividad: val.fecha_actividad,
          hora_inicio: val.hora_inicio,
          hora_fin: val.hora_fin,
          hora_alarma: this.hasAlarm() ? this.calculateAlarmTimeString(val.hora_inicio, this.anticipationMinutes()) : '',
          alarma_id: '',
          notas: val.notas || '',
          completado: false
        },
        alarma
      );
    }

    this.formSaved.emit();
  }

  private calculateAlarmTimeString(horaInicio: string, anticipacionMinutos: number): string {
    const [h, m] = horaInicio.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m - anticipacionMinutos, 0);
    const rh = String(date.getHours()).padStart(2, '0');
    const rm = String(date.getMinutes()).padStart(2, '0');
    return `${rh}:${rm}`;
  }
}
