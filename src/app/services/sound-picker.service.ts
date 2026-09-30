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
      if (Capacitor.isNativePlatform()) {
        const result = await FilePicker.pickFiles({
          types: ['video/mp4', 'audio/*'],
          readData: false,
          limit: 1
        });

        if (result.files.length > 0) {
          const file = result.files[0];
          const customTone: SoundTone = {
            id: 'custom_' + Date.now(),
            name: file.name || 'Archivo de Alarma (.mp4)',
            uri: file.path || file.webPath || '',
            isCustom: true
          };
          this.currentTone.set(customTone);
          return customTone;
        }
      } else {
        // Fallback for browser environment
        return new Promise((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'video/mp4,audio/*';
          input.onchange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            if (target.files && target.files.length > 0) {
              const file = target.files[0];
              const url = URL.createObjectURL(file);
              const customTone: SoundTone = {
                id: 'custom_' + Date.now(),
                name: file.name,
                uri: url,
                isCustom: true
              };
              this.currentTone.set(customTone);
              resolve(customTone);
            } else {
              resolve(null);
            }
          };
          input.click();
        });
      }
    } catch (err) {
      console.warn('FilePicker cancelled or unavailable:', err);
    }
    return null;
  }

  selectTone(tone: SoundTone) {
    this.currentTone.set(tone);
  }

  async playPreview(volumePercent: number = 85) {
    if (this.isPlaying()) {
      this.stopPreview();
      return;
    }

    const volume = Math.max(0, Math.min(1, volumePercent / 100));
    const tone = this.currentTone();

    if (tone.isCustom && tone.uri && this.audioElement) {
      try {
        this.audioElement.src = tone.uri;
        this.audioElement.volume = volume;
        await this.audioElement.play();
        this.isPlaying.set(true);
        return;
      } catch (e) {
        console.warn('Native audio play error, falling back to melodic synthesizer:', e);
      }
    }

    // Melodic Web Audio Synth for preset Lumos alarm sounds
    this.playSynthesizedTone(tone.id, volume);
  }

  stopPreview() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
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
