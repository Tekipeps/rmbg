import sharp from 'sharp';

const logoPath = './logo.png';
const iconDir = './src-tauri/icons';

const sizes = [
  { size: 32, name: '32x32.png' },
  { size: 128, name: '128x128.png' },
  { size: 256, name: '128x128@2x.png' },
  { size: 512, name: 'icon.png' },
  { size: 1024, name: 'icon.icns' }, // Will be PNG, Tauri CLI converts it
  { size: 256, name: 'icon.ico' }, // Will be PNG, Tauri CLI converts it
  // Windows Store Logos
  { size: 30, name: 'Square30x30Logo.png' },
  { size: 44, name: 'Square44x44Logo.png' },
  { size: 71, name: 'Square71x71Logo.png' },
  { size: 89, name: 'Square89x89Logo.png' },
  { size: 107, name: 'Square107x107Logo.png' },
  { size: 142, name: 'Square142x142Logo.png' },
  { size: 150, name: 'Square150x150Logo.png' },
  { size: 284, name: 'Square284x284Logo.png' },
  { size: 310, name: 'Square310x310Logo.png' },
  { size: 50, name: 'StoreLogo.png' },
];

async function generateTauriIcons() {
  for (const { size, name } of sizes) {
    await sharp(logoPath)
      .resize(size, size)
      .toFile(`${iconDir}/${name}`);
    console.log(`Generated ${name}`);
  }

  console.log('Tauri icons generated successfully!');
}

generateTauriIcons().catch(console.error);
