import { Injectable, signal, computed } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

export type SupportedLanguage = 'es' | 'en';

export interface TranslationDictionary {
  appName: string;
  slogan: string;
  tabs: {
    today: string;
    create: string;
    alarms: string;
    summary: string;
  };
  today: {
    todayBadge: string;
    title: string;
    completed: string;
    allFilter: string;
    nowBadge: string;
    priorityBadge: string;
    withoutAlarm: string;
    alarmAt: string;
    addActivityBtn: string;
    offlineMode: string;
    signInGoogle: string;
    noActivities: string;
  };
  create: {
    subtitle: string;
    title: string;
    editTitle: string;
    titleField: string;
    titlePlaceholder: string;
    category: string;
    dateTime: string;
    allDay: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    locationPlaceholder: string;
    alarmReminder: string;
    alarmDesc: string;
    minutesBefore: string;
    active: string;
    notes: string;
    notesPlaceholder: string;
    characters: string;
    saveBtn: string;
    updateBtn: string;
    cancelBtn: string;
    locations: {
      office: string;
      online: string;
      university: string;
      home: string;
    };
  };
  alarm: {
    title: string;
    anticipationTime: string;
    recommended: string;
    atMoment: string;
    min5: string;
    min15: string;
    min30: string;
    hour1: string;
    day1: string;
    toneVolume: string;
    defaultTone: string;
    toneDesc: string;
    changeTone: string;
    volume: string;
    vibration: string;
    vibrationDesc: string;
    insistenceFrequency: string;
    insistentMode: string;
    insistentDesc: string;
    frequency: string;
    freqOnce: string;
    freqDaily: string;
    freqWeekdays: string;
    freqWeekly: string;
    channels: string;
    pushNotification: string;
    pushDesc: string;
    fullScreen: string;
    fullScreenDesc: string;
    emailAlert: string;
    emailDesc: string;
    preview: string;
    simulation: string;
    snooze5m: string;
    viewDetails: string;
    saveConfig: string;
    syncNote: string;
    startsIn: string;
    selectMp4: string;
  };
  summary: {
    title: string;
    week: string;
    month: string;
    timeDistribution: string;
    thisWeek: string;
    goal: string;
    upcomingAlarms: string;
    activeAlarms: string;
    todayHeader: string;
    tomorrowHeader: string;
    inactive: string;
  };
  categories: {
    trabajo: string;
    clases: string;
    tareas: string;
    personal: string;
  };
  days: {
    mon: string;
    tue: string;
    wed: string;
    thu: string;
    fri: string;
    sat: string;
    sun: string;
  };
}

