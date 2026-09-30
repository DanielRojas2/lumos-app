import { Injectable, signal, inject } from '@angular/core';
import { LocalNotifications, ScheduleOptions, Channel, ActionPerformed } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { Alarma } from '../models/alarma.model';
import { Actividad } from '../models/actividad.model';
import { SoundPickerService } from './sound-picker.service';

export interface ActiveAlarmPayload {
  id: number;
  title: string;
  body: string;
  categoria?: string;
  tono?: string;
  volumen?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private channelCreated = false;
  private soundPicker = inject(SoundPickerService);

  readonly activeAlarm = signal<ActiveAlarmPayload | null>(null);

  constructor() {
    this.createNotificationChannel();
    this.registerNotificationListeners();
  }

  private registerNotificationListeners() {
    try {
      LocalNotifications.addListener('localNotificationReceived', (notification) => {
        this.handleAlarmTriggered({
          id: notification.id,
          title: notification.title,
          body: notification.body,
          categoria: notification.extra?.categoria,
          tono: notification.extra?.tono,
          volumen: notification.extra?.volumen
        });
      });

      LocalNotifications.addListener('localNotificationActionPerformed', (action: ActionPerformed) => {
        this.handleAlarmTriggered({
          id: action.notification.id,
          title: action.notification.title,
          body: action.notification.body,
          categoria: action.notification.extra?.categoria,
          tono: action.notification.extra?.tono,
          volumen: action.notification.extra?.volumen
        });
      });
    } catch (e) {
      console.warn('Could not register notification listeners:', e);
    }
  }

  handleAlarmTriggered(payload: ActiveAlarmPayload) {
    this.activeAlarm.set(payload);
    this.triggerHapticFeedback(true);
    if (payload.tono) {
      this.soundPicker.playTone(payload.tono, payload.volumen ?? 85);
    } else {
      this.soundPicker.playPreview(85);
    }
  }

  dismissActiveAlarm() {
    this.soundPicker.stopPreview();
    this.activeAlarm.set(null);
  }

  async snoozeActiveAlarm(minutes: number = 5) {
    const current = this.activeAlarm();
    this.dismissActiveAlarm();
    if (!current) return;

    const snoozeDate = new Date(Date.now() + minutes * 60 * 1000);
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: current.id + 1,
            title: current.title,
            body: `(Pospuesto) ${current.body}`,
            schedule: { at: snoozeDate, allowWhileIdle: true },
            channelId: 'lumos_exact_alarms',
            extra: {
              categoria: current.categoria,
              tono: current.tono,
              volumen: current.volumen
            }
          }
        ]
      });
    } catch (e) {
      console.warn('Error rescheduling snoozed alarm:', e);
    }
  }

  private async createNotificationChannel() {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const channel: Channel = {
        id: 'lumos_exact_alarms',
        name: 'Alarmas y Recordatorios Lumos',
        description: 'Canal prioritario de alarmas con sonido y vibración de alta precisión',
        importance: 5, // High importance
        visibility: 1, // Public on lockscreen
        vibration: true,
        lights: true,
        lightColor: '#FF3300'
      };
      await LocalNotifications.createChannel(channel);
      this.channelCreated = true;
    } catch (e) {
      console.warn('Could not create notification channel:', e);
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const status = await LocalNotifications.checkPermissions();
      if (status.display === 'granted') {
        return true;
      }
      const request = await LocalNotifications.requestPermissions();
      return request.display === 'granted';
    } catch (e) {
      console.warn('Permissions request error:', e);
      return false;
    }
  }

  async triggerHapticFeedback(pattern: boolean = true) {
    try {
      if (pattern) {
        await Haptics.notification({ type: NotificationType.Warning });
      } else {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      }
    } catch {
      // Ignored if haptics unavailable on browser
    }
  }

  calculateAlarmDate(fecha: string, hora: string, anticipacionMinutos: number): Date {
    // fecha: YYYY-MM-DD, hora: HH:mm
    const [year, month, day] = fecha.split('-').map(Number);
    const [hours, minutes] = hora.split(':').map(Number);
    
    const targetDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
    // Subtract anticipation
    const alarmTime = targetDate.getTime() - anticipacionMinutos * 60 * 1000;
    return new Date(alarmTime);
  }

  async scheduleActivityAlarm(actividad: Actividad, alarma: Alarma): Promise<number | null> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      console.warn('Notification permissions not granted');
    }

    const alarmDate = this.calculateAlarmDate(
      actividad.fecha_actividad,
      actividad.hora_inicio,
      alarma.tiempo_anticipacion
    );

    // If alarm date is in the past, do not schedule
    if (alarmDate.getTime() <= Date.now()) {
      console.log('Alarm date is in the past, skipping exact schedule');
      return null;
    }

    // Generate integer ID from string hash or timestamp
    const notifId = Math.abs(this.hashString(actividad.id || alarma.id));

    try {
      const scheduleOptions: ScheduleOptions = {
        notifications: [
          {
            id: notifId,
            title: `⏰ Lumos: ${actividad.titulo}`,
            body: alarma.mensaje || `${actividad.titulo} comienza en ${alarma.tiempo_anticipacion} min.`,
            schedule: { at: alarmDate, allowWhileIdle: true },
            channelId: 'lumos_exact_alarms',
            sound: alarma.tono.endsWith('.mp4') || alarma.tono.endsWith('.wav') ? alarma.tono : undefined,
            extra: {
              actividadId: actividad.id,
              alarmaId: alarma.id,
              categoria: actividad.categoria,
              tono: alarma.tono,
              volumen: alarma.volumen
            }
          }
        ]
      };

      await LocalNotifications.schedule(scheduleOptions);
      console.log(`Alarm scheduled for ${actividad.titulo} at ${alarmDate.toISOString()} with ID ${notifId}`);
      return notifId;
    } catch (e) {
      console.warn('Error scheduling local notification:', e);
      return null;
    }
  }

  async cancelAlarm(actividadId: string, alarmaId: string): Promise<void> {
    try {
      const notifId = Math.abs(this.hashString(actividadId || alarmaId));
      await LocalNotifications.cancel({ notifications: [{ id: notifId }] });
    } catch (e) {
      console.warn('Error canceling notification:', e);
    }
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash) % 2147483647;
  }
}
