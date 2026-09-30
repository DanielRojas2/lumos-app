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
  actividadId?: string;
  alarmaId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private channelCreated = false;
  private soundPicker = inject(SoundPickerService);
  private hapticInterval: any = null;
  private webAlarmCheckInterval: any = null;
  private scheduledWebAlarms: Array<{
    id: number;
    targetTime: number;
    actividad: Actividad;
    alarma: Alarma;
  }> = [];

  readonly activeAlarm = signal<ActiveAlarmPayload | null>(null);

  constructor() {
    this.createNotificationChannel();
    this.registerNotificationActions();
    this.registerNotificationListeners();
    this.initWebAlarmWorker();
  }

  private async registerNotificationActions() {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await LocalNotifications.registerActionTypes({
        types: [
          {
            id: 'LUMOS_ALARM_ACTIONS',
            actions: [
              {
                id: 'DISMISS',
                title: 'Descartar',
                destructive: true
              },
              {
                id: 'SNOOZE',
                title: 'Posponer 5 min'
              }
            ]
          }
        ]
      });
    } catch (e) {
      console.warn('Could not register notification action types:', e);
    }
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
          volumen: notification.extra?.volumen,
          actividadId: notification.extra?.actividadId,
          alarmaId: notification.extra?.alarmaId
        });
      });

      LocalNotifications.addListener('localNotificationActionPerformed', (action: ActionPerformed) => {
        const notif = action.notification;
        if (action.actionId === 'DISMISS') {
          this.dismissActiveAlarm();
          this.cancelAlarm(notif.extra?.actividadId || '', notif.extra?.alarmaId || '');
          return;
        }

        if (action.actionId === 'SNOOZE') {
          this.snoozeActiveAlarm(5);
          return;
        }

        // Tapping the notification body opens the alarm modal in app
        this.handleAlarmTriggered({
          id: notif.id,
          title: notif.title,
          body: notif.body,
          categoria: notif.extra?.categoria,
          tono: notif.extra?.tono,
          volumen: notif.extra?.volumen,
          actividadId: notif.extra?.actividadId,
          alarmaId: notif.extra?.alarmaId
        });
      });
    } catch (e) {
      console.warn('Could not register notification listeners:', e);
    }
  }

  // Web background alarm runner to support browser tabs
  private initWebAlarmWorker() {
    if (typeof window === 'undefined') return;

    // Check every 5 seconds for scheduled web alarms
    this.webAlarmCheckInterval = setInterval(() => {
      const now = Date.now();
      const triggered = this.scheduledWebAlarms.filter((item) => item.targetTime <= now);
      if (triggered.length > 0) {
        this.scheduledWebAlarms = this.scheduledWebAlarms.filter((item) => item.targetTime > now);
        for (const item of triggered) {
          this.triggerWebAlarm(item.actividad, item.alarma, item.id);
        }
      }
    }, 5000);
  }

  private triggerWebAlarm(actividad: Actividad, alarma: Alarma, id: number) {
    // Show HTML5 Notification if permitted
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(`⏰ Lumos: ${actividad.titulo}`, {
          body: alarma.mensaje || `${actividad.titulo} comienza ahora.`,
          icon: '/favicon.svg',
          requireInteraction: true
        });
      } catch {}
    }

    this.handleAlarmTriggered({
      id: id,
      title: `⏰ Lumos: ${actividad.titulo}`,
      body: alarma.mensaje || `${actividad.titulo} comienza ahora.`,
      categoria: actividad.categoria,
      tono: alarma.tono,
      volumen: alarma.volumen,
      actividadId: actividad.id,
      alarmaId: alarma.id
    });
  }

  handleAlarmTriggered(payload: ActiveAlarmPayload) {
    this.activeAlarm.set(payload);

    // Continuous haptic pulse like a phone alarm
    this.startHapticAlarmPulse();

    // Continuous looping audio tone until user dismisses or snoozes!
    const toneUri = payload.tono || this.soundPicker.currentTone().uri;
    const vol = payload.volumen ?? 85;
    this.soundPicker.playTone(toneUri, vol, true);
  }

  private startHapticAlarmPulse() {
    this.stopHapticAlarmPulse();
    this.triggerHapticFeedback(true);

    if (Capacitor.isNativePlatform()) {
      this.hapticInterval = setInterval(() => {
        this.triggerHapticFeedback(true);
      }, 1500);
    }
  }

  private stopHapticAlarmPulse() {
    if (this.hapticInterval) {
      clearInterval(this.hapticInterval);
      this.hapticInterval = null;
    }
  }

  dismissActiveAlarm() {
    this.stopHapticAlarmPulse();
    this.soundPicker.stopPreview();
    const cur = this.activeAlarm();
    if (cur) {
      this.cancelAlarm(cur.actividadId || '', cur.alarmaId || '');
    }
    this.activeAlarm.set(null);
  }

  async snoozeActiveAlarm(minutes: number = 5) {
    const current = this.activeAlarm();
    this.dismissActiveAlarm();
    if (!current) return;

    const snoozeDate = new Date(Date.now() + minutes * 60 * 1000);
    const soundFile = this.soundPicker.getNativeSoundFileName(current.tono || '');

    try {
      if (Capacitor.isNativePlatform()) {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: current.id + 1,
              title: `⏰ (Pospuesto) ${current.title}`,
              body: `${current.body} (Poscurrido ${minutes} min)`,
              schedule: { at: snoozeDate, allowWhileIdle: true },
              channelId: 'lumos_exact_alarms',
              sound: soundFile,
              actionTypeId: 'LUMOS_ALARM_ACTIONS',
              ongoing: true,
              autoCancel: false,
              extra: {
                categoria: current.categoria,
                tono: current.tono,
                volumen: current.volumen,
                actividadId: current.actividadId,
                alarmaId: current.alarmaId
              }
            }
          ]
        });
      } else {
        this.scheduledWebAlarms.push({
          id: current.id + 1,
          targetTime: snoozeDate.getTime(),
          actividad: {
            titulo: current.title,
            categoria: (current.categoria as any) || 'personal',
            hora_inicio: '',
            hora_fin: '',
            fecha_actividad: '',
            hora_alarma: '',
            alarma_id: current.alarmaId || '',
            id_usuario: '',
            ubicacion: '',
            notas: '',
            completado: false,
            creado: ''
          },
          alarma: {
            id: current.alarmaId || '',
            tiempo_anticipacion: 0,
            tono: current.tono || 'default_radar_suave',
            volumen: current.volumen || 85,
            vibracion: true,
            recurrencia: true,
            frecuencia: 'una_vez',
            notificacion_push: true,
            pantalla_completa: true,
            mensaje: current.body
          }
        });
      }
    } catch (e) {
      console.warn('Error rescheduling snoozed alarm:', e);
    }
  }

  private async createNotificationChannel() {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const channel: Channel = {
        id: 'lumos_exact_alarms',
        name: 'Alarmas Lumos',
        description: 'Canal prioritario de alarmas con sonido y vibración continua',
        importance: 5, // High importance (heads-up notification & sound)
        visibility: 1, // Public on lockscreen
        sound: 'radar_suave.wav', // In android/app/src/main/res/raw/radar_suave.wav
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
      if (Capacitor.isNativePlatform()) {
        const status = await LocalNotifications.checkPermissions();
        if (status.display === 'granted') {
          return true;
        }
        const request = await LocalNotifications.requestPermissions();
        return request.display === 'granted';
      } else {
        if (typeof Notification !== 'undefined') {
          if (Notification.permission === 'granted') return true;
          const perm = await Notification.requestPermission();
          return perm === 'granted';
        }
        return true;
      }
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
    const [year, month, day] = fecha.split('-').map(Number);
    const [hours, minutes] = hora.split(':').map(Number);

    const targetDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
    const alarmTime = targetDate.getTime() - anticipacionMinutos * 60 * 1000;
    return new Date(alarmTime);
  }

  async scheduleActivityAlarm(actividad: Actividad, alarma: Alarma): Promise<number | null> {
    await this.requestPermissions();

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

    const notifId = Math.abs(this.hashString(actividad.id || alarma.id));
    const soundFile = this.soundPicker.getNativeSoundFileName(alarma.tono);

    try {
      if (Capacitor.isNativePlatform()) {
        const scheduleOptions: ScheduleOptions = {
          notifications: [
            {
              id: notifId,
              title: `⏰ Lumos: ${actividad.titulo}`,
              body: alarma.mensaje || `${actividad.titulo} comienza en ${alarma.tiempo_anticipacion} min.`,
              schedule: { at: alarmDate, allowWhileIdle: true },
              channelId: 'lumos_exact_alarms',
              sound: soundFile,
              actionTypeId: 'LUMOS_ALARM_ACTIONS',
              ongoing: true,
              autoCancel: false,
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
        console.log(`Alarm scheduled on Android for ${actividad.titulo} at ${alarmDate.toISOString()} with tone: ${soundFile}`);
      } else {
        // Web scheduling
        this.scheduledWebAlarms = this.scheduledWebAlarms.filter((a) => a.id !== notifId);
        this.scheduledWebAlarms.push({
          id: notifId,
          targetTime: alarmDate.getTime(),
          actividad,
          alarma
        });
        console.log(`Alarm scheduled on Web for ${actividad.titulo} at ${alarmDate.toISOString()}`);
      }

      return notifId;
    } catch (e) {
      console.warn('Error scheduling local notification:', e);
      return null;
    }
  }

  async cancelAlarm(actividadId: string, alarmaId: string): Promise<void> {
    try {
      const notifId = Math.abs(this.hashString(actividadId || alarmaId));
      if (Capacitor.isNativePlatform()) {
        await LocalNotifications.cancel({ notifications: [{ id: notifId }] });
      }
      this.scheduledWebAlarms = this.scheduledWebAlarms.filter((a) => a.id !== notifId);
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
