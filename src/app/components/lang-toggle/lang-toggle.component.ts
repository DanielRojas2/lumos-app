import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-lang-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      type="button"
      (click)="i18n.toggleLanguage()"
      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide border border-neutral-200 bg-white hover:bg-neutral-50 shadow-xs transition-colors select-none"
      title="Cambiar idioma / Switch language"
    >
      <span [ngClass]="i18n.isSpanish() ? 'text-[#FF3300] font-bold' : 'text-neutral-400'">ES</span>
      <span class="text-neutral-300">|</span>
      <span [ngClass]="!i18n.isSpanish() ? 'text-[#FF3300] font-bold' : 'text-neutral-400'">EN</span>
    </button>
  `
})
export class LangToggleComponent {
  readonly i18n = inject(I18nService);
}
