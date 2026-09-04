import fs from 'node:fs';
import path from 'node:path';
import { createCanvas } from '@napi-rs/canvas';

const ROOT = path.resolve('.');
const SHELL_DIR = path.join(ROOT, 'apps/shell');

// 1. Generate 1024x1024 master icon
function createMasterIcon(size = 1024) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const scale = size / 1024;

  ctx.clearRect(0, 0, size, size);

  // Helper for scaled rounded rect
  function roundRect(x, y, w, h, r) {
    x *= scale; y *= scale; w *= scale; h *= scale; r *= scale;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  // Soft ambient drop shadow under the icon squircle
  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.35)';
  ctx.shadowBlur = 48 * scale;
  ctx.shadowOffsetY = 24 * scale;
  roundRect(80, 80, 864, 864, 210);
  ctx.fillStyle = '#0F172A';
  ctx.fill();
  ctx.restore();

  // Outer Squircle with vibrant multi-stop mesh-like gradient
  roundRect(80, 80, 864, 864, 210);
  const bgGrad = ctx.createLinearGradient(80 * scale, 80 * scale, 944 * scale, 944 * scale);
  bgGrad.addColorStop(0, '#1E293B');      // Slate dark
  bgGrad.addColorStop(0.35, '#0F172A');   // Deep obsidian
  bgGrad.addColorStop(0.7, '#1E1B4B');    // Deep indigo
  bgGrad.addColorStop(1, '#0C4A6E');      // Deep ocean cyan
  ctx.fillStyle = bgGrad;
  ctx.fill();

  // Subtle border highlight
  ctx.save();
  roundRect(80, 80, 864, 864, 210);
  ctx.lineWidth = 4 * scale;
  const borderGrad = ctx.createLinearGradient(80 * scale, 80 * scale, 944 * scale, 944 * scale);
  borderGrad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
  borderGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
  borderGrad.addColorStop(1, 'rgba(56, 189, 248, 0.3)');
  ctx.strokeStyle = borderGrad;
  ctx.stroke();
  ctx.restore();

  // Internal glowing aura
  ctx.save();
  roundRect(84, 84, 856, 856, 206);
  ctx.clip();
  const radialGlow = ctx.createRadialGradient(512 * scale, 480 * scale, 50 * scale, 512 * scale, 512 * scale, 450 * scale);
  radialGlow.addColorStop(0, 'rgba(59, 130, 246, 0.18)');
  radialGlow.addColorStop(0.6, 'rgba(139, 92, 246, 0.12)');
  radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = radialGlow;
  ctx.fillRect(80 * scale, 80 * scale, 864 * scale, 864 * scale);
  ctx.restore();

  // --- Niwan "N" Modern Office Emblem ---
  // Left Pillar (representing Document sheet, sleek cyan/blue)
  ctx.save();
  ctx.beginPath();
  const leftX = 260 * scale;
  const topY = 270 * scale;
  const pillarW = 120 * scale;
  const pillarH = 484 * scale;
  const r = 28 * scale;

  ctx.moveTo(leftX + r, topY);
  ctx.lineTo(leftX + pillarW - r, topY);
  ctx.arcTo(leftX + pillarW, topY, leftX + pillarW, topY + r, r);
  ctx.lineTo(leftX + pillarW, topY + pillarH - r);
  ctx.arcTo(leftX + pillarW, topY + pillarH, leftX + pillarW - r, topY + pillarH, r);
  ctx.lineTo(leftX + r, topY + pillarH);
  ctx.arcTo(leftX, topY + pillarH, leftX, topY + pillarH - r, r);
  ctx.lineTo(leftX, topY + r);
  ctx.arcTo(leftX, topY, leftX + r, topY, r);
  ctx.closePath();

  const leftGrad = ctx.createLinearGradient(leftX, topY, leftX + pillarW, topY + pillarH);
  leftGrad.addColorStop(0, '#38BDF8');  // Sky blue
  leftGrad.addColorStop(1, '#2563EB');  // Royal blue
  ctx.fillStyle = leftGrad;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = 16 * scale;
  ctx.shadowOffsetY = 8 * scale;
  ctx.fill();
  ctx.restore();

  // Right Pillar (representing Slide/Presentation, vibrant violet/indigo)
  ctx.save();
  ctx.beginPath();
  const rightX = 644 * scale;
  ctx.moveTo(rightX + r, topY);
  ctx.lineTo(rightX + pillarW - r, topY);
  ctx.arcTo(rightX + pillarW, topY, rightX + pillarW, topY + r, r);
  ctx.lineTo(rightX + pillarW, topY + pillarH - r);
  ctx.arcTo(rightX + pillarW, topY + pillarH, rightX + pillarW - r, topY + pillarH, r);
  ctx.lineTo(rightX + r, topY + pillarH);
  ctx.arcTo(rightX, topY + pillarH, rightX, topY + pillarH - r, r);
  ctx.lineTo(rightX, topY + r);
  ctx.arcTo(rightX, topY, rightX + r, topY, r);
  ctx.closePath();

  const rightGrad = ctx.createLinearGradient(rightX, topY, rightX + pillarW, topY + pillarH);
  rightGrad.addColorStop(0, '#818CF8');  // Indigo
  rightGrad.addColorStop(1, '#6366F1');  // Deep violet
  ctx.fillStyle = rightGrad;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = 16 * scale;
  ctx.shadowOffsetY = 8 * scale;
  ctx.fill();
  ctx.restore();

  // Diagonal Dynamic Ribbon (connecting top-left to bottom-right with overlapping depth fold)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo((260 + 20) * scale, (270 + 20) * scale);
  ctx.lineTo((380) * scale, (270) * scale);
  ctx.lineTo((764 - 20) * scale, (754 - 20) * scale);
  ctx.lineTo((644) * scale, (754) * scale);
  ctx.closePath();

  const diagGrad = ctx.createLinearGradient(280 * scale, 270 * scale, 764 * scale, 754 * scale);
  diagGrad.addColorStop(0, '#60A5FA');   // Light blue
  diagGrad.addColorStop(0.4, '#3B82F6'); // Classic blue
  diagGrad.addColorStop(0.8, '#6366F1'); // Indigo
  diagGrad.addColorStop(1, '#A855F7');   // Purple
  ctx.fillStyle = diagGrad;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 24 * scale;
  ctx.shadowOffsetY = 12 * scale;
  ctx.fill();
  ctx.restore();

  // Top-left sheet highlight fold
  ctx.save();
  ctx.beginPath();
  ctx.arc((260 + 60) * scale, (270 + 60) * scale, 24 * scale, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fill();
  ctx.restore();

  return canvas;
}

