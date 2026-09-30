# AGENTS.md - Sistema Integral de Agenda y Alarmas (Lumos)

Guía maestra de especificación, arquitectura y plan de ejecución por fases para el desarrollo autónomo y asistido por agentes.

## 1. Visión del Proyecto y Stack Tecnológico

**Lumos** es una aplicación móvil y web de alto rendimiento para la gestión personal de actividades y alarmas precisas, diseñada bajo los principios de *Kinetic Precision* (Geist con `tabular-nums`, bordes de 1px y acento en `#FF3300`) junto con una identidad mística y celestial dorada (`#FFD54F` / `#F59E0B` sobre fondo cósmico oscuro `#0A0F1D`) en su experiencia de bienvenida y marca.

### Naming, Identidad y Soporte Multilenguaje (i18n)

La aplicación cuenta con soporte nativo reactivo para Español (`es`) e Inglés (`en`), modificando títulos, subtítulos, textos de interfaz y metadatos:

* **Español (`es`):**
  * Título: `Lumos`
  * Subtítulo / Slogan: `Organiza, Enfoca, Avanza.`
* **Inglés (`en`):**
  * Título: `Lumos`
  * Subtítulo / Slogan: `Illuminate your day.`

### Estrategia de Autenticación Híbrida (Conectado / Desconectado)

Para solventar la necesidad de funcionamiento pleno con y sin conexión a internet:
1. **Modo Con Conexión (OAuth2 Google / Gmail):**
   * Autenticación federada mediante Google Sign-In (`@codetrix-studio/capacitor-google-auth` para Android nativo y Firebase Auth `GoogleAuthProvider` para Web).
   * Al iniciar sesión con Google, las actividades y alarmas se sincronizan con Cloud Firestore bajo el `id_usuario` (`uid`).
2. **Modo Sin Conexión (Offline-First & Transición Fluida):**
   * **Persistencia Local de Sesión:** Si el usuario ya inició sesión con Google previamente, Firebase Auth y Firestore persisten el token y los datos localmente en caché indexada / SQLite interna. La app abre directamente en modo offline usando los datos cacheados y encola escrituras pendientes.
   * **Modo Invitado / Offline Local:** Si el usuario entra por primera vez sin conexión (o decide no vincular su cuenta aún), se inicializa una identidad local con UUID generado en almacenamiento seguro local (`Preferences` de Capacitor). Todas las actividades y configuraciones se operan transparentemente en almacenamiento local o Firestore offline cache.
   * **Sincronización y Fusión (Link/Merge):** Al recuperar la conexión o cuando el usuario pulsa "Vincular con Google", el servicio migra/sincroniza las actividades creadas localmente bajo el nuevo UID autenticado de Google sin duplicados.
   * **Detección Automática de Conectividad:** Integración de `@capacitor/network` y `navigator.onLine` para exponer un Signal reactivo `isOnline` en Angular.

### Stack Técnico Mandatorio

* **Frontend Framework:** Angular v22 (Standalone Components, Signals reactivos, Control Flow `@if`/`@for`, `inject()`, Reactive Forms).
* **Internacionalización:** Servicio reactivo propio con Angular Signals (`I18nService`) con persistencia del idioma seleccionado.
* **Estilos y Animaciones:** Tailwind CSS v4 con CSS Keyframes personalizados para destellos celestiales, trazos orbitales SVG y brillo cinemático (*glow*).
* **Runtime Móvil:** Capacitor (Android nativo).
* **Plugins Nativos de Capacitor:**
  * `@codetrix-studio/capacitor-google-auth`: Flujo nativo de OAuth2 con Google en Android.
  * `@capacitor/network`: Monitorización en tiempo real del estado de red.
  * `@capacitor/preferences`: Almacenamiento seguro clave-valor para sesiones y modo local offline.
  * `@capacitor/local-notifications`: Programación exacta de alertas y notificaciones locales (funcionan 100% offline).
  * `@capawesome/capacitor-file-picker` o `@capacitor/filesystem`: Selección y persistencia de referencias a archivos multimedia `.mp4` / audio locales.
  * `@capacitor/haptics`: Vibración háptica configurada según el modelo de alarma.
  * `@capacitor/splash-screen`: Control programático para ocultar el splash nativo tras montar la animación personalizada.
* **BaaS & Datos:** Firebase (Cloud Firestore con `persistentMultipleTabManager` habilitado y Firebase Authentication con soporte Google OAuth2).

---

## 2. Experiencia de Entrada: Animación de Apertura (Splash "Lumos")

Basada en la identidad de luz estelar y anillo orbital dorado, la aplicación ejecuta una animación de entrada secuenciada al inicializar (duración total aproximada: 2.8s - 3.2s) antes de transicionar a la pantalla principal.

### Secuencia Cinemática en 4 Fases

