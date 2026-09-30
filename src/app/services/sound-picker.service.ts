import { Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { FilePicker } from '@capawesome/capacitor-file-picker';

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

          // Prefer data URI (Base64) for 100% reliable WebView playback without filesystem permission issues
          if (file.data) {
            const mime = file.mimeType || 'audio/mpeg';
            audioUri = `data:${mime};base64,${file.data}`;
          } else if (file.webPath) {
            audioUri = file.webPath;
          } else if (file.path) {
            audioUri = Capacitor.convertFileSrc(file.path);
          }

          const customTone: SoundTone = {
            id: 'custom_' + Date.now(),
            name: file.name || 'Alarma Personalizada (.mp3)',
            uri: audioUri,
            isCustom: true
          };
          this.currentTone.set(customTone);

          // Inmediata previsualización auditiva para el usuario
          setTimeout(() => {
            this.playPreview();
          }, 200);

          return customTone;
        }
      } else {
        // Fallback for browser environment
        return new Promise((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'audio/*,audio/mp3,audio/mpeg,video/mp4,.mp3,.wav,.ogg,.m4a,.mp4';
          input.onchange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            if (target.files && target.files.length > 0) {
              const file = target.files[0];
              const url = URL.createObjectURL(file);
              const customTone: SoundTone = {
                id: 'custom_' + Date.now(),
                name: file.name || 'Alarma Personalizada (.mp3)',
                uri: url,
                isCustom: true
              };
              this.currentTone.set(customTone);
              setTimeout(() => {
                this.playPreview();
              }, 150);
              resolve(customTone);
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

  async playPreview(volumePercent: number = 85) {
    if (this.isPlaying()) {
      this.stopPreview();
      return;
    }

    const volume = Math.max(0, Math.min(1, volumePercent / 100));
    const tone = this.currentTone();

    if (tone.isCustom && tone.uri) {
      try {
        if (!this.audioElement) {
          this.audioElement = new Audio();
        }

        let audioSrc = tone.uri;
        // If native absolute file path without scheme, convert with Capacitor
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
          console.warn('HTMLAudioElement playback error, falling back to melodic synthesizer:', e);
          this.isPlaying.set(false);
          this.playSynthesizedTone(tone.id, volume);
        };

        await this.audioElement.play();
        this.isPlaying.set(true);
        return;
      } catch (e) {
        console.warn('Custom audio play exception, falling back to synthesizer:', e);
        this.isPlaying.set(false);
      }
    }

    // Melodic Web Audio Synth for preset Lumos alarm sounds
    this.playSynthesizedTone(tone.id, volume);
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

      const notes = toneId === 'pulsar_celestial' 
        ? [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6 (Celestial Chord)
        : [440, 554.37, 659.25, 880];      // A4, C#5, E5, A5 (Radar Suave)

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

      // Stop after sequence
      setTimeout(() => {
        this.isPlaying.set(false);
        this.isSynthesizing = false;
      }, 1200);
    } catch {
      this.isPlaying.set(false);
    }
  }
}
