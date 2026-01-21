import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const svgPath = join(rootDir, 'public', 'icons', 'icon.svg');
const outputDir = join(rootDir, 'public', 'icons');

// Ensure output directory exists
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

const svgBuffer = readFileSync(svgPath);

console.log('Generating PWA icons...');

for (const size of sizes) {
  const outputPath = join(outputDir, `icon-${size}x${size}.png`);

  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(outputPath);

  console.log(`Generated: icon-${size}x${size}.png`);
}

// Generate Apple Touch Icon (180x180)
const appleTouchIconPath = join(outputDir, 'apple-touch-icon.png');
await sharp(svgBuffer)
  .resize(180, 180)
  .png()
  .toFile(appleTouchIconPath);
console.log('Generated: apple-touch-icon.png');

// Generate favicon.ico as a 32x32 PNG (browsers support PNG favicons)
const faviconPath = join(rootDir, 'public', 'favicon.png');
await sharp(svgBuffer)
  .resize(32, 32)
  .png()
  .toFile(faviconPath);
console.log('Generated: favicon.png');

console.log('All icons generated successfully!');
