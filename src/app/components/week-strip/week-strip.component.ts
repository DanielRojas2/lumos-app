import { Component, input, output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../services/i18n.service';

export interface DayItem {
  name: string;
  dayNumber: number;
  fullDate: string; // YYYY-MM-DD
  isToday: boolean;
}

@Component({
  selector: 'app-week-strip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-2 px-1">
      @for (day of days(); track day.fullDate) {
        <button
          type="button"
          (click)="onSelectDate(day.fullDate)"
          class="flex flex-col items-center justify-center flex-1 min-w-[50px] py-2.5 px-1.5 rounded-2xl transition-all duration-200 select-none"
          [ngClass]="selectedDate() === day.fullDate
            ? 'bg-black text-white shadow-md'
            : 'bg-white text-neutral-800 border border-neutral-200 hover:border-neutral-300'"
        >
          <span
            class="text-[11px] font-semibold tracking-wider uppercase mb-1"
            [ngClass]="selectedDate() === day.fullDate ? 'text-neutral-300' : 'text-neutral-500'"
          >
            {{ day.name }}
          </span>
          <span class="text-base font-bold tabular-nums">
            {{ day.dayNumber }}
          </span>

          <!-- Orange active indicator dot -->
          @if (selectedDate() === day.fullDate) {
            <span class="w-1.5 h-1.5 rounded-full bg-[#FF3300] mt-1"></span>
          } @else {
            <span class="w-1.5 h-1.5 mt-1"></span>
          }
        </button>
      }
    </div>
  `
})
export class WeekStripComponent {
  readonly i18n = inject(I18nService);
  readonly selectedDate = input.required<string>();
  readonly dateChange = output<string>();

  readonly days = computed<DayItem[]>(() => {
    const list: DayItem[] = [];
    const today = new Date();
    // Start with Monday of current week
    const currentDayOfWeek = today.getDay(); // 0 is Sun, 1 is Mon...
    const distanceToMonday = (currentDayOfWeek + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMonday);

    const dayLabelsEs = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
    const dayLabelsEn = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const labels = this.i18n.isSpanish() ? dayLabelsEs : dayLabelsEn;

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const isToday = iso === today.toISOString().split('T')[0];

      list.push({
        name: labels[i],
        dayNumber: d.getDate(),
        fullDate: iso,
        isToday
      });
    }

    return list;
  });

  onSelectDate(date: string) {
    this.dateChange.emit(date);
  }
}
