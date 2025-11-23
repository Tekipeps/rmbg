import sharp from 'sharp';
import fs from 'fs';

const logoPath = './logo.png';

async function generateFavicons() {
  // Generate favicon-16x16.png
  await sharp(logoPath)
    .resize(16, 16)
    .toFile('./public/favicon-16x16.png');

  // Generate favicon-32x32.png
  await sharp(logoPath)
    .resize(32, 32)
    .toFile('./public/favicon-32x32.png');

  // Generate favicon.png (default 32x32)
  await sharp(logoPath)
    .resize(32, 32)
    .toFile('./public/favicon.png');

  // Generate apple-touch-icon (180x180)
  await sharp(logoPath)
    .resize(180, 180)
    .toFile('./public/apple-touch-icon.png');

  // Generate for web directory
  await sharp(logoPath)
    .resize(16, 16)
    .toFile('./web/public/favicon-16x16.png');

  await sharp(logoPath)
    .resize(32, 32)
    .toFile('./web/public/favicon-32x32.png');

  await sharp(logoPath)
    .resize(32, 32)
    .toFile('./web/public/favicon.png');

  await sharp(logoPath)
    .resize(180, 180)
    .toFile('./web/public/apple-touch-icon.png');

  // Generate ICO file (combining 16x16, 32x32, 48x48)
  const png16 = await sharp(logoPath).resize(16, 16).png().toBuffer();
  const png32 = await sharp(logoPath).resize(32, 32).png().toBuffer();
  const png48 = await sharp(logoPath).resize(48, 48).png().toBuffer();

  // Note: Creating a proper ICO file requires a special format
  // For now, we'll create a 32x32 PNG and name it .ico
  // which works in most modern browsers
  await sharp(logoPath)
    .resize(32, 32)
    .toFile('./public/favicon.ico');

  await sharp(logoPath)
    .resize(32, 32)
    .toFile('./web/public/favicon.ico');

  console.log('Favicons generated successfully!');
}

generateFavicons().catch(console.error);