1. **Fase 1: Inicio (Chispa y Órbita):**
   * Lienzo en azul oscuro profundo / noche cósmica (`#080C16`).
   * Emerge una micro-estrella de cuatro puntas en el centro con pulso de luz cálida (`#FFE082`).
   * Una estela orbital circular concéntrica de 1px se traza con un punto satelital brillante girando en sentido horario.
2. **Fase 2: Logo (Expansión Estelar):**
   * La chispa central se expande mediante escalado y `drop-shadow` dorado hasta formar la estrella de 4 puntas de Lumos con bisel luminoso tridimensional.
   * El anillo exterior se completa y estabiliza su brillo dorado envolvente.
3. **Fase 3: Nombre (Aparición de Marca):**
   * El texto **LUMOS** emerge por debajo del isotipo con `fade-in`, desenfoque inverso (`blur(8px)` a `blur(0)`) y tracking extendido (`letter-spacing: 0.25em`).
   * Tipografía limpia y moderna en blanco cálido (`#F8FAFC`).
4. **Fase 4: Subtítulo y Transición:**
   * Una línea horizontal dorada tenue se expande sutilmente bajo "LUMOS".
   * Aparece el subtítulo según el idioma activo:
     * En Español: `Organiza, Enfoca, Avanza.`
     * En Inglés: `Illuminate your day.`
   * Transición fluida (`fade-out` suave de 400ms) que da paso a la vista `Hoy` del usuario.

### Especificación del Ícono de la App (Android Asset)

* **Fondo:** Cuadrado redondeado (`squircle`) en gradiente azul noche profundo (`#0D1527` a `#070B14`).
* **Isotipo:** Estrella de 4 puntas dorada central intersectada por el anillo orbital delgado con relieve lumínico.
* **Generación:** Exportación multirresolución para Android (`res/mipmap-*` / `ic_launcher` adaptativo).

---

## 3. Contratos de Datos y Modelos TypeScript

### Modelo de Sesión y Usuario (`src/app/models/user.model.ts`)
```typescript
export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isOfflineGuest: boolean;
  lastLogin: string;
}
```

### Modelo de Alarma (`src/app/models/alarma.model.ts`)
```typescript
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
```

### Modelo de Actividad (`src/app/models/actividad.model.ts`)
```typescript
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
```

---

## 4. Arquitectura de Pantallas y Mapeo con Mockups

### 1. `src/app/pages/hoy/` (Ventana 1 - "Tu Ritmo Diario / Your Daily Rhythm")
* **Encabezado:** Marca **Lumos**, badge "HOY" / "TODAY", avatar de usuario (foto de Google o avatar local con indicador de modo offline si no hay red), selector rápido de idioma (`ES` | `EN`), fecha técnica y barra de progreso (`67% completado`).
* **Banner de Conexión:** Chip discreto indicador si se está operando en `Modo Sin Conexión` con opción de "Iniciar Sesión con Google" cuando se detecte red.
* **Selector Semanal Desplazable:** Carrusel de días con selección activa en fondo negro `#000000` y acento circular `#FF3300`.
* **Filtros por Categoría:** Chips (`Todos`, `Trabajo`, `Clases`, `Tareas`, `Personal`).
* **Lista de Actividades:** Tarjetas con borde `1px solid #C4C4C4`, tarjeta en curso destacada con franja de `3px solid #FF3300` y badge `AHORA` / `NOW`.
* **Acción Inferior:** Botón negro con cruz naranja: `+ Añadir Nueva Actividad`.
* **Barra de Navegación:** Pestañas: `Hoy`, `Crear`, `Alarmas`, `Resumen`.

### 2. `src/app/pages/crear-actividad/` (Ventana 2 - "Nueva Actividad")
* **Encabezado:** Subtítulo `PROGRAMACIÓN DIARIA`, título `Nueva Actividad` y botón de reset.
* **Formulario Reactivo:** Título, selector pill de categoría (naranja `#FF3300` activo), fecha y rango horario, ubicaciones predefinidas (`Oficina`, `En línea`, `Universidad`, `Casa`), switch maestro de Alarma y textarea con contador de caracteres.
* **Persistencia Inmediata:** Funciona de inmediato tanto online como offline.

### 3. `src/app/pages/configurar-alarma/` (Ventana 3 - "Personalización de Alarma")
* **Resumen Superior:** Badge de categoría, horario e icono de campana.
* **Selector de Anticipación:** Chips de minutos (`En el momento` a `1 día antes`).
* **Tono y Volumen:**
  * Selector de archivo multimedia local (`.mp4` / audio) con botón `Cambiar` conectado al selector nativo de Android.
  * Botón de reproducción de prueba del sonido del `.mp4` (reproducción local offline).
  * Slider de volumen naranja y toggle de vibración háptica.
* **Insistencia y Frecuencia:** Modo insistente (cada 5 min) y selectores de frecuencia.
* **Canales y Simulación:** Toggles de notificación y card oscura de simulación en vivo del banner nativo.

