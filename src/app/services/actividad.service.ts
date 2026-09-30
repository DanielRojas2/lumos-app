import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, where, Unsubscribe } from 'firebase/firestore';
import { db } from '../core/firebase';
import { Actividad, CategoriaActividad } from '../models/actividad.model';
import { Alarma } from '../models/alarma.model';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class ActividadService {
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);

  private readonly STORAGE_ACTIVITIES_PREFIX = 'lumos_stored_activities_';
  private readonly STORAGE_ALARMAS_PREFIX = 'lumos_stored_alarms_';

  readonly actividades = signal<Actividad[]>([]);
  readonly alarmas = signal<Record<string, Alarma>>({});
  readonly selectedCategory = signal<CategoriaActividad | 'todos'>('todos');
  readonly selectedDate = signal<string>(new Date().toISOString().split('T')[0]);

  private firestoreUnsubscribe: Unsubscribe | null = null;
  private currentUserId: string = '';

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
      return al && (al.notificacion_push || (al.tiempo_anticipacion >= 0 && al.volumen > 0));
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
      totalHours: totalHours,
      trabajoHours: Math.round(res.trabajo / 60),
      clasesHours: Math.round(res.clases / 60),
      tareasHours: Math.round(res.tareas / 60),
      personalHours: Math.round(res.personal / 60),
      trabajoPct: totalMinutes ? Math.round((res.trabajo / totalMinutes) * 100) : 0,
      clasesPct: totalMinutes ? Math.round((res.clases / totalMinutes) * 100) : 0,
      tareasPct: totalMinutes ? Math.round((res.tareas / totalMinutes) * 100) : 0,
      personalPct: totalMinutes ? Math.round((res.personal / totalMinutes) * 100) : 0
    };
  });

  constructor() {
    // Reactively watch user session changes
    effect(() => {
      const user = this.auth.currentUser();
      const uid = user ? user.uid : 'guest';
      const isGuest = !user || user.isOfflineGuest;

      if (this.currentUserId !== uid) {
        this.currentUserId = uid;
        this.onUserContextChanged(uid, isGuest);
      }
    });
  }

  private async onUserContextChanged(uid: string, isGuest: boolean) {
    if (this.firestoreUnsubscribe) {
      this.firestoreUnsubscribe();
      this.firestoreUnsubscribe = null;
    }

    // Always clear memory activities when user context changes
    this.actividades.set([]);
    this.alarmas.set({});

    if (!isGuest) {
      // 1. Authenticated user: Load local cache for this specific UID
      await this.cargarDatosUsuario(uid);
      // 2. Real-time Firestore sync
      this.subscribirFirestore(uid);
    } else {
      // Guest user: Load guest local cache
      await this.cargarDatosUsuario('guest');
    }
  }

  private async cargarDatosUsuario(uid: string) {
    try {
      const actKey = this.STORAGE_ACTIVITIES_PREFIX + uid;
      const almKey = this.STORAGE_ALARMAS_PREFIX + uid;
      const { value: actStr } = await Preferences.get({ key: actKey });
      const { value: almStr } = await Preferences.get({ key: almKey });

      if (actStr) {
        const parsedActs: Actividad[] = JSON.parse(actStr);
        // Exclude any legacy mock data
        const filtered = parsedActs.filter(a => a.id_usuario !== 'seed_user');
        this.actividades.set(filtered);
      } else {
        this.actividades.set([]);
      }

      if (almStr) {
        this.alarmas.set(JSON.parse(almStr));
      } else {
        this.alarmas.set({});
      }
    } catch (e) {
      console.warn('Error loading user activities:', e);
      this.actividades.set([]);
      this.alarmas.set({});
    }
  }

  private subscribirFirestore(uid: string) {
    if (!db) return;
    try {
      const q = query(collection(db, 'actividades'), where('id_usuario', '==', uid));
      this.firestoreUnsubscribe = onSnapshot(q, (snapshot) => {
        const acts: Actividad[] = [];
        snapshot.forEach((docSnap) => {
          acts.push(docSnap.data() as Actividad);
        });
        acts.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
        this.actividades.set(acts);
        this.persistirLocal(uid);
      }, (err) => {
        console.warn('Firestore snapshot listener note (offline or permissions):', err);
      });
    } catch (e) {
      console.warn('Error setting up firestore listener:', e);
    }
  }

  private async persistirLocal(uid?: string) {
    const targetUid = uid || this.currentUserId || 'guest';
    try {
      await Preferences.set({
        key: this.STORAGE_ACTIVITIES_PREFIX + targetUid,
        value: JSON.stringify(this.actividades())
      });
      await Preferences.set({
        key: this.STORAGE_ALARMAS_PREFIX + targetUid,
        value: JSON.stringify(this.alarmas())
      });
    } catch (e) {
      console.warn('Error saving to preferences:', e);
    }
  }

  async toggleCompletado(id: string) {
    const uid = this.currentUserId || 'guest';
    let updatedAct: Actividad | null = null;
    this.actividades.update((list) =>
      list.map((act) => {
        if (act.id === id) {
          updatedAct = { ...act, completado: !act.completado };
          return updatedAct;
        }
        return act;
      })
    );
    await this.persistirLocal(uid);

    if (db && updatedAct && !this.auth.currentUser()?.isOfflineGuest) {
      setDoc(doc(db, 'actividades', id), updatedAct).catch(e => console.warn('Firestore update note:', e));
    }
  }

  async agregarActividad(actividad: Omit<Actividad, 'id' | 'creado'>, alarma?: Alarma): Promise<string> {
    const actId = 'act_' + Date.now();
    const uid = this.currentUserId || 'guest';
    let alarmaId = actividad.alarma_id;

    if (alarma) {
      alarmaId = 'alarm_' + Date.now();
      alarma.id = alarmaId;
      this.alarmas.update((map) => ({ ...map, [alarmaId]: alarma }));
      await this.notifications.scheduleActivityAlarm(
        { ...actividad, id: actId, alarma_id: alarmaId, creado: new Date().toISOString() },
        alarma
      );

      if (db && !this.auth.currentUser()?.isOfflineGuest) {
        setDoc(doc(db, 'alarmas', alarmaId), alarma).catch(e => console.warn('Firestore alarm write note:', e));
      }
    }

    const nuevaActividad: Actividad = {
      ...actividad,
      id: actId,
      id_usuario: uid,
      alarma_id: alarmaId,
      creado: new Date().toISOString()
    };

    this.actividades.update((list) => [nuevaActividad, ...list]);
    await this.persistirLocal(uid);

    if (db && !this.auth.currentUser()?.isOfflineGuest) {
      setDoc(doc(db, 'actividades', actId), nuevaActividad).catch(e => console.warn('Firestore activity write note:', e));
    }

    return actId;
  }

  async actualizarActividad(actividad: Actividad, alarma?: Alarma) {
    const uid = this.currentUserId || 'guest';
    if (alarma && actividad.alarma_id) {
      this.alarmas.update((map) => ({ ...map, [actividad.alarma_id]: alarma }));
      await this.notifications.scheduleActivityAlarm(actividad, alarma);

      if (db && !this.auth.currentUser()?.isOfflineGuest) {
        setDoc(doc(db, 'alarmas', actividad.alarma_id), alarma).catch(e => console.warn('Firestore alarm update note:', e));
      }
    }

    this.actividades.update((list) =>
      list.map((item) => (item.id === actividad.id ? actividad : item))
    );
    await this.persistirLocal(uid);

    if (db && actividad.id && !this.auth.currentUser()?.isOfflineGuest) {
      setDoc(doc(db, 'actividades', actividad.id), actividad).catch(e => console.warn('Firestore activity update note:', e));
    }
  }

  async guardarAlarmasActividad(actividad: Actividad, alarmas: Alarma[]): Promise<Actividad> {
    const uid = this.currentUserId || 'guest';
    const alarmasIds = alarmas.map(a => a.id);

    // Cancel old alarms not present in the new set
    const oldIds = actividad.alarmas_ids || (actividad.alarma_id ? [actividad.alarma_id] : []);
    for (const oldId of oldIds) {
      if (!alarmasIds.includes(oldId)) {
        await this.notifications.cancelAlarm(actividad.id || '', oldId);
      }
    }

    // Update alarms state
    this.alarmas.update(map => {
      const updated = { ...map };
      for (const al of alarmas) {
        updated[al.id] = al;
      }
      return updated;
    });

    // Schedule notifications
    for (const al of alarmas) {
      if (al.notificacion_push) {
        await this.notifications.scheduleActivityAlarm(actividad, al);
      } else {
        await this.notifications.cancelAlarm(actividad.id || '', al.id);
      }

      if (db && !this.auth.currentUser()?.isOfflineGuest) {
        setDoc(doc(db, 'alarmas', al.id), al).catch(e => console.warn('Firestore alarm write note:', e));
      }
    }

    // Primary alarm time calculation
    const primary = alarmas[0];
    let horaAlarma = '';
    if (primary) {
      const [h, m] = actividad.hora_inicio.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m - primary.tiempo_anticipacion, 0);
      const rh = String(d.getHours()).padStart(2, '0');
      const rm = String(d.getMinutes()).padStart(2, '0');
      horaAlarma = `${rh}:${rm}`;
    }

    const updatedAct: Actividad = {
      ...actividad,
      alarma_id: primary ? primary.id : '',
      alarmas_ids: alarmasIds,
      hora_alarma: horaAlarma
    };

    await this.actualizarActividad(updatedAct);
    return updatedAct;
  }

  async eliminarActividad(id: string) {
    const uid = this.currentUserId || 'guest';
    const act = this.actividades().find((a) => a.id === id);
    if (act) {
      const allAlarmIds = act.alarmas_ids || (act.alarma_id ? [act.alarma_id] : []);
      for (const almId of allAlarmIds) {
        await this.notifications.cancelAlarm(act.id || '', almId);
      }
    }
    this.actividades.update((list) => list.filter((item) => item.id !== id));
    await this.persistirLocal(uid);

    if (db && !this.auth.currentUser()?.isOfflineGuest) {
      deleteDoc(doc(db, 'actividades', id)).catch(e => console.warn('Firestore delete note:', e));
    }
  }

  async toggleAlarma(actividadId: string) {
    const uid = this.currentUserId || 'guest';
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
      await this.persistirLocal(uid);

      if (db && !this.auth.currentUser()?.isOfflineGuest) {
        setDoc(doc(db, 'alarmas', act.alarma_id), nuevaAlarma).catch(e => console.warn('Firestore alarm toggle note:', e));
      }
    }
  }

  getAlarmaById(alarmaId: string): Alarma | undefined {
    return this.alarmas()[alarmaId];
  }
}
