import { Component, OnInit, output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SplashScreen } from '@capacitor/splash-screen';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-splash-intro',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#080C16] text-white transition-opacity duration-500 overflow-hidden select-none"
      [class.opacity-0]="isFadingOut()"
      [class.pointer-events-none]="isFadingOut()"
    >
      <!-- Background Ambient Starfield Glow -->
      <div class="absolute w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-[#FFD54F]/10 via-[#F59E0B]/5 to-transparent blur-3xl pointer-events-none"></div>

      <!-- Isotype Container -->
      <div class="relative w-44 h-44 flex items-center justify-center">
        <!-- Orbital Rings -->
        <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 176 176" fill="none">
          <!-- Outer Dim Ring -->
          <circle
            cx="88"
            cy="88"
            r="72"
            stroke="url(#ring-grad)"
            stroke-width="1.2"
            stroke-dasharray="4 6"
            class="opacity-60 transition-opacity duration-1000"
            [class.opacity-100]="stage() >= 2"
          />
          <!-- Concentric Orbit Ring -->
          <circle
            cx="88"
            cy="88"
            r="54"
            stroke="url(#gold-glow)"
            stroke-width="1.5"
            class="transition-all duration-1000"
            [style.stroke-dashoffset]="stage() >= 1 ? '0' : '340'"
            stroke-dasharray="340"
          />
          <!-- Gradients -->
          <defs>
            <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#FFD54F" stop-opacity="0.8" />
              <stop offset="50%" stop-color="#F59E0B" stop-opacity="0.3" />
              <stop offset="100%" stop-color="#FFE082" stop-opacity="0.1" />
            </linearGradient>
            <linearGradient id="gold-glow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#FFE082" />
              <stop offset="50%" stop-color="#FFD54F" />
              <stop offset="100%" stop-color="#F59E0B" />
            </linearGradient>
          </defs>
        </svg>

        <!-- Orbiting Satellite Particle -->
        <div
          class="absolute inset-0 flex items-center justify-center animate-orbit pointer-events-none"
          [class.opacity-0]="stage() < 1"
        >
          <div class="w-2.5 h-2.5 rounded-full bg-[#FFE082] shadow-[0_0_12px_#FFE082,0_0_20px_#F59E0B] translate-x-[54px]"></div>
        </div>

        <!-- Central 4-pointed Star Isotype (Lumos Core) -->
        <div
          class="relative z-10 transition-all duration-700 flex items-center justify-center"
          [ngClass]="{
            'scale-0 opacity-0': stage() === 0,
            'scale-50 opacity-80': stage() === 1,
            'scale-100 opacity-100 drop-shadow-[0_0_25px_rgba(255,213,79,0.7)]': stage() >= 2
          }"
        >
          <svg class="w-24 h-24 text-[#FFD54F]" viewBox="0 0 100 100" fill="none">
            <!-- 4-pointed Diamond Star -->
            <path
              d="M50 0 C50 35 65 50 100 50 C65 50 50 65 50 100 C50 65 35 50 0 50 C35 50 50 35 50 0 Z"
              fill="url(#star-gold-grad)"
              stroke="#FFF9C4"
              stroke-width="0.8"
            />
            <!-- Inner Light Core Bevel -->
            <circle cx="50" cy="50" r="4.5" fill="#FFFFFF" class="animate-pulse shadow-[0_0_10px_#FFFFFF]" />
            <defs>
              <linearGradient id="star-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#FFF9C4" />
                <stop offset="35%" stop-color="#FFD54F" />
                <stop offset="70%" stop-color="#F59E0B" />
                <stop offset="100%" stop-color="#B45309" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <!-- Brand Typography Container -->
      <div class="mt-8 flex flex-col items-center">
        <!-- LUMOS Title -->
        <h1
          class="text-3xl font-extrabold tracking-[0.28em] text-[#F8FAFC] transition-all duration-700 ease-out"
          [ngClass]="{
            'opacity-0 translate-y-4 blur-[8px]': stage() < 3,
            'opacity-100 translate-y-0 blur-0': stage() >= 3
          }"
        >
          LUMOS
        </h1>

        <!-- Subtle Golden Divider -->
        <div
          class="h-[1px] bg-gradient-to-r from-transparent via-[#FFD54F] to-transparent transition-all duration-700 my-2.5"
          [style.width]="stage() >= 4 ? '130px' : '0px'"
          [style.opacity]="stage() >= 4 ? '0.9' : '0'"
        ></div>

        <!-- Localized Subtitle / Slogan -->
        <p
          class="text-xs font-light tracking-wider text-[#CBD5E1] transition-all duration-700 ease-out text-center px-4"
          [ngClass]="{
            'opacity-0 translate-y-2': stage() < 4,
            'opacity-100 translate-y-0': stage() >= 4
          }"
        >
          {{ i18n.t().slogan }}
        </p>
      </div>

      <!-- Skip Button for quick testing / accessibility -->
      <button
        type="button"
        (click)="finish()"
        class="absolute bottom-8 text-[11px] font-mono text-[#64748B] hover:text-[#94A3B8] tracking-widest uppercase py-1 px-3 rounded border border-white/5 transition-colors"
      >
        Saltar
      </button>
    </div>
  `
})
export class SplashIntroComponent implements OnInit {
  readonly i18n = inject(I18nService);
  readonly animationCompleted = output<void>();

  readonly stage = signal<number>(0);
  readonly isFadingOut = signal<boolean>(false);

  async ngOnInit() {
    // Hide native splash screen if on mobile
    try {
      await SplashScreen.hide();
    } catch {
      // Ignored on web
    }

    this.runCinematicSequence();
  }

  private runCinematicSequence() {
    // Phase 1: Spark & Orbit (0.0s - 0.7s)
    setTimeout(() => {
      this.stage.set(1);
    }, 200);

    // Phase 2: Stellar Expansion & Ring stabilization (0.7s - 1.5s)
    setTimeout(() => {
      this.stage.set(2);
    }, 750);

    // Phase 3: Brand LUMOS title emergence with inverse blur (1.5s - 2.2s)
    setTimeout(() => {
      this.stage.set(3);
    }, 1500);

    // Phase 4: Slogan appearance & golden divider (2.2s - 2.8s)
    setTimeout(() => {
      this.stage.set(4);
    }, 2200);

    // End: Fade out and complete (2.8s - 3.2s)
    setTimeout(() => {
      this.finish();
    }, 2900);
  }

  finish() {
    if (this.isFadingOut()) return;
    this.isFadingOut.set(true);
    setTimeout(() => {
      this.animationCompleted.emit();
    }, 450);
  }
}
