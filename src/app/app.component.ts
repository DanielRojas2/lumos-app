import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SplashIntroComponent } from './components/splash-intro/splash-intro.component';
import { BottomNavComponent, ActiveTab } from './components/bottom-nav/bottom-nav.component';
import { ProfileModalComponent } from './components/profile-modal/profile-modal.component';
import { HoyComponent } from './pages/hoy/hoy.component';
import { CrearActividadComponent } from './pages/crear-actividad/crear-actividad.component';
import { ConfigurarAlarmaComponent } from './pages/configurar-alarma/configurar-alarma.component';
import { ActividadService } from './services/actividad.service';
import { NotificationService } from './services/notification.service';
import { Actividad } from './models/actividad.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    SplashIntroComponent,
    BottomNavComponent,
    ProfileModalComponent,
    HoyComponent,
    CrearActividadComponent,
    ConfigurarAlarmaComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class App {
  readonly actividadService = inject(ActividadService);
  readonly notificationService = inject(NotificationService);

  readonly showSplash = signal<boolean>(true);
  readonly activeTab = signal<ActiveTab>('hoy');
  readonly showProfileModal = signal<boolean>(false);

  readonly selectedActivityForEdit = signal<Actividad | null>(null);
  readonly selectedActivityForAlarm = signal<Actividad | null>(null);

  onSplashCompleted() {
    this.showSplash.set(false);
  }

  onTabChange(tab: ActiveTab) {
    if (tab === 'alarmas' && !this.selectedActivityForAlarm()) {
      // Pick first activity with alarm or first activity
      const acts = this.actividadService.actividades();
      const withAlarm = acts.find((a) => a.id === 'act_2') || acts[0];
      this.selectedActivityForAlarm.set(withAlarm || null);
    }
    if (tab === 'crear') {
      this.selectedActivityForEdit.set(null);
    }
    this.activeTab.set(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openCreateActivity() {
    this.selectedActivityForEdit.set(null);
    this.activeTab.set('crear');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openEditActivity(act: Actividad) {
    this.selectedActivityForEdit.set(act);
    this.selectedActivityForAlarm.set(act);
    this.activeTab.set('crear');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openAlarmFromCreate() {
    const act = this.selectedActivityForEdit() || this.actividadService.actividades()[1];
    if (act) {
      this.selectedActivityForAlarm.set(act);
    }
    this.activeTab.set('alarmas');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onActivitySaved() {
    this.activeTab.set('hoy');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onAlarmConfigSaved() {
    this.activeTab.set('hoy');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openProfile() {
    this.showProfileModal.set(true);
  }

  closeProfile() {
    this.showProfileModal.set(false);
  }
}