const ES_TRANSLATIONS: TranslationDictionary = {
  appName: 'Lumos',
  slogan: 'Organiza, Enfoca, Avanza.',
  tabs: {
    today: 'Hoy',
    create: 'Crear',
    alarms: 'Alarmas',
    summary: 'Resumen'
  },
  today: {
    todayBadge: 'HOY',
    title: 'Tu Ritmo Diario',
    completed: 'completado',
    allFilter: 'Todos',
    nowBadge: 'AHORA',
    priorityBadge: 'PRIORIDAD',
    withoutAlarm: 'Sin alarma',
    alarmAt: 'Alarma',
    addActivityBtn: 'Añadir Nueva Actividad',
    offlineMode: 'Modo Sin Conexión',
    signInGoogle: 'Vincular Google',
    noActivities: 'No hay actividades para este día'
  },
  create: {
    subtitle: 'PROGRAMACIÓN DIARIA',
    title: 'Nueva Actividad',
    editTitle: 'Editar Actividad',
    titleField: 'Título de la actividad *',
    titlePlaceholder: 'Ej. Presentación de Proyecto Final',
    category: 'Categoría',
    dateTime: 'Fecha y Horario',
    allDay: 'Todo el día',
    date: 'FECHA',
    startTime: 'HORA DE INICIO',
    endTime: 'HORA DE FIN',
    location: 'Ubicación',
    locationPlaceholder: 'Ej. Oficina, Google Meet, Casa...',
    alarmReminder: 'Alarma & Recordatorio',
    alarmDesc: 'Aviso previo con volumen gradual',
    minutesBefore: 'minutos antes',
    active: 'ACTIVO',
    notes: 'Notas',
    notesPlaceholder: 'Notas adicionales, enlaces o apuntes...',
    characters: 'caracteres',
    saveBtn: 'Guardar Actividad',
    updateBtn: 'Actualizar Actividad',
    cancelBtn: 'Cancelar',
    locations: {
      office: 'Oficina',
      online: 'En línea',
      university: 'Universidad',
      home: 'Casa'
    }
  },
  alarm: {
    title: 'Personalización de Alarma',
    anticipationTime: 'TIEMPO DE ANTICIPACIÓN',
    recommended: 'Recomendado',
    atMoment: 'En el momento',
    min5: '5 min antes',
    min15: '15 min antes',
    min30: '30 min antes',
    hour1: '1 hora antes',
    day1: '1 día antes',
    toneVolume: 'TONO Y VOLUMEN',
    defaultTone: 'Radar Suave (Lumos)',
    toneDesc: 'Tono ascendente armónico',
    changeTone: 'Cambiar',
    volume: 'Volumen',
    vibration: 'Vibración Táctil',
    vibrationDesc: 'Patrón continuo y firme',
    insistenceFrequency: 'INSISTENCIA Y RECURRENCIA',
    insistentMode: 'Modo Insistente',
    insistentDesc: 'Reactivar cada 5 min hasta apagar',
    frequency: 'FRECUENCIA',
    freqOnce: 'Solo una vez',
    freqDaily: 'Diariamente',
    freqWeekdays: 'Días hábiles',
    freqWeekly: 'Semanalmente',
    channels: 'CANALES DE NOTIFICACIÓN',
    pushNotification: 'Notificación Push',
    pushDesc: 'Banner prioritario en pantalla',
    fullScreen: 'Pantalla Completa',
    fullScreenDesc: 'Activa el dispositivo en reposo',
    emailAlert: 'Aviso por Correo',
    emailDesc: 'Resumen detallado de la actividad',
    preview: 'VISTA PREVIA',
    simulation: 'SIMULACIÓN',
    snooze5m: 'Posponer 5m',
    viewDetails: 'Ver Detalles',
    saveConfig: 'Guardar Configuración',
    syncNote: 'Los cambios se sincronizarán con tu calendario del sistema.',
    startsIn: 'Comienza en',
    selectMp4: 'Elegir archivo .mp4 o audio'
  },
  summary: {
    title: 'Resumen Semanal',
    week: 'Semana',
    month: 'Mes',
    timeDistribution: 'DISTRIBUCIÓN DE TIEMPO',
    thisWeek: 'esta semana',
    goal: 'meta',
    upcomingAlarms: 'PRÓXIMAS CON ALARMA',
    activeAlarms: 'activas',
    todayHeader: 'HOY',
    tomorrowHeader: 'MAÑANA',
    inactive: 'Inactiva'
  },
  categories: {
    trabajo: 'Trabajo',
    clases: 'Clases',
    tareas: 'Tareas',
    personal: 'Personal'
  },
  days: {
    mon: 'LUN',
    tue: 'MAR',
    wed: 'MIÉ',
    thu: 'JUE',
    fri: 'VIE',
    sat: 'SÁB',
    sun: 'DOM'
  }
};

