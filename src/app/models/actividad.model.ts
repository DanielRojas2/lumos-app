export type CategoriaActividad = 'trabajo' | 'clases' | 'tareas' | 'personal';

export interface Actividad {
  id?: string;                         // ID del documento (Firestore o UUID local)
  id_usuario: string;                  // UID de Firebase Auth o UUID offline guest
  titulo: string;                      // Título descriptivo de la actividad
  categoria: CategoriaActividad;       // Clasificación funcional
  ubicacion: string;                   // Dirección física o enlace virtual (ej. Google Meet, Aula 302)
  fecha_actividad: string;             // Formato YYYY-MM-DD
  hora_inicio: string;                 // Formato militar HH:mm
  hora_fin: string;                    // Formato militar HH:mm
  hora_alarma: string;                 // Timestamp o HH:mm calculada con tiempo_anticipacion
  alarma_id: string;                   // Referencia al ID del modelo Alarma asociado
  notas: string;                       // Anotaciones adicionales
  completado: boolean;                 // Estado de completitud
  creado: string;                      // ISO 8601 string de auditoría de creación
  sincronizado?: boolean;              // Flag para sincronización pendiente al estar offline
}
