export interface Alarma {
  id: string;                          // Identificador único de la alarma
  tiempo_anticipacion: number;         // Minutos de anticipación (0 = en el momento, 5, 15, 30, 60, 1440)
  tono: string;                        // Ruta al archivo local (.mp4 / URI nativa) o nombre del tono predeterminado
  volumen: number;                     // 0 a 100
  vibracion: boolean;                  // Activa / desactiva patrón de vibración háptica
  recurrencia: boolean;                // Modo insistente (repetir cada X tiempo si no se descarta)
  frecuencia: 'una_vez' | 'diariamente' | 'dias_habiles' | 'semanalmente';
  notificacion_push: boolean;          // Banner prioritario en el sistema operativo
  pantalla_completa: boolean;          // Despertar pantalla / alerta intrusiva en reposo
  mensaje: string;                     // Mensaje o plantilla para la notificación ("Comienza en X minutos")
}
