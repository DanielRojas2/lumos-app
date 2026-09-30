import { Component, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../services/i18n.service';

export interface TimeDistributionData {
  totalHours: number;
  trabajoHours: number;
  clasesHours: number;
  tareasHours: number;
  personalHours: number;
  trabajoPct: number;
  clasesPct: number;
  tareasPct: number;
  personalPct: number;
}

@Component({
  selector: 'app-time-distribution-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-2xl p-5 border border-neutral-200 select-none shadow-2xs">
      <!-- Top Row: Title, Total Hours, Goal Badge -->
      <div class="flex items-start justify-between mb-3">
        <div>
          <span class="text-[11px] font-bold text-neutral-500 tracking-wider uppercase block mb-1">
            {{ i18n.t().summary.timeDistribution }}
          </span>
          <div class="flex items-baseline gap-1.5">
            <span class="text-3xl font-extrabold text-neutral-900 tracking-tight tabular-nums">
              {{ data().totalHours }} hrs
            </span>
            <span class="text-xs text-neutral-500 font-medium">
              {{ i18n.t().summary.thisWeek }}
            </span>
          </div>
        </div>

        <div class="bg-black text-[#FF3300] px-2.5 py-1 rounded-full text-xs font-bold tracking-wide flex items-center gap-1 shadow-xs">
          <span>82%</span>
          <span class="text-white">{{ i18n.t().summary.goal }}</span>
        </div>
      </div>

      <!-- Segmented Multi-color Bar -->
      <div class="w-full h-2 rounded-full overflow-hidden flex gap-0.5 bg-neutral-100 my-4">
        <!-- Trabajo (Red/Orange) -->
        <div
          class="h-full bg-[#FF3300] rounded-l-full transition-all duration-500"
          [style.width.%]="data().trabajoPct"
        ></div>
        <!-- Clases (Black) -->
        <div
          class="h-full bg-black transition-all duration-500"
          [style.width.%]="data().clasesPct"
        ></div>
        <!-- Tareas (Dark Gray) -->
        <div
          class="h-full bg-neutral-700 transition-all duration-500"
          [style.width.%]="data().tareasPct"
        ></div>
        <!-- Personal (Light Gray) -->
        <div
          class="h-full bg-neutral-300 rounded-r-full transition-all duration-500"
          [style.width.%]="data().personalPct"
        ></div>
      </div>

      <!-- Legend row -->
      <div class="grid grid-cols-4 gap-2 pt-2 border-t border-neutral-100 text-xs">
        <!-- Trabajo -->
        <div>
          <div class="flex items-center gap-1.5 text-neutral-800 font-medium mb-0.5">
            <span class="w-2 h-2 rounded-full bg-[#FF3300]"></span>
            <span class="truncate">{{ i18n.t().categories.trabajo }}</span>
          </div>
          <div class="tabular-nums">
            <span class="font-bold text-[#FF3300]">{{ data().trabajoHours }}h</span>
            <span class="text-[11px] text-neutral-500 ml-0.5">({{ data().trabajoPct }}%)</span>
          </div>
        </div>

        <!-- Clases -->
        <div>
          <div class="flex items-center gap-1.5 text-neutral-800 font-medium mb-0.5">
            <span class="w-2 h-2 rounded-full bg-black"></span>
            <span class="truncate">{{ i18n.t().categories.clases }}</span>
          </div>
          <div class="tabular-nums">
            <span class="font-bold text-neutral-900">{{ data().clasesHours }}h</span>
            <span class="text-[11px] text-neutral-500 ml-0.5">({{ data().clasesPct }}%)</span>
          </div>
        </div>

        <!-- Tareas -->
        <div>
          <div class="flex items-center gap-1.5 text-neutral-800 font-medium mb-0.5">
            <span class="w-2 h-2 rounded-full bg-neutral-700"></span>
            <span class="truncate">{{ i18n.t().categories.tareas }}</span>
          </div>
          <div class="tabular-nums">
            <span class="font-bold text-neutral-900">{{ data().tareasHours }}h</span>
            <span class="text-[11px] text-neutral-500 ml-0.5">({{ data().tareasPct }}%)</span>
          </div>
        </div>

        <!-- Personal -->
        <div>
          <div class="flex items-center gap-1.5 text-neutral-800 font-medium mb-0.5">
            <span class="w-2 h-2 rounded-full bg-neutral-300"></span>
            <span class="truncate">{{ i18n.t().categories.personal }}</span>
          </div>
          <div class="tabular-nums">
            <span class="font-bold text-neutral-900">{{ data().personalHours }}h</span>
            <span class="text-[11px] text-neutral-500 ml-0.5">({{ data().personalPct }}%)</span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TimeDistributionBarComponent {
  readonly i18n = inject(I18nService);
  readonly data = input.required<TimeDistributionData>();
}
