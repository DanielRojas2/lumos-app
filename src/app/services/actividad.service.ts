import { Injectable, signal, computed, inject } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../core/firebase';
import { Actividad, CategoriaActividad } from '../models/actividad.model';
import { Alarma } from '../models/alarma.model';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';

const INITIAL_ACTIVITIES: Actividad[] = [
  {
    id: 'act_1',
    id_usuario: 'seed_user',
    titulo: 'Reunión de Sincronización de Equipo',
    categoria: 'trabajo',
    ubicacion: 'Google Meet',
    fecha_actividad: new Date().toISOString().split('T')[0],
    hora_inicio: '08:30',
    hora_fin: '09:30',
    hora_alarma: '08:15',
    alarma_id: 'alarm_1',
    notas: 'Revisión de avance semanal y bloqueantes.',
    completado: true,
    creado: new Date().toISOString()
  },
  {
    id: 'act_2',
    id_usuario: 'seed_user',
    titulo: 'Clase: Arquitectura de Software',
    categoria: 'clases',
    ubicacion: 'Fac. Ingeniería, Aula 302',
    fecha_actividad: new Date().toISOString().split('T')[0],
    hora_inicio: '10:15',
    hora_fin: '12:00',
    hora_alarma: '10:00',
    alarma_id: 'alarm_2',
    notas: 'Llevar apuntes de patrones arquitectónicos.',
    completado: false,
    creado: new Date().toISOString()
  },
  {
    id: 'act_3',
    id_usuario: 'seed_user',
    titulo: 'Almuerzo y networking',
    categoria: 'personal',
    ubicacion: 'Bistró Central, Av. Reforma',
    fecha_actividad: new Date().toISOString().split('T')[0],
    hora_inicio: '13:30',
    hora_fin: '14:30',
    hora_alarma: '',
    alarma_id: '',
    notas: 'Reunión informal con el equipo de producto.',
    completado: false,
    creado: new Date().toISOString()
  },
  {
    id: 'act_4',
    id_usuario: 'seed_user',
    titulo: 'Entrega de Informe Trimestral',
    categoria: 'trabajo',
    ubicacion: 'Oficina Central',
    fecha_actividad: new Date().toISOString().split('T')[0],
    hora_inicio: '15:30',
    hora_fin: '17:00',
    hora_alarma: '15:00',
    alarma_id: 'alarm_4',
    notas: 'Revisión final de métricas de desempeño financiero.',
    completado: false,
    creado: new Date().toISOString()
  },
  {
    id: 'act_5',
    id_usuario: 'seed_user',
    titulo: 'Taller de Diseño UX/UI',
    categoria: 'clases',
    ubicacion: 'Campus Norte, Lab 4',
    fecha_actividad: new Date().toISOString().split('T')[0],
    hora_inicio: '18:00',
    hora_fin: '19:30',
    hora_alarma: '17:45',
    alarma_id: 'alarm_5',
    notas: 'Pruebas de usabilidad y wireframing en Figma.',
    completado: false,
    creado: new Date().toISOString()
  },
  // Upcoming activities for next days
  {
    id: 'act_6',
    id_usuario: 'seed_user',
    titulo: 'Diseño de Sistemas Distribuidos',
    categoria: 'clases',
    ubicacion: 'Campus Central · Auditorio',
    fecha_actividad: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    hora_inicio: '09:00',
    hora_fin: '11:00',
    hora_alarma: '08:15',
    alarma_id: 'alarm_6',
    notas: 'Teoría CAP y replicación de base de datos.',
    completado: false,
    creado: new Date().toISOString()
  },
  {
    id: 'act_7',
    id_usuario: 'seed_user',
    titulo: 'Demo Cliente & Entrega de Sprint',
    categoria: 'trabajo',
    ubicacion: 'Oficina Principal · Piso 4',
    fecha_actividad: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    hora_inicio: '15:00',
    hora_fin: '16:30',
    hora_alarma: '14:40',
    alarma_id: 'alarm_7',
    notas: 'Presentación de funcionalidades versión 1.2.',
    completado: false,
    creado: new Date().toISOString()
  },
  {
    id: 'act_8',
    id_usuario: 'seed_user',
    titulo: 'Entrega Ensayo de Ética Tecnológica',
    categoria: 'tareas',
    ubicacion: 'Portal Académico',
    fecha_actividad: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    hora_inicio: '19:00',
    hora_fin: '20:30',
    hora_alarma: '',
    alarma_id: 'alarm_8',
    notas: 'Subir PDF con normas APA antes de medianoche.',
    completado: false,
    creado: new Date().toISOString()
  }
];