const EN_TRANSLATIONS: TranslationDictionary = {
  appName: 'Lumos',
  slogan: 'Illuminate your day.',
  tabs: {
    today: 'Today',
    create: 'Create',
    alarms: 'Alarms',
    summary: 'Summary'
  },
  today: {
    todayBadge: 'TODAY',
    title: 'Your Daily Rhythm',
    completed: 'completed',
    allFilter: 'All',
    nowBadge: 'NOW',
    priorityBadge: 'PRIORITY',
    withoutAlarm: 'No alarm',
    alarmAt: 'Alarm',
    addActivityBtn: 'Add New Activity',
    offlineMode: 'Offline Mode',
    signInGoogle: 'Link Google',
    noActivities: 'No activities scheduled for this day'
  },
  create: {
    subtitle: 'DAILY SCHEDULE',
    title: 'New Activity',
    editTitle: 'Edit Activity',
    titleField: 'Activity Title *',
    titlePlaceholder: 'e.g. Final Project Presentation',
    category: 'Category',
    dateTime: 'Date and Time',
    allDay: 'All day',
    date: 'DATE',
    startTime: 'START TIME',
    endTime: 'END TIME',
    location: 'Location',
    locationPlaceholder: 'E.g. Office, Google Meet, Home...',
    alarmReminder: 'Alarm & Reminder',
    alarmDesc: 'Pre-alert with gradual volume',
    minutesBefore: 'minutes before',
    active: 'ACTIVE',
    notes: 'Notes',
    notesPlaceholder: 'Additional notes, links or reminders...',
    characters: 'characters',
    saveBtn: 'Save Activity',
    updateBtn: 'Update Activity',
    cancelBtn: 'Cancel',
    locations: {
      office: 'Office',
      online: 'Online',
      university: 'University',
      home: 'Home'
    }
  },
  alarm: {
    title: 'Alarm Customization',
    anticipationTime: 'ANTICIPATION TIME',
    recommended: 'Recommended',
    atMoment: 'At start time',
    min5: '5 min before',
    min15: '15 min before',
    min30: '30 min before',
    hour1: '1 hour before',
    day1: '1 day before',
    toneVolume: 'TONE & VOLUME',
    defaultTone: 'Soft Radar (Lumos)',
    toneDesc: 'Ascending harmonic chime',
    changeTone: 'Change',
    volume: 'Volume',
    vibration: 'Haptic Vibration',
    vibrationDesc: 'Continuous firm pulse',
    insistenceFrequency: 'INSISTENCE & RECURRENCE',
    insistentMode: 'Insistent Mode',
    insistentDesc: 'Repeat every 5 min until dismissed',
    frequency: 'FREQUENCY',
    freqOnce: 'Once only',
    freqDaily: 'Daily',
    freqWeekdays: 'Weekdays',
    freqWeekly: 'Weekly',
    channels: 'NOTIFICATION CHANNELS',
    pushNotification: 'Push Notification',
    pushDesc: 'Priority banner on screen',
    fullScreen: 'Full Screen',
    fullScreenDesc: 'Wake device from sleep',
    emailAlert: 'Email Notification',
    emailDesc: 'Detailed activity overview',
    preview: 'PREVIEW',
    simulation: 'SIMULATION',
    snooze5m: 'Snooze 5m',
    viewDetails: 'View Details',
    saveConfig: 'Save Configuration',
    syncNote: 'Changes will sync with your system calendar.',
    startsIn: 'Starts in',
    selectMp4: 'Choose .mp4 file or audio'
  },
  summary: {
    title: 'Weekly Summary',
    week: 'Week',
    month: 'Month',
    timeDistribution: 'TIME DISTRIBUTION',
    thisWeek: 'this week',
    goal: 'goal',
    upcomingAlarms: 'UPCOMING ALARMS',
    activeAlarms: 'active',
    todayHeader: 'TODAY',
    tomorrowHeader: 'TOMORROW',
    inactive: 'Inactive'
  },
  categories: {
    trabajo: 'Work',
    clases: 'Classes',
    tareas: 'Tasks',
    personal: 'Personal'
  },
  days: {
    mon: 'MON',
    tue: 'TUE',
    wed: 'WED',
    thu: 'THU',
    fri: 'FRI',
    sat: 'SAT',
    sun: 'SUN'
  }
};

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private readonly LANG_KEY = 'lumos_preferred_lang';
  readonly currentLang = signal<SupportedLanguage>('es');

  readonly t = computed<TranslationDictionary>(() => {
    return this.currentLang() === 'en' ? EN_TRANSLATIONS : ES_TRANSLATIONS;
  });

  readonly isSpanish = computed(() => this.currentLang() === 'es');

  constructor() {
    this.initLanguage();
  }

  private async initLanguage() {
    try {
      const { value } = await Preferences.get({ key: this.LANG_KEY });
      if (value === 'en' || value === 'es') {
        this.currentLang.set(value);
      } else {
        const browserLang = navigator.language.toLowerCase();
        if (browserLang.startsWith('en')) {
          this.currentLang.set('en');
        } else {
          this.currentLang.set('es');
        }
      }
    } catch {
      this.currentLang.set('es');
    }
  }

  async setLanguage(lang: SupportedLanguage) {
    this.currentLang.set(lang);
    try {
      await Preferences.set({ key: this.LANG_KEY, value: lang });
    } catch (e) {
      console.warn('Could not persist language preference', e);
    }
  }

  toggleLanguage() {
    const next = this.currentLang() === 'es' ? 'en' : 'es';
    this.setLanguage(next);
  }
}
