const fs = require('fs');
const path = require('path');

// 1. Generate SVG for Favicon and Web Assets
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <!-- Cosmic Background Gradient -->
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#141E33" />
      <stop offset="70%" stop-color="#0A0F1D" />
      <stop offset="100%" stop-color="#060912" />
    </radialGradient>

    <!-- Golden Star Gradient -->
    <radialGradient id="starGrad" cx="50%" cy="50%" r="45%">
      <stop offset="0%" stop-color="#FFF59D" />
      <stop offset="30%" stop-color="#FFD54F" />
      <stop offset="75%" stop-color="#FFA000" />
      <stop offset="100%" stop-color="#FF8F00" />
    </radialGradient>

    <!-- Ring Gradient -->
    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE082" />
      <stop offset="50%" stop-color="#FFD54F" />
      <stop offset="100%" stop-color="#F57F17" />
    </linearGradient>

    <!-- Satellite Glow Filter -->
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Deep Cosmic Canvas Background -->
  <rect width="200" height="200" rx="42" fill="url(#bgGrad)" />

  <!-- Outer Concentric Dashed Ring -->
  <circle
    cx="100"
    cy="100"
    r="78"
    fill="none"
    stroke="#FFD54F"
    stroke-width="1.2"
    stroke-dasharray="4 6"
    opacity="0.45"
  />

  <!-- Inner Solid Golden Circular Ring -->
  <circle
    cx="100"
    cy="100"
    r="54"
    fill="none"
    stroke="url(#ringGrad)"
    stroke-width="2.2"
  />

  <!-- Horizontal & Vertical Needle Crossbars (touching the inner ring) -->
  <line x1="46" y1="100" x2="154" y2="100" stroke="#FFE082" stroke-width="1.4" opacity="0.9" />
  <line x1="100" y1="46" x2="100" y2="154" stroke="#FFE082" stroke-width="1.4" opacity="0.9" />

  <!-- Central 4-Pointed Flared Star Body -->
  <!-- Curves pinch concave from points at distance 54 to center at ~16 -->
  <path
    d="M 100,46
       C 100,82 118,100 154,100
       C 118,100 100,118 100,154
       C 100,118 82,100 46,100
       C 82,100 100,82 100,46 Z"
    fill="url(#starGrad)"
    stroke="#FFF9C4"
    stroke-width="0.8"
  />

  <!-- Orbiting Golden Satellite Particle (Lower Left ~210° on radius 54) -->
  <!-- x = 100 - 54 * cos(30°) = 100 - 46.77 = 53.23; y = 100 + 54 * sin(30°) = 100 + 27 = 127 -->
  <circle cx="53.2" cy="127" r="10" fill="#FFD54F" opacity="0.35" filter="url(#glow)" />
  <circle cx="53.2" cy="127" r="5.5" fill="#FFE082" />
  <circle cx="53.2" cy="127" r="2.5" fill="#FFFFFF" />

  <!-- Center Luminous Sparkle Dot Core -->
  <circle cx="100" cy="100" r="4.2" fill="#FFFDE7" />
  <circle cx="100" cy="100" r="2" fill="#FFFFFF" />
</svg>`;

// Save SVG Favicon
const publicDir = path.resolve(__dirname, '../public');
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf-8');
console.log('Saved public/favicon.svg');

// 2. Generate Android Vector Drawables for Adaptive Icon
const androidDrawableDir = path.resolve(__dirname, '../android/app/src/main/res/drawable');

const icLauncherBackgroundXml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <!-- Cosmic Dark Canvas -->
    <path
        android:fillColor="#080C16"
        android:pathData="M0,0h108v108h-108z" />
    <!-- Ambient Celestial Radiance -->
    <path
        android:fillColor="#0E162A"
        android:pathData="M54,14 A40,40 0 1,0 54,94 A40,40 0 1,0 54,14 Z" />
    <path
        android:fillColor="#152140"
        android:pathData="M54,26 A28,28 0 1,0 54,82 A28,28 0 1,0 54,26 Z" />
    <path
        android:fillColor="#1D2D56"
        android:pathData="M54,38 A16,16 0 1,0 54,70 A16,16 0 1,0 54,38 Z" />
</vector>
`;

const icLauncherForegroundXml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">

    <!-- Outer Concentric Dashed Ring (radius 39) -->
    <path
        android:pathData="M54,15 A39,39 0 1,0 54,93 A39,39 0 1,0 54,15 Z"
        android:strokeColor="#FFD54F"
        android:strokeWidth="0.8"
        android:strokeAlpha="0.45" />

    <!-- Inner Solid Golden Circular Ring (radius 27) -->
    <path
        android:pathData="M54,27 A27,27 0 1,0 54,81 A27,27 0 1,0 54,27 Z"
        android:strokeColor="#FFD54F"
        android:strokeWidth="1.3" />

    <!-- Horizontal Needle Crossbar (x from 27 to 81 at y=54) -->
    <path
        android:pathData="M27,54 L81,54"
        android:strokeColor="#FFE082"
        android:strokeWidth="0.8" />

    <!-- Vertical Needle Crossbar (y from 27 to 81 at x=54) -->
    <path
        android:pathData="M54,27 L54,81"
        android:strokeColor="#FFE082"
        android:strokeWidth="0.8" />

    <!-- Central 4-Pointed Flared Golden Star Body -->
    <path
        android:pathData="M 54,27 C 54,45 63,54 81,54 C 63,54 54,63 54,81 C 54,63 45,54 27,54 C 45,54 54,45 54,27 Z"
        android:fillColor="#FFD54F"
        android:strokeColor="#FFF9C4"
        android:strokeWidth="0.5" />

    <!-- Orbiting Satellite Glow Aura (Lower-Left at 210°: x=30.6, y=67.5) -->
    <path
        android:pathData="M30.6,63.5 A4,4 0 1,0 30.6,71.5 A4,4 0 1,0 30.6,63.5 Z"
        android:fillColor="#FFA000"
        android:fillAlpha="0.4" />

    <!-- Orbiting Golden Satellite Particle Body -->
    <path
        android:pathData="M30.6,65.3 A2.2,2.2 0 1,0 30.6,69.7 A2.2,2.2 0 1,0 30.6,65.3 Z"
        android:fillColor="#FFE082" />

    <!-- Satellite Core Dot -->
    <path
        android:pathData="M30.6,66.5 A1,1 0 1,0 30.6,68.5 A1,1 0 1,0 30.6,66.5 Z"
        android:fillColor="#FFFFFF" />

    <!-- Center Radiant Core Halo -->
    <path
        android:pathData="M54,51.8 A2.2,2.2 0 1,0 54,56.2 A2.2,2.2 0 1,0 54,51.8 Z"
        android:fillColor="#FFFDE7" />

    <!-- Center Light Core Spark -->
    <path
        android:pathData="M54,52.8 A1.2,1.2 0 1,0 54,55.2 A1.2,1.2 0 1,0 54,52.8 Z"
        android:fillColor="#FFFFFF" />
