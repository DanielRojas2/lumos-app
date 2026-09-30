import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-category-chip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      type="button"
      (click)="onClick()"
      class="px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all select-none flex items-center gap-1.5 whitespace-nowrap"
      [ngClass]="getChipClasses()"
    >
      <span>{{ label() }}</span>
      @if (badge()) {
        <span
          class="text-[11px] px-1.5 py-0.2 rounded-full font-mono"
          [ngClass]="active() ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-neutral-600'"
        >
          {{ badge() }}
        </span>
      }
      @if (variant() === 'accent' && active()) {
        <svg class="w-3.5 h-3.5 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      }
    </button>
  `
})
export class CategoryChipComponent {
  readonly label = input.required<string>();
  readonly active = input<boolean>(false);
  readonly badge = input<string | number>('');
  readonly variant = input<'dark' | 'accent'>('dark');
  readonly selected = output<void>();

  getChipClasses(): string {
    if (this.variant() === 'accent') {
      return this.active()
        ? 'bg-[#FF3300] text-white shadow-sm border border-[#FF3300]'
        : 'bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-300';
    }

    // Default dark variant (like filter in Ventana 1)
    return this.active()
      ? 'bg-black text-white shadow-sm border border-black'
      : 'bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-300';
  }

  onClick() {
    this.selected.emit();
  }
}
