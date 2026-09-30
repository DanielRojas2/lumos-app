import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-offline-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (!auth.isOnline() || (auth.currentUser() && auth.currentUser()!.isOfflineGuest)) {
      <div class="px-4 py-2 bg-neutral-900 text-white flex items-center justify-between text-xs rounded-xl shadow-xs border border-neutral-800 my-2 mx-4">
        <div class="flex items-center gap-2">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2" [ngClass]="auth.isOnline() ? 'bg-emerald-400' : 'bg-amber-500'"></span>
          </span>
          <span class="font-medium text-neutral-300">
            {{ !auth.isOnline() ? i18n.t().today.offlineMode : 'Sesión Local (Invitado)' }}
          </span>
        </div>

        @if (auth.isOnline()) {
          <button
            type="button"
            (click)="onGoogleLogin()"
            class="text-[11px] font-semibold text-[#FFD54F] hover:text-[#FFE082] transition-colors underline flex items-center gap-1"
          >
            {{ i18n.t().today.signInGoogle }}
          </button>
        }
      </div>
    }
  `
})
export class OfflineBadgeComponent {
  readonly auth = inject(AuthService);
  readonly i18n = inject(I18nService);

  async onGoogleLogin() {
    try {
      await this.auth.loginWithGoogle();
    } catch (e: any) {
      alert(e.message || 'Error al conectar con Google');
    }
  }
}
