const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { execSync } = require('child_process');

async function createSampleAssets() {
  const root = path.join(__dirname, '..');
  const imgDir = path.join(root, 'assets', 'images');
  const audioDir = path.join(root, 'assets', 'audios');

  if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });
  if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

  // Crear 3 imágenes de muestra Full HD con Sharp
  const slides = [
    { title: 'Foto 1: Viaje a la Costa', bg: '#2563eb', subtitle: 'Primer día de vacaciones' },
    { title: 'Foto 2: Atardecer Dorado', bg: '#d97706', subtitle: 'Paseo junto al mar' },
    { title: 'Foto 3: Cena en Familia', bg: '#7c3aed', subtitle: 'Momentos inolvidables' },
  ];

  for (let i = 0; i < slides.length; i++) {
    const s = slides[i];
    const svg = `
      <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${s.bg}"/>
        <circle cx="960" cy="540" r="300" fill="white" fill-opacity="0.12"/>
        <text x="50%" y="46%" font-size="75" font-family="Arial, sans-serif" font-weight="bold" fill="white" text-anchor="middle">${s.title}</text>
        <text x="50%" y="58%" font-size="42" font-family="Arial, sans-serif" fill="white" fill-opacity="0.85" text-anchor="middle">${s.subtitle}</text>
      </svg>
    `;
    const outputPath = path.join(imgDir, `muestra_${i + 1}.jpg`);
    await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toFile(outputPath);
    console.log(`✅ Creada imagen de muestra: ${path.basename(outputPath)}`);
  }

  // Generar audio de muestra de 6 segundos con FFmpeg
  const audioPath = path.join(audioDir, 'musica_muestra.mp3');
  console.log('🎵 Generando pista de audio melódica con FFmpeg...');
  execSync(
    `ffmpeg -y -f lavfi -i "sine=frequency=523.25:duration=6" -af "volume=0.3" -c:a libmp3lame "${audioPath}"`,
    {
      stdio: 'inherit',
    },
  );
  console.log(`✅ Creado audio de muestra: ${path.basename(audioPath)}`);

  // Crear archivo de subtítulos .srt
  const srtPath = path.join(audioDir, 'subtitulos_muestra.srt');
  const srtContent = `1
00:00:00,500 --> 00:00:02,000
Primer día de vacaciones en la costa

2
00:00:02,200 --> 00:00:04,000
Un atardecer dorado junto al mar

3
00:00:04,200 --> 00:00:05,800
Cena en familia, momentos inolvidables
`;
  fs.writeFileSync(srtPath, srtContent, 'utf8');
  console.log(`✅ Creado subtítulo de muestra: ${path.basename(srtPath)}`);
}

createSampleAssets()
  .then(() => console.log('🎉 Assets de prueba listos.'))
  .catch((err) => {
    console.error('Error generando assets:', err);
    process.exit(1);
  });
