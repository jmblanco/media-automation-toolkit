const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Sintetizador Lo-Fi simple en Node.js que genera un archivo WAV armónico con acordes Rhodes y melodía
 */
function generateLofiTrack(durationSeconds = 8) {
  const sampleRate = 44100;
  const totalSamples = sampleRate * durationSeconds;
  const numChannels = 2; // Estéreo
  const bytesPerSample = 2; // 16-bit PCM

  // Frecuencias de notas musicales (Hz)
  const notes = {
    // Bajo
    C2: 65.41,
    D2: 73.42,
    F2: 87.31,
    G2: 98.0,
    A2: 110.0,
    // Acordes medios (Rhodes / Piano)
    C3: 130.81,
    D3: 146.83,
    E3: 164.81,
    F3: 174.61,
    G3: 196.0,
    A3: 220.0,
    B3: 246.94,
    C4: 261.63,
    D4: 293.66,
    E4: 329.63,
    F4: 349.23,
    G4: 392.0,
    A4: 440.0,
    B4: 493.88,
    // Melodía aguda
    C5: 523.25,
    D5: 587.33,
    E5: 659.25,
    G5: 783.99,
    A5: 880.0,
  };

  // Progresión de acordes Lo-Fi de 4 compases (2 segundos por acorde)
  // 1: Dm9 (D2 + F3 + A3 + C4 + E4)
  // 2: G13 (G2 + F3 + B3 + E4)
  // 3: Cmaj9 (C2 + E3 + G3 + B3 + D4)
  // 4: Am9 (A2 + C3 + E3 + G3 + B3)
  const chordProgression = [
    {
      bass: notes.D2,
      chord: [notes.F3, notes.A3, notes.C4, notes.E4],
      arpeggio: [notes.A4, notes.C5, notes.E5, notes.D5],
    },
    {
      bass: notes.G2,
      chord: [notes.F3, notes.B3, notes.D4, notes.E4],
      arpeggio: [notes.G4, notes.B4, notes.D5, notes.E5],
    },
    {
      bass: notes.C2,
      chord: [notes.E3, notes.G3, notes.B3, notes.D4],
      arpeggio: [notes.E4, notes.G4, notes.B4, notes.D5],
    },
    {
      bass: notes.A2,
      chord: [notes.C3, notes.E3, notes.G3, notes.B3],
      arpeggio: [notes.C5, notes.E5, notes.G5, notes.A5],
    },
  ];

  const buffer = Buffer.alloc(44 + totalSamples * numChannels * bytesPerSample);

  // Escribir cabecera WAV estándar
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + totalSamples * numChannels * bytesPerSample, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28); // ByteRate
  buffer.writeUInt16LE(numChannels * bytesPerSample, 32); // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample
  buffer.write('data', 36);
  buffer.writeUInt32LE(totalSamples * numChannels * bytesPerSample, 40);

  let offset = 44;
  const chordDuration = 2; // 2 segundos por acorde
  const samplesPerChord = sampleRate * chordDuration;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const chordIndex = Math.min(Math.floor(i / samplesPerChord), chordProgression.length - 1);
    const current = chordProgression[chordIndex];
    const timeInChord = (i % samplesPerChord) / sampleRate;

    // Envolvente de caída suave para el acorde (Rhodes cálido)
    const chordEnvelope = Math.exp(-1.4 * timeInChord) * Math.min(timeInChord * 30, 1.0);

    // Suma de notas del acorde con armónicos suaves para timbre de piano eléctrico
    let chordSignal = 0;
    for (const freq of current.chord) {
      chordSignal += Math.sin(2 * Math.PI * freq * t) * 0.4;
      chordSignal += Math.sin(2 * Math.PI * freq * 2 * t) * 0.12; // 2do armónico
    }
    chordSignal = chordSignal * chordEnvelope * 0.22;

    // Bajo cálido y profundo
    const bassEnvelope = Math.exp(-0.8 * timeInChord) * Math.min(timeInChord * 20, 1.0);
    const bassSignal = Math.sin(2 * Math.PI * current.bass * t) * bassEnvelope * 0.35;

    // Arpegio / Melodía con notas que cambian cada 0.5s
    const arpeggioStep = Math.floor(timeInChord * 2) % current.arpeggio.length;
    const arpFreq = current.arpeggio[arpeggioStep];
    const timeInStep = timeInChord % 0.5;
    const arpEnvelope = Math.exp(-4.5 * timeInStep) * Math.min(timeInStep * 60, 1.0);
    const arpSignal =
      (Math.sin(2 * Math.PI * arpFreq * t) + Math.sin(2 * Math.PI * arpFreq * 2 * t) * 0.15) *
      arpEnvelope *
      0.2;

    // Mezcla estéreo con ligero paneo
    const leftSample = Math.max(-1, Math.min(1, chordSignal * 0.9 + bassSignal + arpSignal * 0.7));
    const rightSample = Math.max(-1, Math.min(1, chordSignal * 1.0 + bassSignal + arpSignal * 1.1));

    buffer.writeInt16LE(Math.round(leftSample * 32767), offset);
    buffer.writeInt16LE(Math.round(rightSample * 32767), offset + 2);
    offset += 4;
  }

  const root = path.join(__dirname, '..');
  const tempWav = path.join(root, 'tmp', 'temp_lofi.wav');
  const finalMp3 = path.join(root, 'assets', 'audios', 'musica_muestra.mp3');

  if (!fs.existsSync(path.dirname(tempWav)))
    fs.mkdirSync(path.dirname(tempWav), { recursive: true });
  fs.writeFileSync(tempWav, buffer);

  console.log('🎵 Convirtiendo síntesis Lo-Fi a MP3 de alta fidelidad con FFmpeg...');
  execSync(`ffmpeg -y -i "${tempWav}" -c:a libmp3lame -b:a 192k "${finalMp3}"`, {
    stdio: 'inherit',
  });

  // Limpiar wav temporal
  if (fs.existsSync(tempWav)) fs.unlinkSync(tempWav);

  console.log(`✅ Pista Lo-Fi melódica generada en: ${finalMp3}`);
}

generateLofiTrack(8);
