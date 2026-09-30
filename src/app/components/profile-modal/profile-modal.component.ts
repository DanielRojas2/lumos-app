import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ActividadService } from '../../services/actividad.service';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-profile-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        class="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-neutral-200 relative overflow-hidden select-none"
        (click)="$event.stopPropagation()"
      >
        <!-- Ambient Golden Accent Bar on Top -->
        <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FF3300] via-[#FFD54F] to-[#FF3300]"></div>

        <!-- Close Button -->
        <button
          type="button"
          (click)="close.emit()"
          class="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors"
          title="Cerrar ventana"
        >
          <svg class="w-4 h-4 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <!-- User Identity Section -->
        <div class="flex flex-col items-center text-center mt-2 mb-6">
          <div class="relative w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-[#FF3300] to-[#FFD54F] mb-3 shadow-md">
            <div class="w-full h-full rounded-full overflow-hidden bg-neutral-900 flex items-center justify-center">
              @if (auth.currentUser()?.photoURL) {
                <img
                  [src]="auth.currentUser()?.photoURL"
                  alt="Avatar"
                  class="w-full h-full object-cover"
                />
              } @else {
                <svg class="w-9 h-9 text-[#FFE082]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              }
            </div>
            <!-- Online status indicator dot -->
            <span
              class="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white"
              [ngClass]="auth.isOnline() ? 'bg-emerald-500' : 'bg-amber-500'"
            ></span>
          </div>

          <h3 class="text-lg font-black text-neutral-900 tracking-tight leading-snug">
            {{ auth.currentUser()?.displayName || 'Usuario Lumos' }}
          </h3>

          <p class="text-xs text-neutral-500 font-medium mt-0.5">
            {{ auth.currentUser()?.email || 'Cuenta de Invitado Local' }}
          </p>

          <!-- Status Badge -->
          <div class="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold"
            [ngClass]="auth.currentUser()?.isOfflineGuest
              ? 'bg-amber-50 text-amber-800 border border-amber-200'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'"
          >
            <span class="w-2 h-2 rounded-full" [ngClass]="auth.currentUser()?.isOfflineGuest ? 'bg-amber-500' : 'bg-emerald-500'"></span>
            <span>
              {{ auth.currentUser()?.isOfflineGuest ? 'Modo Local / Invitado' : 'Conectado con Google' }}
            </span>
          </div>
        </div>

        <!-- Quick Summary Metrics -->
        <div class="grid grid-cols-2 gap-3 mb-6 bg-neutral-50/80 p-3 rounded-2xl border border-neutral-100">
          <div class="text-center">
            <span class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Actividades</span>
            <span class="text-lg font-black text-neutral-900 tabular-nums">
              {{ actividadService.actividades().length }}
            </span>
          </div>
          <div class="text-center border-l border-neutral-200">
            <span class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Alarmas Activas</span>
            <span class="text-lg font-black text-[#FF3300] tabular-nums">
              {{ actividadService.alarmasActivas().length }}
            </span>
          </div>
        </div>

        <!-- Confirmation state for sign out -->
        @if (confirmingLogout()) {
          <div class="bg-red-50/80 border border-red-200 rounded-2xl p-4 mb-4 text-center">
            <p class="text-xs font-bold text-red-950 mb-1">
              ¿Cerrar sesión de Lumos?
            </p>
            <p class="text-[11px] text-red-700 mb-3">
              Tus actividades sincronizadas están a salvo en la nube de Google. Volverás al modo invitado local.
            </p>
            <div class="flex gap-2">
              <button
                type="button"
                (click)="confirmingLogout.set(false)"
                class="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                [disabled]="isLoggingOut()"
                (click)="performLogout()"
                class="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-xs"
              >
                {{ isLoggingOut() ? 'Cerrando...' : 'Sí, cerrar' }}
              </button>
            </div>
          </div>
        } @else {
          <!-- Action Buttons -->
          <div class="space-y-2">
            @if (auth.currentUser()?.isOfflineGuest) {
              <!-- Connect with Google -->
              <button
                type="button"
                (click)="connectGoogle()"
                class="w-full py-3 px-4 rounded-2xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-xs"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Vincular con Google</span>
              </button>
            } @else {
              <!-- Logout Button -->
              <button
                type="button"
                (click)="confirmingLogout.set(true)"
                class="w-full py-3 px-4 rounded-2xl bg-neutral-100 hover:bg-red-50 hover:text-red-700 text-neutral-700 text-xs font-bold transition-all border border-neutral-200 hover:border-red-200 flex items-center justify-center gap-2"
              >
                <svg class="w-4 h-4 stroke-[2]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span>Cerrar Sesión</span>
              </button>
            }

            <button
              type="button"
              (click)="close.emit()"
              class="w-full py-2.5 px-4 text-neutral-500 hover:text-neutral-900 text-xs font-semibold"
            >
              Cerrar
            </button>
          </div>
        }
      </div>
    </div>
  `
})
export class ProfileModalComponent {
  readonly auth = inject(AuthService);
  readonly actividadService = inject(ActividadService);
  readonly i18n = inject(I18nService);
  readonly close = output<void>();

  readonly confirmingLogout = signal<boolean>(false);
  readonly isLoggingOut = signal<boolean>(false);

  async connectGoogle() {
    try {
      await this.auth.loginWithGoogle();
      this.close.emit();
    } catch (e: any) {
      alert(e.message || 'Error al conectar con Google');
    }
  }

  async performLogout() {
    this.isLoggingOut.set(true);
    try {
      await this.auth.logout();
      this.close.emit();
    } catch (e) {
      console.warn('Error during logout:', e);
      this.close.emit();
    } finally {
      this.isLoggingOut.set(false);
      this.confirmingLogout.set(false);
    }
  }
}