</vector>
`;

fs.writeFileSync(path.join(androidDrawableDir, 'ic_launcher_background.xml'), icLauncherBackgroundXml, 'utf-8');
fs.writeFileSync(path.join(androidDrawableDir, 'ic_launcher_foreground.xml'), icLauncherForegroundXml, 'utf-8');
console.log('Saved Android vector drawables in res/drawable/');

// 3. Audio Tone Synthesis for res/raw (WAV PCM)
// Generates audible, clean alarm audio for background notifications!
function generateWavBuffer({ sampleRate = 44100, duration = 3.5, generator }) {
  const numSamples = Math.floor(sampleRate * duration);
  const blockAlign = 2; // 16-bit mono
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF Chunk
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // FMT Chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // subchunk1 size
  buffer.writeUInt16LE(1, 20);  // PCM format
  buffer.writeUInt16LE(1, 22);  // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // 16 bits per sample

  // DATA Chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = generator(t);
    sample = Math.max(-1, Math.min(1, sample));
    const intSample = Math.floor(sample < 0 ? sample * 32768 : sample * 32767);
    buffer.writeInt16LE(intSample, offset);
    offset += 2;
  }

  return buffer;
}

// 3.1 Radar Suave (Pleasant repeating celestial chime)
const radarSuaveWav = generateWavBuffer({
  duration: 4.0,
  generator: (t) => {
    // 2-tone melodic pulses repeated every 1.0s
    const loopT = t % 1.0;
    const toneIdx = Math.floor(loopT / 0.25);
    const toneT = loopT % 0.25;
    const freqs = [587.33, 880.0, 1174.66, 0]; // D5, A5, D6, rest
    const f = freqs[toneIdx] || 0;
    if (f === 0) return 0;
    const env = Math.exp(-toneT * 12); // smooth decaying pluck envelope
    return (Math.sin(2 * Math.PI * f * toneT) + 0.3 * Math.sin(4 * Math.PI * f * toneT)) * env * 0.7;
  }
});

// 3.2 Pulsar Celestial (Cosmic ascending chime)
const pulsarWav = generateWavBuffer({
  duration: 4.0,
  generator: (t) => {
    const loopT = t % 1.3;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const step = Math.min(3, Math.floor(loopT / 0.22));
    const noteT = loopT - step * 0.22;
    if (noteT < 0 || loopT > 0.95) return 0;
    const f = notes[step];
    const env = Math.exp(-noteT * 9);
    return Math.sin(2 * Math.PI * f * noteT) * env * 0.65;
  }
});

// 3.3 Alarm Sound (Insistent wake-up alarm chime)
const alarmSoundWav = generateWavBuffer({
  duration: 3.5,
  generator: (t) => {
    const loopT = t % 0.8;
    const beeps = Math.floor(loopT / 0.18);
    const beepT = loopT % 0.18;
    if (beeps > 2) return 0; // 3 beeps then pause
    const f = 880; // A5
    const env = Math.min(1, beepT * 40) * Math.min(1, (0.16 - beepT) * 40);
    return Math.sin(2 * Math.PI * f * beepT) * env * 0.75;
  }
});

// Write to android res/raw
const rawDir = path.resolve(__dirname, '../android/app/src/main/res/raw');
if (!fs.existsSync(rawDir)) {
  fs.mkdirSync(rawDir, { recursive: true });
}

fs.writeFileSync(path.join(rawDir, 'radar_suave.wav'), radarSuaveWav);
fs.writeFileSync(path.join(rawDir, 'pulsar_celestial.wav'), pulsarWav);
fs.writeFileSync(path.join(rawDir, 'alarm_sound.wav'), alarmSoundWav);
console.log('Saved Android background alarm sound files in res/raw/');

// Also write copy to public/tones/ so browser Web Audio / HTML5 audio can play them identically
const publicTonesDir = path.resolve(publicDir, 'tones');
if (!fs.existsSync(publicTonesDir)) {
  fs.mkdirSync(publicTonesDir, { recursive: true });
}
fs.writeFileSync(path.join(publicTonesDir, 'radar_suave.wav'), radarSuaveWav);
fs.writeFileSync(path.join(publicTonesDir, 'pulsar_celestial.wav'), pulsarWav);
fs.writeFileSync(path.join(publicTonesDir, 'alarm_sound.wav'), alarmSoundWav);
console.log('Saved Web alarm audio files in public/tones/');
