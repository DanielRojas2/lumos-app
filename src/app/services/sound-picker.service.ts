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

  private readonly STORAGE_TONES_KEY = 'lumos_saved_custom_tones';

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
    { id: 'precision_kinetica', name: 'Precisión Cinética', uri: 'default_kinetic', isCustom: false }
  ]);

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioElement = new Audio();
      this.audioElement.onended = () => {
        this.isPlaying.set(false);
      };
      this.loadSavedTones();
    }
  }

  private async loadSavedTones() {
    try {
      const { value } = await Preferences.get({ key: this.STORAGE_TONES_KEY });
      if (value) {
        const customTones: SoundTone[] = JSON.parse(value);
        if (customTones && customTones.length > 0) {
          this.availableTones.update(existing => {
            const ids = new Set(existing.map(t => t.id));
            const newTones = customTones.filter(t => !ids.has(t.id));
            return [...existing, ...newTones];
          });
        }
      }
    } catch (e) {
      console.warn('Error loading custom saved tones:', e);
    }
  }

  async saveCustomTone(tone: SoundTone) {
    try {
      this.availableTones.update(list => {
        const filtered = list.filter(t => t.id !== tone.id && t.uri !== tone.uri);
        return [...filtered, tone];
      });

      const customs = this.availableTones().filter(t => t.isCustom);
      await Preferences.set({
        key: this.STORAGE_TONES_KEY,
        value: JSON.stringify(customs)
      });
    } catch (e) {
      console.warn('Error saving custom tone to storage:', e);
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

          // Prefer data URI (Base64) so it permanently persists across sessions
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
          this.currentTone.set(customTone);

          // Audio preview
          setTimeout(() => {
            this.playTone(customTone.uri, 85);
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
                this.currentTone.set(customTone);

                setTimeout(() => {
                  this.playTone(customTone.uri, 85);
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

  selectTone(tone: SoundTone) {
    this.stopPreview();
    this.currentTone.set(tone);
  }

  resolveToneName(uri: string, fallbackName?: string): string {
    if (fallbackName) return fallbackName;
    if (!uri || uri === 'default_radar_suave') return 'Radar Suave (Predeterminado)';
    if (uri === 'default_pulsar') return 'Pulsar Celestial';
    if (uri === 'default_kinetic') return 'Precisión Cinética';

    const match = this.availableTones().find(t => t.uri === uri);
    if (match) return match.name;

    if (uri.startsWith('data:') || uri.startsWith('file:') || uri.includes('/') || uri.includes('\\')) {
      return 'Archivo multimedia (.mp3 / audio)';
    }
    return uri;
  }

  async playTone(uri: string, volumePercent: number = 85) {
    if (this.isPlaying()) {
      this.stopPreview();
      return;
    }

    const volume = Math.max(0, Math.min(1, volumePercent / 100));

    // If it's a data URI, blob or web URL:
    if (uri && (uri.startsWith('data:') || uri.startsWith('http') || uri.startsWith('blob:') || uri.endsWith('.mp3') || uri.endsWith('.wav'))) {
      try {
        if (!this.audioElement) {
          this.audioElement = new Audio();
        }

        let audioSrc = uri;
        if (Capacitor.isNativePlatform() && !audioSrc.startsWith('data:') && !audioSrc.startsWith('http') && !audioSrc.startsWith('blob:')) {
          audioSrc = Capacitor.convertFileSrc(audioSrc);
        }

        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        this.audioElement.src = audioSrc;
        this.audioElement.volume = volume;

        this.audioElement.onended = () => {
          this.isPlaying.set(false);
        };

        this.audioElement.onerror = (e) => {
          console.warn('Audio playback error, falling back to synthesized tone:', e);
          this.isPlaying.set(false);
          this.playSynthesizedTone('radar_suave', volume);
        };

        await this.audioElement.play();
        this.isPlaying.set(true);
        return;
      } catch (e) {
        console.warn('Custom audio playback exception:', e);
        this.isPlaying.set(false);
      }
    }

    // Melodic Web Audio Synth fallback or preset
    const toneId = uri.replace('default_', '');
    this.playSynthesizedTone(toneId, volume);
  }

  async playPreview(volumePercent: number = 85) {
    const cur = this.currentTone();
    await this.playTone(cur.uri, volumePercent);
  }

  stopPreview() {
    if (this.audioElement) {
      try {
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

  private playSynthesizedTone(toneId: string, volume: number) {
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
      this.isSynthesizing = true;
      this.isPlaying.set(true);

      const notes = toneId === 'pulsar' || toneId === 'pulsar_celestial'
        ? [523.25, 659.25, 783.99, 1046.50]
        : [440, 554.37, 659.25, 880];

      notes.forEach((freq, idx) => {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + idx * 0.18);

        gain.gain.setValueAtTime(0, this.audioCtx.currentTime + idx * 0.18);
        gain.gain.linearRampToValueAtTime(volume * 0.3, this.audioCtx.currentTime + idx * 0.18 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + idx * 0.18 + 0.5);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(this.audioCtx.currentTime + idx * 0.18);
        osc.stop(this.audioCtx.currentTime + idx * 0.18 + 0.6);
      });

      setTimeout(() => {
        this.isPlaying.set(false);
        this.isSynthesizing = false;
      }, 1200);
    } catch {
      this.isPlaying.set(false);
    }
  }
}