### 4. `src/app/pages/resumen/` (Ventana 4 - "Resumen Semanal")
* **Segmented Control:** `Semana` | `Mes` y navegador paginado (`14 — 20 Oct`).
* **Métrica de Distribución:** Acumulado de horas, badge meta (`82% meta`) y barra segmentada multicolor.
* **Próximas con Alarma:** Contador de alarmas y lista cronológica con switch toggle directo para pausar/activar alarmas en local y en la nube.

---

## 5. Fases de Ejecución

### Fase 1: Inicialización, Tokens de Diseño y Capacitor Android
1. Inicializar Angular v22 Standalone con enrutamiento y Tailwind CSS.
2. Instalar Capacitor y plugins necesarios:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/local-notifications @capacitor/haptics @capacitor/network @capacitor/preferences @codetrix-studio/capacitor-google-auth @capawesome/capacitor-file-picker @capacitor/splash-screen
   npx cap init Lumos com.lumos.agenda --web-dir dist/lumos-agenda/browser
   npm install @capacitor/android
   npx cap add android
   ```
3. Configurar en `android/app/src/main/AndroidManifest.xml`:
   * Permisos de red (`ACCESS_NETWORK_STATE`, `INTERNET`).
   * Permisos de alarma (`SCHEDULE_EXACT_ALARM`, `USE_EXACT_ALARM`, `POST_NOTIFICATIONS`, `VIBRATE`).
   * Google Auth meta-data (`com.google.android.gms.auth.api.signin`).

### Fase 2: Módulo de Internacionalización (i18n) y Splash "Lumos"
1. Implementar `I18nService` con persistencia en `@capacitor/preferences` y Signals de título/slogan (`"Lumos - Organiza, Enfoca, Avanza."` / `"Lumos - Illuminate your day."`).
2. Implementar `src/app/components/splash-intro/splash-intro.component.ts` con animación cinemática celestial de 4 etapas.

### Fase 3: Autenticación OAuth2 (Google) y Motor Offline-First
1. **Configuración de Persistencia de Firestore:**
   Habilitar `initializeFirestore` con `persistentLocalCache` y `persistentMultipleTabManager` en Angular para asegurar lectura/escritura offline transparente en el dispositivo.
2. **Implementar `AuthService` (`src/app/services/auth.service.ts`):**
   * Signal reactivo `currentUser` (`AppUser | null`).
   * Signal reactivo `isOnline` conectado a `@capacitor/network`.
   * Método `loginWithGoogle()`: ejecuta OAuth2 con Google nativo en Android y `signInWithCredential` en Firebase Auth.
   * Método `initGuestSession()`: crea o restaura UID anónimo/offline en `Preferences` para permitir uso inmediato sin internet.
   * Método `syncOfflineActivities()`: transfiere actividades del modo invitado al UID autenticado de Google cuando se inicia sesión con red.
3. **Reglas de Seguridad Firestore (`firestore.rules`):**
   Permitir acceso a actividades solo al propietario del UID autenticado.

### Fase 4: Motor de Alarmas y Selector Multimedia (.mp4)
1. Implementar `SoundPickerService`: selección nativa de `.mp4` y persistencia de URIs locales.
2. Implementar `NotificationService`: programación local con `@capacitor/local-notifications` (operativo sin conexión).

### Fase 5: Componentes UI Reutilizables (`src/app/components/`)
* `bottom-nav/`, `category-chip/`, `week-strip/`, `activity-card/`, `time-distribution-bar/`, `lang-toggle/`, `offline-badge/`.

### Fase 6: Vistas Principales y Enrutamiento (`src/app/pages/`)
* Conectar las 4 vistas con `ActividadService` y `AuthService`.
* Garantizar que la creación y edición de actividades funcione sin conexión mediante la caché offline y sincronización en segundo plano.

### Fase 7: Automatización Headless de Compilación APK (GitHub Actions)
* Workflow en `.github/workflows/compilar-apk.yml` compilando con JDK 17, Node.js 22 y exportando el artefacto `lumos-agenda-debug.apk`.

---

## 6. Criterios de Aceptación y Pruebas del Agente
- [ ] La app inicia sin red en modo local sin bloquear al usuario ni mostrar errores de autenticación.
- [ ] El usuario puede iniciar sesión con OAuth2 de Google tanto en Web como en Android.
- [ ] Las actividades creadas sin conexión persisten y se sincronizan con la nube al recuperar conectividad o autenticarse con Google.
- [ ] Las notificaciones locales y alarmas programadas con archivos `.mp4` suenan a la hora exacta incluso sin conexión a internet.
- [ ] La interfaz refleja fielmente la combinación entre la temática dorada/mística de Lumos en el inicio y el diseño riguroso *Kinetic Precision* en los tableros diarios.