// 2. Generate the monochromatic vector SVG logo lockup (for Home.tsx & home.css)
function createSvgLogo() {
  return `<svg width="1091" height="240" viewBox="0 0 1091 240" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- NiwanOffice Squircle Emblem (Left) -->
  <g clip-path="url(#niwan_clip)">
    <rect width="240" height="240" rx="54" fill="black"/>
    <!-- Left Pillar Sheet -->
    <rect x="52" y="52" width="34" height="136" rx="8" fill="white"/>
    <!-- Right Pillar Sheet -->
    <rect x="154" y="52" width="34" height="136" rx="8" fill="white"/>
    <!-- Diagonal Fold Ribbon -->
    <polygon points="56,60 90,52 184,180 150,188" fill="white"/>
    <!-- Center Fold Accent -->
    <circle cx="69" cy="69" r="6" fill="black"/>
    <circle cx="171" cy="171" r="6" fill="black"/>
  </g>
  <defs>
    <clipPath id="niwan_clip">
      <rect width="240" height="240" rx="54" fill="white"/>
    </clipPath>
  </defs>

  <!-- NiwanOffice Wordmark Typography (Right) -->
  <text x="290" y="156" fill="black" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="94" letter-spacing="-1.5">Niwan<tspan font-weight="400" fill="black">Office</tspan></text>
</svg>`;
}

async function run() {
  console.log('Generating master icon (1024x1024)...');
  const masterCanvas = createMasterIcon(1024);
  const masterBuffer = masterCanvas.toBuffer('image/png');

  // Paths to save master icon
  const buildDir = path.join(SHELL_DIR, 'build');
  const iconsDir = path.join(buildDir, 'icons');
  fs.mkdirSync(iconsDir, { recursive: true });

  fs.writeFileSync(path.join(buildDir, 'icon.png'), masterBuffer);
  fs.writeFileSync(path.join(buildDir, 'icon-mac.png'), masterBuffer);
  fs.writeFileSync(path.join(SHELL_DIR, 'src/renderer/src/assets/app-icon.png'), masterBuffer);
  fs.writeFileSync(path.join(iconsDir, '1024x1024.png'), masterBuffer);

  // Generate each resolution
  const sizes = [16, 32, 48, 64, 128, 256, 512];
  for (const size of sizes) {
    console.log(`Generating icon ${size}x${size}...`);
    const canvas = createMasterIcon(size);
    const buf = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(iconsDir, `${size}x${size}.png`), buf);
  }

  // Generate SVG logo
  console.log('Generating SVG logo lockup...');
  const svgLogo = createSvgLogo();
  const svgLogoPath = path.join(SHELL_DIR, 'src/renderer/src/assets/genoffice-logo.svg');
  fs.writeFileSync(svgLogoPath, svgLogo, 'utf8');

  console.log('Branding generation complete!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