const INITIAL_ALARMAS: Record<string, Alarma> = {
  alarm_1: {
    id: 'alarm_1',
    tiempo_anticipacion: 15,
    tono: 'default_radar_suave',
    volumen: 85,
    vibracion: true,
    recurrencia: true,
    frecuencia: 'dias_habiles',
    notificacion_push: true,
    pantalla_completa: true,
    mensaje: 'Comienza en 15 minutos en Google Meet.'
  },
  alarm_2: {
    id: 'alarm_2',
    tiempo_anticipacion: 15,
    tono: 'default_radar_suave',
    volumen: 85,
    vibracion: true,
    recurrencia: true,
    frecuencia: 'solo_una_vez' as any,
    notificacion_push: true,
    pantalla_completa: true,
    mensaje: 'Comienza en 15 minutos en el Aula 302.'
  },
  alarm_4: {
    id: 'alarm_4',
    tiempo_anticipacion: 30,
    tono: 'default_radar_suave',
    volumen: 90,
    vibracion: true,
    recurrencia: true,
    frecuencia: 'solo_una_vez' as any,
    notificacion_push: true,
    pantalla_completa: true,
    mensaje: 'Entrega de Informe Trimestral en 30 minutos.'
  },
  alarm_5: {
    id: 'alarm_5',
    tiempo_anticipacion: 15,
    tono: 'default_radar_suave',
    volumen: 80,
    vibracion: true,
    recurrencia: false,
    frecuencia: 'solo_una_vez' as any,
    notificacion_push: true,
    pantalla_completa: false,
    mensaje: 'Taller de Diseño UX/UI en 15 min.'
  },
  alarm_6: {
    id: 'alarm_6',
    tiempo_anticipacion: 45,
    tono: 'default_radar_suave',
    volumen: 85,
    vibracion: true,
    recurrencia: true,
    frecuencia: 'dias_habiles',
    notificacion_push: true,
    pantalla_completa: true,
    mensaje: 'Diseño de Sistemas Distribuidos en 45 min.'
  },
  alarm_7: {
    id: 'alarm_7',
    tiempo_anticipacion: 20,
    tono: 'default_radar_suave',
    volumen: 85,
    vibracion: true,
    recurrencia: true,
    frecuencia: 'solo_una_vez' as any,
    notificacion_push: true,
    pantalla_completa: true,
    mensaje: 'Demo Cliente en 20 min.'
  },
  alarm_8: {
    id: 'alarm_8',
    tiempo_anticipacion: 0,
    tono: 'default_radar_suave',
    volumen: 70,
    vibracion: false,
    recurrencia: false,
    frecuencia: 'solo_una_vez' as any,
    notificacion_push: false,
    pantalla_completa: false,
    mensaje: 'Alarma inactiva'
  }
};

