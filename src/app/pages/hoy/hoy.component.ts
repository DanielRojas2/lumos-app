import { Component, inject, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActividadService } from '../../services/actividad.service';
import { AuthService } from '../../services/auth.service';
import { I18nService } from '../../services/i18n.service';
import { Actividad, CategoriaActividad } from '../../models/actividad.model';
import { WeekStripComponent } from '../../components/week-strip/week-strip.component';
import { CategoryChipComponent } from '../../components/category-chip/category-chip.component';
import { ActivityCardComponent } from '../../components/activity-card/activity-card.component';
import { OfflineBadgeComponent } from '../../components/offline-badge/offline-badge.component';
import { LangToggleComponent } from '../../components/lang-toggle/lang-toggle.component';

@Component({
  selector: 'app-hoy',
  standalone: true,
  imports: [
    CommonModule,
    WeekStripComponent,
    CategoryChipComponent,
    ActivityCardComponent,
    OfflineBadgeComponent,
    LangToggleComponent
  ],
  template: `
    <div class="min-h-full pb-28 pt-3 px-4 max-w-md mx-auto">
      <!-- Top Brand Header Bar -->
      <header class="flex items-center justify-between py-2 mb-3">
        <div class="flex items-center gap-2">
          <!-- Lumos Brand Dot / Starlet -->
          <span class="w-3 h-3 rounded-full bg-[#FF3300] shadow-[0_0_8px_rgba(255,51,0,0.6)]"></span>
          <span class="text-xl font-extrabold tracking-tight text-neutral-900">
            Lumos
          </span>
          <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-[#FF3300] border border-red-100 ml-1">
            {{ i18n.t().today.todayBadge }}
          </span>
        </div>

        <div class="flex items-center gap-2.5">
          <app-lang-toggle />

          <!-- User Avatar or Offline Guest Badge -->
          <button
            type="button"
            (click)="onAvatarClick()"
            class="relative w-8 h-8 rounded-full overflow-hidden border border-neutral-300 ring-2 ring-transparent hover:ring-neutral-200 transition-all select-none"
            title="Cuenta de usuario"
          >
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
          </button>
        </div>
      </header>

      <!-- Offline / Guest session banner -->
      <app-offline-badge />

      <!-- Date & Rhythm Title & Progress -->
      <div class="mt-4 mb-4">
        <span class="text-xs font-bold text-neutral-400 tracking-wider uppercase block mb-1">
          {{ formattedHeaderDate() }}
        </span>
        <div class="flex items-end justify-between mb-2">
          <h2 class="text-2xl font-black text-neutral-900 tracking-tight">
            {{ i18n.t().today.title }}
          </h2>
          <div class="text-xs font-semibold tabular-nums text-neutral-700">
            <span class="font-extrabold text-neutral-900">{{ actividadService.porcentajeCompletado() }}%</span>
            <span class="text-neutral-500 ml-1">{{ i18n.t().today.completed }}</span>
          </div>
        </div>

        <!-- Red Kinetic Progress Line -->
        <div class="w-full h-1 bg-neutral-200 rounded-full overflow-hidden">
          <div
            class="h-full bg-[#FF3300] transition-all duration-500 rounded-full"
            [style.width.%]="actividadService.porcentajeCompletado()"
          ></div>
        </div>
      </div>

      <!-- Weekly Carousel Strip -->
      <div class="mb-4">
        <app-week-strip
          [selectedDate]="actividadService.selectedDate()"
          (dateChange)="onDateSelect($event)"
        />
      </div>

      <!-- Category Filter Pills -->
      <div class="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 mb-5">
        <app-category-chip
          [label]="i18n.t().today.allFilter"
          [badge]="totalActivitiesCount()"
          [active]="actividadService.selectedCategory() === 'todos'"
          variant="dark"
          (selected)="setCategory('todos')"
        />
        <app-category-chip
          [label]="i18n.t().categories.trabajo"
          [active]="actividadService.selectedCategory() === 'trabajo'"
          variant="dark"
          (selected)="setCategory('trabajo')"
        />
        <app-category-chip
          [label]="i18n.t().categories.clases"
          [active]="actividadService.selectedCategory() === 'clases'"
          variant="dark"
          (selected)="setCategory('clases')"
        />
        <app-category-chip
          [label]="i18n.t().categories.tareas"
          [active]="actividadService.selectedCategory() === 'tareas'"
          variant="dark"
          (selected)="setCategory('tareas')"
        />
        <app-category-chip
          [label]="i18n.t().categories.personal"
          [active]="actividadService.selectedCategory() === 'personal'"
          variant="dark"
          (selected)="setCategory('personal')"
        />
      </div>

      <!-- Activities List with guaranteed card separation -->
      <div class="flex flex-col gap-3.5">
        @for (act of actividadService.actividadesDelDia(); track act.id) {
          <app-activity-card
            [actividad]="act"
            [isNow]="isActivityCurrentNow(act)"
            [alarma]="act.alarma_id ? actividadService.getAlarmaById(act.alarma_id) : undefined"
            (cardClick)="onActivityCardClick($event)"
            (toggleComplete)="actividadService.toggleCompletado($event)"
          />
        } @empty {
          <div class="py-12 px-4 text-center bg-white rounded-2xl border border-neutral-200">
            <svg class="w-10 h-10 text-neutral-300 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p class="text-sm font-medium text-neutral-500">
              {{ i18n.t().today.noActivities }}
            </p>
          </div>
        }
      </div>

      <!-- Bottom Floating / Primary Action Button -->
      <div class="fixed bottom-20 left-0 right-0 z-30 px-4 max-w-md mx-auto pointer-events-none">
        <button
          type="button"
          (click)="addActivityClick.emit()"
          class="pointer-events-auto w-full py-3.5 px-5 bg-black hover:bg-neutral-900 active:scale-[0.98] text-white rounded-2xl font-bold tracking-tight shadow-lg flex items-center justify-center gap-2.5 transition-all select-none"
        >
          <span class="w-6 h-6 rounded-full bg-[#FF3300] flex items-center justify-center text-white text-base leading-none">
            +
          </span>
          <span class="text-sm">{{ i18n.t().today.addActivityBtn }}</span>
        </button>
      </div>
    </div>
  `
})
export class HoyComponent {
  readonly actividadService = inject(ActividadService);
  readonly auth = inject(AuthService);
  readonly i18n = inject(I18nService);

  readonly addActivityClick = output<void>();
  readonly editActivityClick = output<Actividad>();
  readonly openProfileClick = output<void>();

  readonly totalActivitiesCount = computed(() => {
    return this.actividadService.actividadesDelDia().length;
  });

  readonly formattedHeaderDate = computed(() => {
    const dateStr = this.actividadService.selectedDate();
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);

    return date.toLocaleDateString(this.i18n.isSpanish() ? 'es-ES' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).toUpperCase();
  });

  onDateSelect(date: string) {
    this.actividadService.selectedDate.set(date);
  }

  setCategory(cat: CategoriaActividad | 'todos') {
    this.actividadService.selectedCategory.set(cat);
  }

  onActivityCardClick(act: Actividad) {
    this.editActivityClick.emit(act);
  }

  isActivityCurrentNow(act: Actividad): boolean {
    return act.id === 'act_2';
  }

  onAvatarClick() {
    this.openProfileClick.emit();
  }
}
