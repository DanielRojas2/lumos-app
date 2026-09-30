import { Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { Preferences } from '@capacitor/preferences';

export interface SoundTone {
  id: string;
  name: string;
  uri: string;
  isCustom: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SoundPickerService {
  private audioElement: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private isSynthesizing = false;
  private alarmLoopTimer: any = null;

  private readonly STORAGE_TONES_KEY = 'lumos_saved_custom_tones';
  private readonly STORAGE_SELECTED_TONE_KEY = 'lumos_saved_selected_tone';

  readonly isPlaying = signal<boolean>(false);
  readonly currentTone = signal<SoundTone>({
    id: 'radar_suave',
    name: 'Radar Suave (Lumos)',
    uri: 'default_radar_suave',
    isCustom: false
  });

  readonly availableTones = signal<SoundTone[]>([
    { id: 'radar_suave', name: 'Radar Suave (Lumos)', uri: 'default_radar_suave', isCustom: false },
    { id: 'pulsar_celestial', name: 'Pulsar Celestial', uri: 'default_pulsar', isCustom: false },
    { id: 'precision_kinetica', name: 'Precisión Cinética (Alarma)', uri: 'default_kinetic', isCustom: false }
  ]);

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioElement = new Audio();
      this.audioElement.onended = () => {
        if (!this.audioElement?.loop) {
          this.isPlaying.set(false);
        }
      };
      this.loadSavedTones();
    }
  }

  private async loadSavedTones() {
    try {
      // 1. Load custom tones
      const { value: customStr } = await Preferences.get({ key: this.STORAGE_TONES_KEY });
      if (customStr) {
        const customTones: SoundTone[] = JSON.parse(customStr);
        if (customTones && customTones.length > 0) {
          this.availableTones.update((existing) => {
            const ids = new Set(existing.map((t) => t.id));
            const newTones = customTones.filter((t) => !ids.has(t.id));
            return [...existing, ...newTones];
          });
        }
      }

      // 2. Load user's persisted preferred tone
      const { value: selectedStr } = await Preferences.get({ key: this.STORAGE_SELECTED_TONE_KEY });
      if (selectedStr) {
        const savedTone: SoundTone = JSON.parse(selectedStr);
        if (savedTone && savedTone.uri) {
          this.currentTone.set(savedTone);
          // Ensure it exists in availableTones
          this.availableTones.update((list) => {
            if (!list.some((t) => t.uri === savedTone.uri)) {
              return [...list, savedTone];
            }
            return list;
          });
        }
      }
    } catch (e) {
      console.warn('Error loading custom saved tones:', e);
    }
  }

  async saveCustomTone(tone: SoundTone) {
    try {
      this.availableTones.update((list) => {
        const filtered = list.filter((t) => t.id !== tone.id && t.uri !== tone.uri);
        return [...filtered, tone];
      });

      const customs = this.availableTones().filter((t) => t.isCustom);
      await Preferences.set({
        key: this.STORAGE_TONES_KEY,
        value: JSON.stringify(customs)
      });

      // Also set and persist as current tone
      await this.selectTone(tone);
    } catch (e) {
      console.warn('Error saving custom tone to storage:', e);
    }
  }

  async selectTone(tone: SoundTone) {
    this.stopPreview();
    this.currentTone.set(tone);
    try {
      await Preferences.set({
        key: this.STORAGE_SELECTED_TONE_KEY,
        value: JSON.stringify(tone)
      });
    } catch (e) {
      console.warn('Error saving selected tone:', e);
    }
  }

  async pickLocalFile(): Promise<SoundTone | null> {
    try {
      this.stopPreview();

      if (Capacitor.isNativePlatform()) {
        const result = await FilePicker.pickFiles({
          types: ['audio/*', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'video/mp4'],
          readData: true,
          limit: 1
        });

        if (result.files && result.files.length > 0) {
          const file = result.files[0];
          let audioUri = '';

          // Prefer data URI (Base64) or permanent converted file URL
          if (file.data) {
            const mime = file.mimeType || 'audio/mpeg';
            audioUri = `data:${mime};base64,${file.data}`;
          } else if (file.path) {
            audioUri = Capacitor.convertFileSrc(file.path);
          } else if (file.webPath) {
            audioUri = file.webPath;
          }

          const customTone: SoundTone = {
            id: 'custom_' + Date.now(),
            name: file.name || 'Alarma Personalizada (.mp3)',
            uri: audioUri,
            isCustom: true
          };

          await this.saveCustomTone(customTone);

          // Audio preview
          setTimeout(() => {
            this.playTone(customTone.uri, 85, false);
          }, 150);

          return customTone;
        }
      } else {
        // Laptop / Web Browser: read as permanent Data URL (Base64)
        return new Promise((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'audio/*,audio/mp3,audio/mpeg,video/mp4,.mp3,.wav,.ogg,.m4a,.mp4';
          input.onchange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            if (target.files && target.files.length > 0) {
              const file = target.files[0];
              const reader = new FileReader();

              reader.onload = async () => {
                const dataUrl = reader.result as string;
                const customTone: SoundTone = {
                  id: 'custom_' + Date.now(),
                  name: file.name || 'Alarma Personalizada (.mp3)',
                  uri: dataUrl,
                  isCustom: true
                };

                await this.saveCustomTone(customTone);

                setTimeout(() => {
                  this.playTone(customTone.uri, 85, false);
                }, 150);

                resolve(customTone);
              };

              reader.onerror = () => {
                console.warn('FileReader error');
                resolve(null);
              };

              reader.readAsDataURL(file);
            } else {
              resolve(null);
            }
          };
          input.click();
        });
      }
    } catch (err) {
      console.warn('FilePicker error or cancelled:', err);
    }
    return null;
  }

  resolveToneName(uri: string, fallbackName?: string): string {
    if (fallbackName && fallbackName.trim() !== '') return fallbackName;
    if (!uri || uri === 'default_radar_suave') return 'Radar Suave (Lumos)';
    if (uri === 'default_pulsar') return 'Pulsar Celestial';
    if (uri === 'default_kinetic') return 'Precisión Cinética (Alarma)';

    const match = this.availableTones().find((t) => t.uri === uri || t.id === uri);
    if (match) return match.name;

    if (uri.startsWith('data:') || uri.startsWith('file:') || uri.includes('/') || uri.includes('\\')) {
      return 'Archivo multimedia (.mp3 / audio)';
    }
    return uri;
  }

  getNativeSoundFileName(uri: string): string {
    if (!uri || uri === 'default_radar_suave' || uri === 'radar_suave') return 'radar_suave.wav';
    if (uri === 'default_pulsar' || uri === 'pulsar_celestial') return 'pulsar_celestial.wav';
    if (uri === 'default_kinetic' || uri === 'precision_kinetica') return 'alarm_sound.wav';
    if (uri.endsWith('.wav') || uri.endsWith('.mp3')) {
      const parts = uri.split('/');
      return parts[parts.length - 1];
    }
    return 'radar_suave.wav';
  }

  async playTone(uri: string, volumePercent: number = 85, isAlarmLoop: boolean = false) {
    if (this.isPlaying()) {
      this.stopPreview();
      if (!isAlarmLoop) return;
    }

    const volume = Math.max(0, Math.min(1, volumePercent / 100));

    // Resolve audio source (check preset WAV files from public/tones/ on web)
    let audioSrc = uri;
    if (uri === 'default_radar_suave' || !uri) {
      audioSrc = 'tones/radar_suave.wav';
    } else if (uri === 'default_pulsar') {
      audioSrc = 'tones/pulsar_celestial.wav';
    } else if (uri === 'default_kinetic') {
      audioSrc = 'tones/alarm_sound.wav';
    }

    // Try HTML5 Audio element first (works for data URLs, web URLs, and public tones)
    try {
      if (!this.audioElement) {
        this.audioElement = new Audio();
      }

      if (Capacitor.isNativePlatform() && !audioSrc.startsWith('data:') && !audioSrc.startsWith('http') && !audioSrc.startsWith('blob:') && !audioSrc.startsWith('tones/')) {
        audioSrc = Capacitor.convertFileSrc(audioSrc);
      }

      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.audioElement.src = audioSrc;
      this.audioElement.volume = volume;
      this.audioElement.loop = isAlarmLoop;

      this.audioElement.onended = () => {
        if (!this.audioElement?.loop) {
          this.isPlaying.set(false);
        }
      };

      this.audioElement.onerror = () => {
        // Fallback to Web Audio synthesiser if file load fails
        const toneId = uri.replace('default_', '');
        this.playSynthesizedTone(toneId, volume, isAlarmLoop);
      };

      await this.audioElement.play();
      this.isPlaying.set(true);
      return;
    } catch {
      // Audio playback exception, fallback to synthesizer
      const toneId = uri.replace('default_', '');
      this.playSynthesizedTone(toneId, volume, isAlarmLoop);
    }
  }

  async playPreview(volumePercent: number = 85) {
    const cur = this.currentTone();
    await this.playTone(cur.uri, volumePercent, false);
  }

  stopPreview() {
    if (this.alarmLoopTimer) {
      clearInterval(this.alarmLoopTimer);
      this.alarmLoopTimer = null;
    }
    if (this.audioElement) {
      try {
        this.audioElement.loop = false;
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      } catch {}
    }
    if (this.audioCtx && this.isSynthesizing) {
      try {
        this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
      this.isSynthesizing = false;
    }
    this.isPlaying.set(false);
  }

  private playSynthesizedTone(toneId: string, volume: number, isAlarmLoop: boolean = false) {
    const playBurst = () => {
      try {
        const AudioCtxClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!this.audioCtx || this.audioCtx.state === 'closed') {
          this.audioCtx = new AudioCtxClass();
        }

        this.isSynthesizing = true;
        this.isPlaying.set(true);

        const notes =
          toneId === 'pulsar' || toneId === 'pulsar_celestial'
            ? [523.25, 659.25, 783.99, 1046.5]
            : toneId === 'kinetic' || toneId === 'precision_kinetica'
            ? [880, 880, 880, 1174.66]
            : [587.33, 880.0, 1174.66];

        notes.forEach((freq, idx) => {
          if (!this.audioCtx) return;
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + idx * 0.18);

          gain.gain.setValueAtTime(0, this.audioCtx.currentTime + idx * 0.18);
          gain.gain.linearRampToValueAtTime(volume * 0.35, this.audioCtx.currentTime + idx * 0.18 + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + idx * 0.18 + 0.45);

          osc.connect(gain);
          gain.connect(this.audioCtx.destination);

          osc.start(this.audioCtx.currentTime + idx * 0.18);
          osc.stop(this.audioCtx.currentTime + idx * 0.18 + 0.5);
        });

        if (!isAlarmLoop) {
          setTimeout(() => {
            this.isPlaying.set(false);
            this.isSynthesizing = false;
          }, 1200);
        }
      } catch {
        this.isPlaying.set(false);
      }
    };

    playBurst();

    if (isAlarmLoop) {
      if (this.alarmLoopTimer) clearInterval(this.alarmLoopTimer);
      this.alarmLoopTimer = setInterval(() => {
        playBurst();
      }, 1500);
    }
  }
}