@Injectable({
  providedIn: 'root'
})
export class ActividadService {
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);

  private readonly STORAGE_ACTIVITIES_KEY = 'lumos_stored_activities';
  private readonly STORAGE_ALARMAS_KEY = 'lumos_stored_alarms';

  readonly actividades = signal<Actividad[]>([]);
  readonly alarmas = signal<Record<string, Alarma>>({});
  readonly selectedCategory = signal<CategoriaActividad | 'todos'>('todos');
  readonly selectedDate = signal<string>(new Date().toISOString().split('T')[0]);

  // Filtered by selected date and category
  readonly actividadesDelDia = computed(() => {
    const date = this.selectedDate();
    const cat = this.selectedCategory();
    return this.actividades()
      .filter((a) => a.fecha_actividad === date)
      .filter((a) => (cat === 'todos' ? true : a.categoria === cat))
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  });

  // Today's total completion percentage
  readonly porcentajeCompletado = computed(() => {
    const list = this.actividades().filter((a) => a.fecha_actividad === this.selectedDate());
    if (list.length === 0) return 0;
    const completed = list.filter((a) => a.completado).length;
    return Math.round((completed / list.length) * 100);
  });

  // Active alarms count
  readonly alarmasActivas = computed(() => {
    const alarmsMap = this.alarmas();
    return this.actividades().filter((a) => {
      if (!a.alarma_id) return false;
      const al = alarmsMap[a.alarma_id];
      return al && (al.notificacion_push || al.tiempo_anticipacion >= 0 && al.volumen > 0);
    });
  });

  // Hours distribution for Weekly Summary
  readonly distribucionHoras = computed(() => {
    const res: Record<CategoriaActividad, number> = {
      trabajo: 0,
      clases: 0,
      tareas: 0,
      personal: 0
    };

    let totalMinutes = 0;
    for (const act of this.actividades()) {
      const [startH, startM] = act.hora_inicio.split(':').map(Number);
      const [endH, endM] = act.hora_fin.split(':').map(Number);
      const mins = Math.max(30, (endH * 60 + endM) - (startH * 60 + startM));
      res[act.categoria] = (res[act.categoria] || 0) + mins;
      totalMinutes += mins;
    }

    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

    return {
      totalHours: totalHours || 35,
      trabajoHours: Math.round(res.trabajo / 60) || 14,
      clasesHours: Math.round(res.clases / 60) || 10,
      tareasHours: Math.round(res.tareas / 60) || 6,
      personalHours: Math.round(res.personal / 60) || 5,
      trabajoPct: totalMinutes ? Math.round((res.trabajo / totalMinutes) * 100) : 40,
      clasesPct: totalMinutes ? Math.round((res.clases / totalMinutes) * 100) : 28,
      tareasPct: totalMinutes ? Math.round((res.tareas / totalMinutes) * 100) : 17,
      personalPct: totalMinutes ? Math.round((res.personal / totalMinutes) * 100) : 15
    };
  });

  constructor() {
    this.cargarDatosIniciales();
  }

  private async cargarDatosIniciales() {
    try {
      const { value: actStr } = await Preferences.get({ key: this.STORAGE_ACTIVITIES_KEY });
      const { value: almStr } = await Preferences.get({ key: this.STORAGE_ALARMAS_KEY });

      if (actStr && almStr) {
        this.actividades.set(JSON.parse(actStr));
        this.alarmas.set(JSON.parse(almStr));
      } else {
        // Initialize with default seeds
        this.actividades.set(INITIAL_ACTIVITIES);
        this.alarmas.set(INITIAL_ALARMAS);
        await this.persistirLocal();
      }
    } catch {
      this.actividades.set(INITIAL_ACTIVITIES);
      this.alarmas.set(INITIAL_ALARMAS);
    }
  }

  private async persistirLocal() {
    try {
      await Preferences.set({
        key: this.STORAGE_ACTIVITIES_KEY,
        value: JSON.stringify(this.actividades())
      });
      await Preferences.set({
        key: this.STORAGE_ALARMAS_KEY,
        value: JSON.stringify(this.alarmas())
      });
    } catch (e) {
      console.warn('Error saving to preferences:', e);
    }
  }

  async toggleCompletado(id: string) {
    this.actividades.update((list) =>
      list.map((act) => (act.id === id ? { ...act, completado: !act.completado } : act))
    );
    await this.persistirLocal();
  }

  async agregarActividad(actividad: Omit<Actividad, 'id' | 'creado'>, alarma?: Alarma): Promise<string> {
    const actId = 'act_' + Date.now();
    let alarmaId = actividad.alarma_id;

    if (alarma) {
      alarmaId = 'alarm_' + Date.now();
      alarma.id = alarmaId;
      this.alarmas.update((map) => ({ ...map, [alarmaId]: alarma }));
      // Schedule local notification
      await this.notifications.scheduleActivityAlarm({ ...actividad, id: actId, alarma_id: alarmaId, creado: new Date().toISOString() }, alarma);
    }

    const nuevaActividad: Actividad = {
      ...actividad,
      id: actId,
      alarma_id: alarmaId,
      creado: new Date().toISOString()
    };

    this.actividades.update((list) => [nuevaActividad, ...list]);
    await this.persistirLocal();
    return actId;
  }

  async actualizarActividad(actividad: Actividad, alarma?: Alarma) {
    if (alarma && actividad.alarma_id) {
      this.alarmas.update((map) => ({ ...map, [actividad.alarma_id]: alarma }));
      await this.notifications.scheduleActivityAlarm(actividad, alarma);
    }

    this.actividades.update((list) =>
      list.map((item) => (item.id === actividad.id ? actividad : item))
    );
    await this.persistirLocal();
  }

  async eliminarActividad(id: string) {
    const act = this.actividades().find((a) => a.id === id);
    if (act && act.alarma_id) {
      await this.notifications.cancelAlarm(act.id || '', act.alarma_id);
    }
    this.actividades.update((list) => list.filter((item) => item.id !== id));
    await this.persistirLocal();
  }

  async toggleAlarma(actividadId: string) {
    const act = this.actividades().find((a) => a.id === actividadId);
    if (!act) return;

    if (act.alarma_id && this.alarmas()[act.alarma_id]) {
      const alm = this.alarmas()[act.alarma_id];
      const nuevaAlarma: Alarma = {
        ...alm,
        notificacion_push: !alm.notificacion_push
      };
      this.alarmas.update((map) => ({ ...map, [act.alarma_id]: nuevaAlarma }));

      if (nuevaAlarma.notificacion_push) {
        await this.notifications.scheduleActivityAlarm(act, nuevaAlarma);
      } else {
        await this.notifications.cancelAlarm(act.id || '', act.alarma_id);
      }
      await this.persistirLocal();
    }
  }

  getAlarmaById(alarmaId: string): Alarma | undefined {
    return this.alarmas()[alarmaId];
  }
}
