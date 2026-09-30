import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../services/i18n.service';

export type ActiveTab = 'hoy' | 'crear' | 'alarmas' | 'resumen';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200/80 safe-bottom">
      <div class="max-w-md mx-auto px-4 h-16 flex items-center justify-around">
        <!-- Hoy Tab -->
        <button
          type="button"
          (click)="onSelectTab('hoy')"
          class="flex flex-col items-center justify-center w-16 py-1 transition-transform active:scale-95 select-none"
          [ngClass]="activeTab() === 'hoy' ? 'text-[#FF3300]' : 'text-neutral-500 hover:text-neutral-800'"
        >
          <svg class="w-6 h-6 stroke-[1.8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
            <circle cx="12" cy="14" r="1.5" [attr.fill]="activeTab() === 'hoy' ? '#FF3300' : 'currentColor'"></circle>
          </svg>
          <span class="text-[11px] font-medium tracking-tight mt-0.5">{{ i18n.t().tabs.today }}</span>
        </button>

        <!-- Crear Tab -->
        <button
          type="button"
          (click)="onSelectTab('crear')"
          class="flex flex-col items-center justify-center w-16 py-1 transition-transform active:scale-95 select-none"
          [ngClass]="activeTab() === 'crear' ? 'text-[#FF3300]' : 'text-neutral-500 hover:text-neutral-800'"
        >
          <svg class="w-6 h-6 stroke-[1.8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9"></circle>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
          <span class="text-[11px] font-medium tracking-tight mt-0.5">{{ i18n.t().tabs.create }}</span>
        </button>

        <!-- Alarmas Tab -->
        <button
          type="button"
          (click)="onSelectTab('alarmas')"
          class="flex flex-col items-center justify-center w-16 py-1 transition-transform active:scale-95 select-none"
          [ngClass]="activeTab() === 'alarmas' ? 'text-[#FF3300]' : 'text-neutral-500 hover:text-neutral-800'"
        >
          <svg class="w-6 h-6 stroke-[1.8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span class="text-[11px] font-medium tracking-tight mt-0.5">{{ i18n.t().tabs.alarms }}</span>
        </button>

        <!-- Resumen Tab -->
        <button
          type="button"
          (click)="onSelectTab('resumen')"
          class="flex flex-col items-center justify-center w-16 py-1 transition-transform active:scale-95 select-none"
          [ngClass]="activeTab() === 'resumen' ? 'text-[#FF3300]' : 'text-neutral-500 hover:text-neutral-800'"
        >
          <svg class="w-6 h-6 stroke-[1.8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="3" x2="9" y2="21"></line>
            <line x1="15" y1="3" x2="15" y2="21"></line>
          </svg>
          <span class="text-[11px] font-medium tracking-tight mt-0.5">{{ i18n.t().tabs.summary }}</span>
        </button>
      </div>
    </nav>
  `
})
export class BottomNavComponent {
  readonly i18n = inject(I18nService);
  readonly activeTab = input.required<ActiveTab>();
  readonly tabChange = output<ActiveTab>();

  onSelectTab(tab: ActiveTab) {
    this.tabChange.emit(tab);
  }
}
