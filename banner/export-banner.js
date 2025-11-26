import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function exportBanner() {
  console.log('🚀 Iniciando exportação do banner...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // A0 dimensions in mm
  const width = 841;
  const height = 1189;

  // Set viewport to exact A0 proportions at high resolution
  // Using 3x scale for ~300 DPI equivalent
  await page.setViewport({
    width: Math.round(width * 3.78 * 3),  // 9534px
    height: Math.round(height * 3.78 * 3), // 13482px
    deviceScaleFactor: 3
  });

  // Load from Vite dev server (must be running!)
  const url = 'http://localhost:3001';
  console.log(`📄 Carregando: ${url}`);
  console.log('⚠️  Certifique-se de que o servidor Vite está rodando (npm run dev)');

  await page.goto(url, {
    waitUntil: 'networkidle0',
    timeout: 60000
  });

  console.log('⏳ Aguardando renderização completa...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Export as PDF with exact A0 dimensions
  console.log('💾 Gerando PDF...');
  await page.pdf({
    path: 'banner-a0.pdf',
    width: `${width}mm`,
    height: `${height}mm`,
    printBackground: true,
    margin: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    },
    preferCSSPageSize: false
  });

  console.log('✅ PDF gerado: banner-a0.pdf');

  // Optional: Export as high-res PNG (for digital display)
  try {
    console.log('💾 Tentando gerar PNG de alta resolução...');

    // Reduce viewport for PNG to avoid memory issues
    await page.setViewport({
      width: Math.round(width * 3.78),  // 3178px (original CSS size)
      height: Math.round(height * 3.78), // 4494px
      deviceScaleFactor: 1
    });

    await page.screenshot({
      path: 'banner-a0.png',
      fullPage: true,
      type: 'png'
    });

    console.log('✅ PNG gerado: banner-a0.png');
  } catch (error) {
    console.warn('⚠️  PNG não pôde ser gerado (resolução muito alta, mas o PDF está OK)');
  }

  await browser.close();
  console.log('🎉 Exportação concluída!');
}

exportBanner().catch(error => {
  console.error('❌ Erro na exportação:', error);
  process.exit(1);
});
