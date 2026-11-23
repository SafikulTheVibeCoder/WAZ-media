import { PosterConfig, BrandConfig, AspectRatio, ThemeConfig, BorderStyle } from '../types';
import { THEME_PRESETS } from '../data/quotes';

const SIZES: Record<AspectRatio, [number, number]> = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1080x1920': [1080, 1920],
  '1200x630': [1200, 630],
};

const BISMILLAH_TEXT = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';

// Cache loaded images and generated paper textures
const imageCache = new Map<string, HTMLImageElement>();
const paperTextureCache = new Map<string, HTMLCanvasElement>();

function createSeededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function buildNoiseGrid(cols: number, rows: number, rand: () => number): Float32Array {
  const arr = new Float32Array((cols + 1) * (rows + 1));
  for (let i = 0; i < arr.length; i++) {
    arr[i] = rand();
  }
  return arr;
}

function sampleNoiseGrid(
  grid: Float32Array,
  cols: number,
  rows: number,
  nx: number,
  ny: number
): number {
  const gx = Math.min(cols - 0.0001, Math.max(0, nx * cols));
  const gy = Math.min(rows - 0.0001, Math.max(0, ny * rows));
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const fx = gx - x0;
  const fy = gy - y0;
  // Smoothstep curve for organic cotton paper transitions
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const stride = cols + 1;
  const v00 = grid[y0 * stride + x0];
  const v10 = grid[y0 * stride + x0 + 1];
  const v01 = grid[(y0 + 1) * stride + x0];
  const v11 = grid[(y0 + 1) * stride + x0 + 1];
  const ix0 = v00 + (v10 - v00) * sx;
  const ix1 = v01 + (v11 - v01) * sx;
  return ix0 + (ix1 - ix0) * sy;
}

/**
 * Generates an organic crease & subtle wrinkle heightmap canvas (0..255)
 * used both for soft directional relief shadows and natural paper depth.
 */
function buildCreaseHeightmap(size: number, rand: () => number): Uint8ClampedArray {
  const hmCanvas = document.createElement('canvas');
  hmCanvas.width = size;
  hmCanvas.height = size;
  const hCtx = hmCanvas.getContext('2d');
  if (!hCtx) return new Uint8ClampedArray(size * size).fill(128);

  hCtx.fillStyle = 'rgb(128,128,128)';
  hCtx.fillRect(0, 0, size, size);

  // Soft wide paper ripples / deckle undulations
  for (let i = 0; i < 16; i++) {
    const cx = rand() * size;
    const cy = rand() * size;
    const rad = size * (0.18 + rand() * 0.34);
    const val = rand() > 0.5 ? 168 : 88;
    const g = hCtx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    g.addColorStop(0, `rgba(${val},${val},${val},0.28)`);
    g.addColorStop(1, 'rgba(128,128,128,0)');
    hCtx.fillStyle = g;
    hCtx.fillRect(0, 0, size, size);
  }

  // Subtle organic creases and micro-wrinkles with irregular wobbly paths
  hCtx.lineCap = 'round';
  hCtx.lineJoin = 'round';
  const creaseCount = 26;
  for (let i = 0; i < creaseCount; i++) {
    const x0 = rand() * size;
    const y0 = rand() * size;
    const angle = rand() * Math.PI * 2;
    const totalLen = size * (0.14 + rand() * 0.42);
    const steps = 6;
    const isRidge = rand() > 0.45;
    const shade = isRidge ? 185 : 70;

    hCtx.beginPath();
    hCtx.moveTo(x0, y0);
    let px = x0;
    let py = y0;
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const wobble = (rand() - 0.5) * size * 0.055;
      const perpAngle = angle + Math.PI / 2;
      px = x0 + Math.cos(angle) * totalLen * t + Math.cos(perpAngle) * wobble;
      py = y0 + Math.sin(angle) * totalLen * t + Math.sin(perpAngle) * wobble;
      hCtx.lineTo(px, py);
    }

    // Soft outer crease slope + sharper inner fold line
    hCtx.strokeStyle = `rgba(${shade},${shade},${shade},0.20)`;
    hCtx.lineWidth = 4.5 + rand() * 5;
    hCtx.stroke();

    hCtx.strokeStyle = `rgba(${shade},${shade},${shade},0.26)`;
    hCtx.lineWidth = 1.2 + rand() * 1.8;
    hCtx.stroke();
  }

  // Blur gently for continuous smooth slope derivatives
  const blurred = document.createElement('canvas');
  blurred.width = size;
  blurred.height = size;
  const bCtx = blurred.getContext('2d');
  if (bCtx) {
    bCtx.filter = 'blur(2.2px)';
    bCtx.drawImage(hmCanvas, 0, 0);
    const raw = bCtx.getImageData(0, 0, size, size).data;
    const out = new Uint8ClampedArray(size * size);
    for (let i = 0; i < out.length; i++) {
      out[i] = raw[i * 4];
    }
    return out;
  }

  const raw = hCtx.getImageData(0, 0, size, size).data;
  const out = new Uint8ClampedArray(size * size);
  for (let i = 0; i < out.length; i++) out[i] = raw[i * 4];
  return out;
}

/**
 * Realistic handmade textured ivory paper (#F5EBDD) with uneven beige variations,
 * visible paper grain, organic creases, directional ambient light/shadow relief, and cotton fibers.
 * No decorative patterns, borders, or digital flat gradients.
 */
function getEditorialPaperCanvas(width: number, height: number): HTMLCanvasElement {
  const key = `handmade-v2-${width}x${height}`;
  const cached = paperTextureCache.get(key);
  if (cached) return cached;

  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const pCtx = offscreen.getContext('2d');
  if (!pCtx) return offscreen;

  const rand = createSeededRandom(2047);

  // Multi-octave organic noise fields (visible on both 1080p & mobile screens)
  const macroGrid = buildNoiseGrid(5, 5, rand);      // Soft uneven cream/beige zones
  const mesoGrid = buildNoiseGrid(16, 16, rand);     // Paper undulation & tonal clouding
  const roughGrid = buildNoiseGrid(46, 46, rand);    // Tactile cotton mottling
  const pulpGrid = buildNoiseGrid(165, 165, rand);   // Coarse visible rag paper grain

  const hmSize = 256;
  const creaseMap = buildCreaseHeightmap(hmSize, rand);

  try {
    const imgData = pCtx.createImageData(width, height);
    const data = imgData.data;

    // Warm ivory #F5EBDD (245, 235, 221) base with natural beige variations
    for (let y = 0; y < height; y++) {
      const ny = y / height;
      const hmY = Math.min(hmSize - 2, Math.max(1, Math.floor(ny * hmSize)));
      const hmPrevY = hmY - 1;
      const hmNextY = hmY + 1;

      for (let x = 0; x < width; x++) {
        const nx = x / width;
        const idx = (y * width + x) * 4;

        // 1. Soft directional ambient illumination (warm upper-left light gently fading lower-right)
        const lightBias = (0.5 - (nx * 0.52 + ny * 0.48)) * 9.5;

        // 2. Soft perimeter paper depth falloff (subtle physical sheet edge variation)
        const dxEdge = (nx - 0.5) * 2;
        const dyEdge = (ny - 0.5) * 2;
        const edgeDist = Math.min(1, Math.sqrt(dxEdge * dxEdge + dyEdge * dyEdge) / 1.414);
        const ambientEdge = -Math.pow(edgeDist, 2.2) * 8.5;

        // 3. Multi-octave handmade pulp tonal variation (centered ~0)
        const nMacro = (sampleNoiseGrid(macroGrid, 5, 5, nx, ny) - 0.5) * 16;
        const nMeso = (sampleNoiseGrid(mesoGrid, 16, 16, nx, ny) - 0.5) * 13;
        const nRough = (sampleNoiseGrid(roughGrid, 46, 46, nx, ny) - 0.5) * 11;
        const nPulp = (sampleNoiseGrid(pulpGrid, 165, 165, nx, ny) - 0.5) * 14;

        // 4. Crease & paper surface relief via directional derivative from upper-left (-1, -1)
        const hmX = Math.min(hmSize - 2, Math.max(1, Math.floor(nx * hmSize)));
        const hCenter = creaseMap[hmY * hmSize + hmX] - 128;
        const hLit = creaseMap[hmPrevY * hmSize + (hmX - 1)];
        const hShade = creaseMap[hmNextY * hmSize + (hmX + 1)];
        const reliefSlope = (hLit - hShade) * 0.52;
        const reliefHeight = hCenter * 0.14;

        // 5. Fine deterministic high-frequency rag tooth
        const hash = (((x * 374761393 + y * 668265263) ^ (x * y)) >>> 24) & 255;
        const fineGrain = ((hash / 255) - 0.5) * 12;

        const delta =
          lightBias +
          ambientEdge +
          nMacro +
          nMeso +
          nRough +
          nPulp +
          reliefSlope +
          reliefHeight +
          fineGrain;

        // Subtle warm beige shift in darker hollows so shadows stay warm earthy beige, not grey
        const warmShift = delta < 0 ? delta * 0.14 : 0;

        data[idx] = Math.min(255, Math.max(0, 245 + delta));
        data[idx + 1] = Math.min(255, Math.max(0, 235 + delta * 0.94 + warmShift * 0.5));
        data[idx + 2] = Math.min(255, Math.max(0, 221 + delta * 0.86 + warmShift * 1.1));
        data[idx + 3] = 255;
      }
    }
    pCtx.putImageData(imgData, 0, 0);
  } catch {
    pCtx.fillStyle = '#F5EBDD';
    pCtx.fillRect(0, 0, width, height);
  }

  // Visible natural handmade paper fibers & organic pulp flecks (visible even on mobile thumbnails)
  pCtx.save();
  const kScale = width / 1080;
  const fiberCount = Math.round((width * height) / 1450);
  pCtx.lineCap = 'round';
  for (let i = 0; i < fiberCount; i++) {
    const x = rand() * width;
    const y = rand() * height;
    const len = (5 + rand() * 19) * kScale;
    const angle = rand() * Math.PI * 2;
    const ctrlOffset = (rand() - 0.5) * 6.5 * kScale;
    const ex = x + Math.cos(angle) * len;
    const ey = y + Math.sin(angle) * len;
    const cx = (x + ex) / 2 - Math.sin(angle) * ctrlOffset;
    const cy = (y + ey) / 2 + Math.cos(angle) * ctrlOffset;

    pCtx.beginPath();
    pCtx.moveTo(x, y);
    pCtx.quadraticCurveTo(cx, cy, ex, ey);
    pCtx.lineWidth = (0.65 + rand() * 1.15) * kScale;
    if (rand() > 0.34) {
      pCtx.strokeStyle = `rgba(126, 98, 66, ${(0.055 + rand() * 0.085).toFixed(3)})`;
    } else {
      pCtx.strokeStyle = `rgba(255, 252, 246, ${(0.24 + rand() * 0.24).toFixed(3)})`;
    }
    pCtx.stroke();
  }

  // Natural tiny organic botanical flecks embedded in handmade cotton pulp
  const fleckCount = Math.round((width * height) / 9500);
  for (let i = 0; i < fleckCount; i++) {
    const fx = rand() * width;
    const fy = rand() * height;
    const rx = (0.7 + rand() * 1.6) * kScale;
    const ry = (0.5 + rand() * 1.1) * kScale;
    pCtx.save();
    pCtx.translate(fx, fy);
    pCtx.rotate(rand() * Math.PI);
    pCtx.beginPath();
    pCtx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    pCtx.fillStyle = `rgba(108, 82, 54, ${(0.09 + rand() * 0.14).toFixed(3)})`;
    pCtx.fill();
    pCtx.restore();
  }
  pCtx.restore();

  paperTextureCache.set(key, offscreen);
  return offscreen;
}

export function loadImage(src: string): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  if (imageCache.has(src)) {
    return Promise.resolve(imageCache.get(src)!);
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = src;
  });
}

// Eight-pointed Islamic star
function drawStar8(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const points = 16;
  const innerR = r * 0.65;
  ctx.beginPath();
  for (let i = 0; i < points; i++) {
    const angle = (i * Math.PI) / (points / 2) - Math.PI / 2;
    const currentR = i % 2 === 0 ? r : innerR;
    const x = cx + Math.cos(angle) * currentR;
    const y = cy + Math.sin(angle) * currentR;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

// Refined horizontal golden ornamental divider with central star
function drawDivider(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  width: number,
  color: string,
  scale: number
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1, 2 * scale);
  ctx.globalAlpha = 0.9;

  const half = width / 2;
  const centerGap = 30 * scale;

  // Left & right lines with diamond taper
  ctx.beginPath();
  ctx.moveTo(cx - half, cy);
  ctx.lineTo(cx - centerGap, cy);
  ctx.moveTo(cx + centerGap, cy);
  ctx.lineTo(cx + half, cy);
  ctx.stroke();

  // Small accents on ends
  ctx.beginPath();
  ctx.arc(cx - half, cy, 2.5 * scale, 0, Math.PI * 2);
  ctx.arc(cx + half, cy, 2.5 * scale, 0, Math.PI * 2);
  ctx.fill();

  // Center star with warm golden glow
  ctx.shadowColor = 'rgba(212, 175, 55, 0.45)';
  ctx.shadowBlur = 6 * scale;
  drawStar8(ctx, cx, cy, 13 * scale);
  ctx.fill();

  // Radiant center dot
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(cx, cy, 2.8 * scale, 0, Math.PI * 2);
  ctx.fillStyle = '#fff6d6';
  ctx.fill();
  ctx.fillStyle = color;

  // Tiny dots around center
  ctx.beginPath();
  ctx.arc(cx - 18 * scale, cy, 2 * scale, 0, Math.PI * 2);
  ctx.arc(cx + 18 * scale, cy, 2 * scale, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Islamic geometric grid pattern
function drawGeometricPattern(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string,
  scale: number,
  type: string
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;

  if (type === 'geometric') {
    const step = 96 * scale;
    ctx.lineWidth = 0.9 * scale;
    ctx.globalAlpha = 0.065;

    for (let x = 0; x < width + step; x += step) {
      for (let y = 0; y < height + step; y += step) {
        drawStar8(ctx, x, y, step * 0.36);
        ctx.stroke();

        // Inner delicate octagram accent
        ctx.beginPath();
        ctx.arc(x, y, step * 0.14, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x + step / 2, y + step / 2, 2.5 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (type === 'arabesque') {
    const step = 120 * scale;
    ctx.lineWidth = 1.2 * scale;
    ctx.globalAlpha = 0.06;

    for (let x = 0; x < width + step; x += step) {
      for (let y = 0; y < height + step; y += step) {
        ctx.beginPath();
        ctx.arc(x, y, step * 0.35, 0, Math.PI * 2);
        ctx.arc(x + step / 2, y + step / 2, step * 0.35, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  } else if (type === 'stars') {
    const step = 80 * scale;
    ctx.globalAlpha = 0.09;
    for (let x = 40 * scale; x < width; x += step) {
      for (let y = 40 * scale; y < height; y += step) {
        drawStar8(ctx, x, y, 6 * scale);
        ctx.fill();
      }
    }
  } else if (type === 'subtle') {
    const step = 40 * scale;
    ctx.lineWidth = 0.5 * scale;
    ctx.globalAlpha = 0.04;
    for (let x = 0; x <= width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  ctx.restore();
}

// Background painter for presets
function drawBackgroundTheme(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  themeId: string,
  accentColor: string
) {
  const k = width / 1080;
  if (themeId === 'golden') {
    // Deep dark charcoal and midnight blue gradient background
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#111723');
    grad.addColorStop(0.45, '#0b1018');
    grad.addColorStop(1, '#05070c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Warm golden ambient radial glow in the center
    const radial = ctx.createRadialGradient(
      width / 2,
      height * 0.45,
      25 * k,
      width / 2,
      height * 0.45,
      width * 0.72
    );
    radial.addColorStop(0, 'rgba(212, 175, 55, 0.16)');
    radial.addColorStop(0.5, 'rgba(180, 140, 40, 0.05)');
    radial.addColorStop(1, 'rgba(0, 0, 0, 0.42)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);
  } else if (themeId === 'emerald') {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#0c3829');
    grad.addColorStop(0.5, '#07241a');
    grad.addColorStop(1, '#02120d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const radial = ctx.createRadialGradient(
      width / 2,
      height * 0.35,
      60 * k,
      width / 2,
      height * 0.5,
      width * 0.7
    );
    radial.addColorStop(0, 'rgba(212, 175, 55, 0.18)');
    radial.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);
  } else if (themeId === 'black') {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#1c1713');
    grad.addColorStop(0.4, '#100d0a');
    grad.addColorStop(1, '#050403');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const radial = ctx.createRadialGradient(
      width / 2,
      height * 0.4,
      40 * k,
      width / 2,
      height * 0.45,
      width * 0.65
    );
    radial.addColorStop(0, 'rgba(229, 184, 66, 0.22)');
    radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);
  } else if (themeId === 'classic') {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#fcf7ec');
    grad.addColorStop(0.5, '#f4ebd8');
    grad.addColorStop(1, '#e3d2b7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Vignette
    const vig = ctx.createRadialGradient(
      width / 2,
      height / 2,
      width * 0.3,
      width / 2,
      height / 2,
      width * 0.8
    );
    vig.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    vig.addColorStop(1, 'rgba(102, 63, 24, 0.15)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, width, height);
  } else if (themeId === 'sapphire') {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#15253d');
    grad.addColorStop(0.6, '#0b1624');
    grad.addColorStop(1, '#050b14');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const radial = ctx.createRadialGradient(
      width / 2,
      height * 0.35,
      80 * k,
      width / 2,
      height * 0.45,
      width * 0.75
    );
    radial.addColorStop(0, 'rgba(224, 180, 74, 0.2)');
    radial.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);
  } else if (themeId === 'crimson') {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#420f16');
    grad.addColorStop(0.5, '#28070b');
    grad.addColorStop(1, '#110204');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const radial = ctx.createRadialGradient(
      width / 2,
      height * 0.4,
      60 * k,
      width / 2,
      height * 0.5,
      width * 0.7
    );
    radial.addColorStop(0, 'rgba(243, 201, 105, 0.22)');
    radial.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);
  } else if (themeId === 'minimal') {
    ctx.fillStyle = '#fbf9f5';
    ctx.fillRect(0, 0, width, height);
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#eee6d8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else if (themeId === 'editorial-paper') {
    const paperCanvas = getEditorialPaperCanvas(width, height);
    ctx.drawImage(paperCanvas, 0, 0, width, height);
  } else if (themeId === 'nokia') {
    ctx.fillStyle = '#a2bf75';
    ctx.fillRect(0, 0, width, height);
    // Scanline effect
    ctx.fillStyle = 'rgba(0, 40, 0, 0.06)';
    const scanStep = 4 * k;
    for (let y = 0; y < height; y += scanStep * 2) {
      ctx.fillRect(0, y, width, scanStep);
    }
  } else {
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, width, height);
  }
}

// Border Styles
function drawBorders(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  style: BorderStyle,
  color: string,
  scale: number
) {
  if (style === 'none') return;

  ctx.save();
  ctx.strokeStyle = color;

  if (style === 'simple') {
    ctx.lineWidth = 3 * scale;
    ctx.strokeRect(width * 0.04, width * 0.04, width * 0.92, height - width * 0.08);
  } else if (style === 'double') {
    // Metallic gold sheen gradient along border diagonal
    const borderGrad = ctx.createLinearGradient(0, 0, width, height);
    borderGrad.addColorStop(0, color);
    borderGrad.addColorStop(0.28, '#f8e49c');
    borderGrad.addColorStop(0.5, color);
    borderGrad.addColorStop(0.75, '#f9e69b');
    borderGrad.addColorStop(1, color);

    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 2.4 * scale;
    ctx.strokeRect(width * 0.034, width * 0.034, width * 0.932, height - width * 0.068);
    ctx.lineWidth = 1.15 * scale;
    ctx.globalAlpha = 0.88;
    ctx.strokeRect(width * 0.047, width * 0.047, width * 0.906, height - width * 0.094);
  } else if (style === 'ornate') {
    ctx.lineWidth = 3.5 * scale;
    const inset1 = width * 0.035;
    ctx.strokeRect(inset1, inset1, width - inset1 * 2, height - inset1 * 2);

    ctx.lineWidth = 1.5 * scale;
    ctx.setLineDash([8 * scale, 6 * scale]);
    const inset2 = width * 0.047;
    ctx.strokeRect(inset2, inset2, width - inset2 * 2, height - inset2 * 2);
    ctx.setLineDash([]);
  } else if (style === 'arch') {
    const m = width * 0.05;
    const topArchY = m + width * 0.08;
    ctx.lineWidth = 3 * scale;

    ctx.beginPath();
    // Rounded / pointed mihrab top
    ctx.moveTo(m, height - m);
    ctx.lineTo(m, topArchY + 60 * scale);
    ctx.quadraticCurveTo(m, topArchY, width / 2, m);
    ctx.quadraticCurveTo(width - m, topArchY, width - m, topArchY + 60 * scale);
    ctx.lineTo(width - m, height - m);
    ctx.closePath();
    ctx.stroke();

    ctx.lineWidth = 1 * scale;
    ctx.globalAlpha = 0.6;
    const m2 = m + 14 * scale;
    const topArchY2 = topArchY + 12 * scale;
    ctx.beginPath();
    ctx.moveTo(m2, height - m2);
    ctx.lineTo(m2, topArchY2 + 50 * scale);
    ctx.quadraticCurveTo(m2, topArchY2, width / 2, m2 + 4 * scale);
    ctx.quadraticCurveTo(width - m2, topArchY2, width - m2, topArchY2 + 50 * scale);
    ctx.lineTo(width - m2, height - m2);
    ctx.closePath();
    ctx.stroke();
  }

  ctx.restore();
}

function drawCorners(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string,
  scale: number
) {
  const o = width * 0.072;
  const r = 21 * scale;
  ctx.save();
  const positions = [
    [o, o],
    [width - o, o],
    [o, height - o],
    [width - o, height - o],
  ];
  positions.forEach(([x, y]) => {
    // Metallic gold gradient for corner star motif
    const starGrad = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
    starGrad.addColorStop(0, '#f9e596');
    starGrad.addColorStop(0.5, color);
    starGrad.addColorStop(1, '#b68923');

    ctx.shadowColor = 'rgba(212, 175, 55, 0.45)';
    ctx.shadowBlur = 8 * scale;
    ctx.fillStyle = starGrad;
    drawStar8(ctx, x, y, r);
    ctx.fill();

    // Inner delicate rosette ring
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 248, 220, 0.65)';
    ctx.lineWidth = 1 * scale;
    drawStar8(ctx, x, y, r * 0.56);
    ctx.stroke();

    // Radiant center jewel dot
    ctx.beginPath();
    ctx.arc(x, y, r * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = '#fff9df';
    ctx.fill();
  });
  ctx.restore();
}

// Text word-wrapper supporting Bengali & Arabic
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const lines: string[] = [];
  const paragraphs = text.split('\n');

  for (const para of paragraphs) {
    if (!para.trim()) {
      lines.push('');
      continue;
    }
    const words = para.trim().split(/\s+/);
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = ctx.measureText(testLine).width;

      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

interface ParagraphLine {
  text: string;
  gapAfter: number;
}

function wrapEditorialParagraphs(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  paragraphGap: number
): ParagraphLine[] {
  const result: ParagraphLine[] = [];
  const rawParagraphs = text.replace(/\r\n/g, '\n').split('\n');
  // Filter blank separator lines into clean paragraph spacing rather than blank rows
  const nonEmptyIndices: number[] = [];
  rawParagraphs.forEach((p, idx) => {
    if (p.trim()) nonEmptyIndices.push(idx);
  });

  nonEmptyIndices.forEach((paraIdx, listPos) => {
    const para = rawParagraphs[paraIdx].trim();
    const words = para.split(/\s+/);
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        result.push({ text: currentLine, gapAfter: 0 });
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      const hasMore = listPos < nonEmptyIndices.length - 1;
      // Slightly larger vertical breathing room if separated by an empty blank line (\n\n)
      const nextIdx = hasMore ? nonEmptyIndices[listPos + 1] : -1;
      const hadBlankLine = hasMore && nextIdx - paraIdx > 1;
      result.push({
        text: currentLine,
        gapAfter: hasMore ? (hadBlankLine ? paragraphGap * 1.25 : paragraphGap) : 0,
      });
    }
  });

  return result;
}

interface BlockItem {
  type: 'bismillah' | 'heading' | 'ar' | 'bn' | 'div' | 'ref';
  lines?: string[];
  paraLines?: ParagraphLine[];
  font?: string;
  lineHeight?: number;
  color?: string;
  dir?: 'ltr' | 'rtl';
  height: number;
}

function getHexLuminance(hex: string): number {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return 180;
  let c = hex.slice(1).trim();
  if (c.length === 3) c = c.split('').map((ch) => ch + ch).join('');
  if (c.length !== 6) return 180;
  const r = parseInt(c.slice(0, 2), 16) || 0;
  const g = parseInt(c.slice(2, 4), 16) || 0;
  const b = parseInt(c.slice(4, 6), 16) || 0;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export async function renderPoster(
  canvas: HTMLCanvasElement,
  poster: PosterConfig,
  brand: BrandConfig,
  options: { scale?: number } = {}
): Promise<void> {
  const [W, H] = SIZES[poster.size] || [1080, 1080];
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const k = W / 1080;
  const isEditorialPaper = poster.theme === 'editorial-paper' || Boolean(poster.editorialMode);
  const fontName = poster.font || (isEditorialPaper ? 'Noto Serif Bengali' : 'Noto Sans Bengali');
  const arFontName = poster.arabicFont || (isEditorialPaper ? 'Amiri' : 'Noto Naskh Arabic');

  // Ensure custom web fonts are fully loaded in memory before rendering to canvas
  try {
    const baseSize = Math.round(poster.fontSize * k);
    const refSize = Math.round(Math.max(baseSize * 0.46, 22 * k));
    await Promise.all([
      document.fonts.load(`700 ${Math.round(28 * k)}px "Cinzel"`),
      document.fonts.load(`400 ${baseSize}px "${fontName}"`),
      document.fonts.load(`500 ${baseSize}px "${fontName}"`),
      document.fonts.load(`600 ${baseSize}px "${fontName}"`),
      document.fonts.load(`700 ${Math.round(baseSize * 1.28)}px "${fontName}"`),
      document.fonts.load(`500 ${refSize}px "${fontName}"`),
      document.fonts.load(`600 ${refSize}px "${fontName}"`),
      document.fonts.load(`700 ${refSize}px "${fontName}"`),
      document.fonts.load(`400 ${Math.round(baseSize * (poster.arabicSizeRatio || 1.2))}px "${arFontName}"`),
      document.fonts.load(`400 ${Math.round(baseSize * (poster.arabicSizeRatio || 1.2))}px "Noto Naskh Arabic"`),
      document.fonts.ready,
    ]);
  } catch (err) {
    console.warn('Font loading check:', err);
  }

  const theme = THEME_PRESETS.find((t) => t.id === poster.theme) || THEME_PRESETS[0];

  const isDarkCanvas =
    !isEditorialPaper &&
    (['golden', 'black', 'emerald', 'sapphire', 'crimson'].includes(poster.theme) ||
      (poster.bgType === 'custom' && (poster.overlay || 0) >= 0.25));

  let primaryText = isEditorialPaper ? '#171512' : poster.textColor || theme.text;
  let accent = isEditorialPaper ? '#171512' : poster.accentColor || theme.accent;
  let arColor = isEditorialPaper ? '#171512' : poster.arabicColor || theme.ar;

  if (isEditorialPaper) {
    // Allow deliberate near-black ink customization while preventing low-contrast pale ink on ivory paper
    if (poster.textColor && getHexLuminance(poster.textColor) < 85) {
      primaryText = poster.textColor;
    }
    if (poster.arabicColor && getHexLuminance(poster.arabicColor) < 85) {
      arColor = poster.arabicColor;
    }
  } else if (isDarkCanvas) {
    // Auto-Contrast Guard: On dark backgrounds, NEVER allow text or Arabic to collapse to dark brown/black!
    if (getHexLuminance(primaryText) < 150) {
      primaryText = '#fffdf5';
    } else if (primaryText.toUpperCase() === '#FFFFFF' && poster.theme === 'golden') {
      primaryText = '#fffdf4';
    }
    if (getHexLuminance(arColor) < 150) {
      arColor = '#fce083';
    }
    if (getHexLuminance(accent) < 110) {
      accent = '#d4af37';
    }
  }

  // 1. Clear & draw background
  ctx.clearRect(0, 0, W, H);
  drawBackgroundTheme(
    ctx,
    W,
    H,
    isEditorialPaper ? 'editorial-paper' : poster.theme,
    accent
  );

  // 2. Custom Background or Pattern (Strictly suppressed in Editorial Natural Paper mode)
  if (!isEditorialPaper) {
    if (poster.bgType === 'custom' && poster.bgDataUrl) {
      const img = await loadImage(poster.bgDataUrl);
      if (img) {
        const ratio = Math.max(W / img.width, H / img.height);
        const nw = img.width * ratio;
        const nh = img.height * ratio;
        const ox = (W - nw) / 2;
        const oy = (H - nh) / 2;

        ctx.save();
        ctx.drawImage(img, ox, oy, nw, nh);
        ctx.fillStyle = `rgba(0, 0, 0, ${poster.overlay})`;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
    } else if (poster.bgPattern !== 'none') {
      drawGeometricPattern(ctx, W, H, accent, k, poster.bgPattern);
    }

    // 3. Borders & Corner Ornaments
    drawBorders(ctx, W, H, poster.borderStyle, accent, k);
    if (poster.decorCorner && poster.borderStyle !== 'none') {
      drawCorners(ctx, W, H, accent, k);
    }
  }

  // Dedicated Minimalist Handmade Textured Paper Editorial Rendering Path
  if (isEditorialPaper) {
    const editorialWidth = Math.round(W * 0.68);
    // Position main text block slightly left of center with generous negative space
    const editorialLeft = Math.round(W * 0.145);
    const topReserved = Math.round(H * 0.13);
    const footerPadRight = Math.round(W * 0.085);
    const footerPadBottom = Math.round(H * 0.075);

    const suppliedPageName =
      (poster.pageHandle ?? '').trim() ||
      (brand.showHandle ? (brand.handle || '').trim() : '');
    const footerReserved = suppliedPageName ? Math.round(H * 0.14) : Math.round(H * 0.12);
    const availableHeight = H - topReserved - footerReserved;

    const buildEditorialLayout = (baseSize: number) => {
      const blockSpacing = baseSize * 0.74;
      const paraGap = baseSize * 0.6;
      const items: BlockItem[] = [];

      // Optional Heading (slightly larger & bold, exact wording)
      if (poster.heading && poster.heading.trim()) {
        const headingSize = Math.round(baseSize * 1.28);
        const headingFont = `700 ${headingSize}px "${fontName}", "Noto Serif Bengali", "Tiro Bangla", serif`;
        const headingLH = headingSize * 1.48;
        ctx.font = headingFont;
        const paraLines = wrapEditorialParagraphs(
          ctx,
          poster.heading.trim(),
          editorialWidth,
          headingSize * 0.45
        );
        const totalH =
          paraLines.length * headingLH +
          paraLines.reduce((acc, pl) => acc + pl.gapAfter, 0);
        items.push({
          type: 'heading',
          paraLines,
          font: headingFont,
          lineHeight: headingLH,
          color: primaryText,
          dir: 'ltr',
          height: totalH,
        });
      }

      // Optional Arabic Text (graceful Arabic typography, proper RTL shaping & diacritics)
      if (poster.showAr && poster.ar && poster.ar.trim()) {
        const arSize = Math.round(baseSize * (poster.arabicSizeRatio || 1.24));
        const arFontStr = `400 ${arSize}px "${arFontName}", "Amiri", "Noto Naskh Arabic", serif`;
        const arLH = arSize * 1.88;
        ctx.font = arFontStr;
        ctx.direction = 'rtl';
        const paraLines = wrapEditorialParagraphs(
          ctx,
          poster.ar.trim(),
          editorialWidth,
          arSize * 0.54
        );
        ctx.direction = 'ltr';
        const totalH =
          paraLines.length * arLH +
          paraLines.reduce((acc, pl) => acc + pl.gapAfter, 0);
        items.push({
          type: 'ar',
          paraLines,
          font: arFontStr,
          lineHeight: arLH,
          color: arColor,
          dir: 'rtl',
          height: totalH,
        });
      }

      // Bengali Body Text (comfortable line & paragraph spacing, exact supplied wording)
      if (poster.bn && poster.bn.trim()) {
        const bnSize = baseSize;
        const bnFontStr = `400 ${bnSize}px "${fontName}", "Noto Serif Bengali", "Tiro Bangla", sans-serif`;
        const bnLH = bnSize * Math.max(poster.lineHeight || 1.72, 1.65);
        ctx.font = bnFontStr;
        const paraLines = wrapEditorialParagraphs(ctx, poster.bn.trim(), editorialWidth, paraGap);
        const totalH =
          paraLines.length * bnLH +
          paraLines.reduce((acc, pl) => acc + pl.gapAfter, 0);
        items.push({
          type: 'bn',
          paraLines,
          font: bnFontStr,
          lineHeight: bnLH,
          color: primaryText,
          dir: 'ltr',
          height: totalH,
        });
      }

      // Optional Reference / Source (exact wording preserved, quiet hierarchy)
      if (poster.ref && poster.ref.trim()) {
        const refSize = Math.round(Math.max(baseSize * 0.72, 22 * k));
        const refFontStr = `500 ${refSize}px "${fontName}", "Noto Serif Bengali", sans-serif`;
        const refLH = refSize * 1.55;
        ctx.font = refFontStr;
        const paraLines = wrapEditorialParagraphs(
          ctx,
          poster.ref.trim(),
          editorialWidth,
          refSize * 0.4
        );
        const totalH =
          paraLines.length * refLH +
          paraLines.reduce((acc, pl) => acc + pl.gapAfter, 0);
        items.push({
          type: 'ref',
          paraLines,
          font: refFontStr,
          lineHeight: refLH,
          color: 'rgba(23, 21, 18, 0.74)',
          dir: 'ltr',
          height: totalH,
        });
      }

      const totalHeight =
        items.reduce((acc, it) => acc + it.height, 0) +
        Math.max(0, items.length - 1) * blockSpacing;

      return { items, blockSpacing, totalHeight };
    };

    let editorialBaseSize = Math.min(poster.fontSize || 44, 72) * k;
    let edLayout = buildEditorialLayout(editorialBaseSize);
    if (poster.autoFit) {
      while (edLayout.totalHeight > availableHeight && editorialBaseSize > 20 * k) {
        editorialBaseSize -= 1.5 * k;
        edLayout = buildEditorialLayout(editorialBaseSize);
      }
    }

    const align = poster.align || 'left';
    const edAlignX =
      align === 'left'
        ? editorialLeft
        : align === 'right'
        ? editorialLeft + editorialWidth
        : Math.round(W * 0.48);

    let currY = topReserved + Math.max(0, (availableHeight - edLayout.totalHeight) / 2);

    ctx.save();
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    // Natural ink absorption without losing crisp letterpress contrast
    ctx.globalAlpha = 0.94;

    edLayout.items.forEach((item, idx) => {
      if (idx > 0) currY += edLayout.blockSpacing;
      ctx.save();
      ctx.font = item.font!;
      ctx.fillStyle = item.color!;
      ctx.direction = item.dir || 'ltr';
      ctx.textAlign = align;

      const lh = item.lineHeight || 48 * k;
      for (const lineObj of item.paraLines || []) {
        ctx.fillText(lineObj.text, edAlignX, currY + lh / 2);
        currY += lh + lineObj.gapAfter;
      }
      ctx.restore();
    });

    // Subtle, readable supplied Facebook Page Name near bottom-right corner
    if (suppliedPageName) {
      const hasBengali = /[\u0980-\u09FF]/.test(suppliedPageName);
      const footerSize = Math.round(Math.max(20 * k, W * 0.02));
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(23, 21, 18, 0.66)';
      ctx.direction = 'ltr';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'alphabetic';
      ctx.font = hasBengali
        ? `500 ${footerSize}px "${fontName}", "Noto Serif Bengali", sans-serif`
        : `500 ${footerSize}px "Noto Serif Bengali", Georgia, serif`;
      ctx.letterSpacing = hasBengali ? '0px' : `${0.4 * k}px`;
      ctx.fillText(suppliedPageName, W - footerPadRight, H - footerPadBottom);
      ctx.restore();
    }

    // Ultra-subtle paper-tooth veil over finished print so ink bonds naturally with paper surface
    try {
      const paperVeil = getEditorialPaperCanvas(W, H);
      ctx.save();
      ctx.globalCompositeOperation = 'soft-light';
      ctx.globalAlpha = 0.24;
      ctx.drawImage(paperVeil, 0, 0, W, H);
      ctx.restore();
    } catch {
      // Ignore if composite op unsupported
    }

    ctx.restore();
    return;
  }

  // 4. Margins & Padding calculation (Standard Ornate / Branded Themes)
  const marginX = W * 0.11;
  const padY = W * 0.085 + (H > 1500 ? 110 * k : 0);

  // 5. Draw Brand Header/Footer
  let topReserved = padY;
  let bottomReserved = H - padY;

  const isBrandTop = !brand.pos.startsWith('bottom');
  const brandAlignment = brand.pos.split('-')[1] as 'left' | 'center' | 'right';

  const logoImg = brand.showLogo && brand.logo ? await loadImage(brand.logo) : null;
  const logoH = brand.showLogo && logoImg ? brand.logoSize * k : 0;
  const logoW = logoImg ? logoH * (logoImg.width / logoImg.height) : 0;

  const nameFontSize = Math.max(brand.logoSize * 0.22 * k, 20 * k);
  const tagFontSize = Math.max(nameFontSize * 0.52, 12 * k);

  const nameH = brand.name ? nameFontSize * 1.3 : 0;
  const tagH = brand.showTag && brand.tagline ? tagFontSize * 1.5 : 0;
  const handleH = brand.showHandle && brand.handle ? tagFontSize * 1.4 : 0;

  let totalBrandHeight = 0;
  if (brandAlignment === 'center') {
    totalBrandHeight = logoH + nameH + tagH + handleH + (logoH ? 12 * k : 0);
  } else {
    totalBrandHeight = Math.max(logoH, nameH + tagH + handleH);
  }

  // Render Brand Block
  if (totalBrandHeight > 0) {
    ctx.save();
    ctx.fillStyle = accent;
    const startY = isBrandTop ? padY : H - padY - totalBrandHeight;

    if (brandAlignment === 'center') {
      let curY = startY;
      if (logoImg && brand.showLogo) {
        ctx.drawImage(logoImg, (W - logoW) / 2, curY, logoW, logoH);
        curY += logoH + 12 * k;
      }
      if (brand.name) {
        if (isDarkCanvas) {
          const brandGrad = ctx.createLinearGradient(W * 0.35, curY, W * 0.65, curY + nameFontSize);
          brandGrad.addColorStop(0, '#f9e69b');
          brandGrad.addColorStop(0.5, '#d4af37');
          brandGrad.addColorStop(1, '#fce9a4');
          ctx.fillStyle = brandGrad;
          ctx.shadowColor = 'rgba(212, 175, 55, 0.4)';
          ctx.shadowBlur = 6 * k;
        } else {
          ctx.fillStyle = accent;
          ctx.shadowBlur = 0;
        }
        ctx.font = `700 ${nameFontSize}px "Cinzel", "Noto Serif Bengali", "${fontName}", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.letterSpacing = `${3.5 * k}px`;
        ctx.fillText(brand.name, W / 2, curY);
        ctx.shadowBlur = 0;
        curY += nameH;
      }
      if (brand.showTag && brand.tagline) {
        ctx.fillStyle = isDarkCanvas ? '#e5d4b3' : primaryText;
        ctx.globalAlpha = isDarkCanvas ? 0.92 : 0.78;
        ctx.font = `600 ${tagFontSize}px "${fontName}", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.letterSpacing = `${2 * k}px`;
        ctx.fillText(brand.tagline, W / 2, curY);
        ctx.globalAlpha = 1;
        curY += tagH;
      }
      if (brand.showHandle && brand.handle) {
        ctx.font = `400 ${tagFontSize * 0.9}px "${fontName}", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.78;
        ctx.fillText(brand.handle, W / 2, curY);
        ctx.globalAlpha = 1;
      }
    } else {
      // Left or Right aligned
      const isLeft = brandAlignment === 'left';
      const anchorX = isLeft ? marginX : W - marginX;
      let textX = anchorX;

      if (logoImg && brand.showLogo) {
        const logoX = isLeft ? anchorX : anchorX - logoW;
        ctx.drawImage(logoImg, logoX, startY + (totalBrandHeight - logoH) / 2, logoW, logoH);
        textX = isLeft ? anchorX + logoW + 16 * k : anchorX - logoW - 16 * k;
      }

      ctx.textAlign = isLeft ? 'left' : 'right';
      ctx.textBaseline = 'top';
      const textBlockHeight = nameH + tagH + handleH;
      let textY = startY + (totalBrandHeight - textBlockHeight) / 2;

      if (brand.name) {
        ctx.font = `700 ${nameFontSize}px "${fontName}", "Noto Sans Bengali", sans-serif`;
        ctx.letterSpacing = `${2 * k}px`;
        ctx.fillText(brand.name, textX, textY);
        textY += nameH;
      }
      if (brand.showTag && brand.tagline) {
        ctx.font = `500 ${tagFontSize}px "${fontName}", "Noto Sans Bengali", sans-serif`;
        ctx.letterSpacing = `${1 * k}px`;
        ctx.globalAlpha = 0.85;
        ctx.fillText(brand.tagline, textX, textY);
        textY += tagH;
        ctx.globalAlpha = 1;
      }
      if (brand.showHandle && brand.handle) {
        ctx.font = `400 ${tagFontSize * 0.9}px "${fontName}", "Noto Sans Bengali", sans-serif`;
        ctx.globalAlpha = 0.7;
        ctx.fillText(brand.handle, textX, textY);
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();

    if (isBrandTop) {
      topReserved += totalBrandHeight + 36 * k;
    } else {
      bottomReserved -= totalBrandHeight + 36 * k;
    }
  }

  // Watermark credit at bottom if enabled
  if (brand.watermark && isBrandTop) {
    ctx.save();
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.7;
    ctx.font = `500 ${11 * k}px "Noto Sans Bengali", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = `${2 * k}px`;
    const watermarkY = H - (W * 0.048 + 16 * k);
    ctx.fillText(`${brand.name} • ${brand.handle || 'ISLAMIC MEDIA'}`, W / 2, watermarkY);
    ctx.restore();
    bottomReserved -= 28 * k;
  }

  // 6. Layout Main Content
  const maxContentWidth = W - marginX * 2;
  const availableContentHeight = bottomReserved - topReserved;

  // Function to build content layout given a base font size
  const buildLayout = (baseSize: number) => {
    const spacing = baseSize * 0.45;
    const items: BlockItem[] = [];

    // Bismillah
    if (poster.showBismillah) {
      const bismSize = Math.max(baseSize * 0.65, 24 * k);
      ctx.font = `400 ${bismSize}px "${arFontName}", "Noto Naskh Arabic", "Amiri", serif`;
      items.push({
        type: 'bismillah',
        lines: [BISMILLAH_TEXT],
        font: `400 ${bismSize}px "${arFontName}", "Noto Naskh Arabic", "Amiri", serif`,
        lineHeight: bismSize * 1.6,
        color: accent,
        dir: 'rtl',
        height: bismSize * 1.6,
      });
    }

    // Optional Heading
    if (poster.heading && poster.heading.trim()) {
      const headingSize = Math.round(baseSize * 1.18);
      const headingFontStr = `700 ${headingSize}px "${fontName}", "Noto Sans Bengali", sans-serif`;
      ctx.font = headingFontStr;
      const headingLines = wrapText(ctx, poster.heading.trim(), maxContentWidth);
      items.push({
        type: 'heading',
        lines: headingLines,
        font: headingFontStr,
        lineHeight: headingSize * 1.38,
        color: accent,
        dir: 'ltr',
        height: headingLines.length * (headingSize * 1.38),
      });
    }

    // Arabic text
    if (poster.showAr && poster.ar && poster.ar.trim()) {
      const arSize = baseSize * (poster.arabicSizeRatio || 1.15);
      const fontStr = `400 ${arSize}px "${arFontName}", "Noto Naskh Arabic", "Amiri", serif`;
      ctx.font = fontStr;
      ctx.direction = 'rtl';
      const lines = wrapText(ctx, poster.ar.trim(), maxContentWidth);
      ctx.direction = 'ltr';
      items.push({
        type: 'ar',
        lines,
        font: fontStr,
        lineHeight: arSize * 1.75,
        color: arColor,
        dir: 'rtl',
        height: lines.length * (arSize * 1.75),
      });
    }

    // Bengali main text
    const bnSize = baseSize;
    const bnFontStr = `600 ${bnSize}px "${fontName}", "Noto Sans Bengali", sans-serif`;
    ctx.font = bnFontStr;
    const bnLines = wrapText(ctx, poster.bn || '', maxContentWidth);
    items.push({
      type: 'bn',
      lines: bnLines,
      font: bnFontStr,
      lineHeight: bnSize * (poster.lineHeight || 1.5),
      color: primaryText,
      dir: 'ltr',
      height: bnLines.length * (bnSize * (poster.lineHeight || 1.5)),
    });

    // Divider & Reference
    const hasRef = Boolean(poster.ref && poster.ref.trim());
    let refItem: BlockItem | null = null;
    let divItem: BlockItem | null = null;

    if (poster.decorDivider) {
      divItem = {
        type: 'div',
        height: baseSize * 0.8,
      };
    }

    if (hasRef) {
      const refSize = Math.max(baseSize * 0.48, 22 * k);
      const refFontStr = `600 ${refSize}px "${fontName}", "Noto Sans Bengali", sans-serif`;
      ctx.font = refFontStr;
      const refLines = wrapText(ctx, `— ${poster.ref.trim()} —`, maxContentWidth);
      refItem = {
        type: 'ref',
        lines: refLines,
        font: refFontStr,
        lineHeight: refSize * 1.5,
        color: accent,
        dir: 'ltr',
        height: refLines.length * (refSize * 1.5),
      };
    }

    // Compose in chosen order
    let mainSequence: BlockItem[] = [];
    const pinnedBottom: BlockItem[] = [];

    if (poster.refPos === 'bottom' && refItem) {
      if (divItem) pinnedBottom.push(divItem);
      pinnedBottom.push(refItem);
      mainSequence = items;
    } else if (poster.refPos === 'top' && refItem) {
      if (divItem) mainSequence.push(divItem);
      mainSequence.push(refItem);
      mainSequence.push(...items);
    } else {
      // Below text
      mainSequence = [...items];
      if (divItem) mainSequence.push(divItem);
      if (refItem) mainSequence.push(refItem);
    }

    const calcHeight = (arr: BlockItem[]) =>
      arr.reduce((acc, curr) => acc + curr.height, 0) +
      Math.max(0, arr.length - 1) * spacing;

    const totalHeight =
      calcHeight(mainSequence) + (pinnedBottom.length ? calcHeight(pinnedBottom) + spacing * 2 : 0);

    return { mainSequence, pinnedBottom, spacing, totalHeight };
  };

  // Determine ideal font size (auto-fit if enabled)
  let currentBaseSize = poster.fontSize * k;
  let layout = buildLayout(currentBaseSize);

  if (poster.autoFit) {
    while (layout.totalHeight > availableContentHeight && currentBaseSize > 18 * k) {
      currentBaseSize -= 2 * k;
      layout = buildLayout(currentBaseSize);
    }
  }

  // 7. Paint the Text & Ornaments
  const alignX =
    poster.align === 'left'
      ? marginX
      : poster.align === 'right'
      ? W - marginX
      : W / 2;

  ctx.save();
  ctx.textAlign = poster.align;
  ctx.textBaseline = 'middle';

  // Subtle drop shadow if on custom photo
  if (poster.bgType === 'custom' && poster.bgDataUrl) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 12 * k;
    ctx.shadowOffsetY = 3 * k;
  }

  // Draw Sequence helper
  const drawBlockSequence = (seq: BlockItem[], startY: number) => {
    let currY = startY;
    for (let i = 0; i < seq.length; i++) {
      const item = seq[i];
      if (i > 0) currY += layout.spacing;

      if (item.type === 'div') {
        drawDivider(ctx, W / 2, currY + item.height / 2, Math.min(maxContentWidth, 340 * k), accent, k);
        currY += item.height;
        continue;
      }

      ctx.save();
      ctx.font = item.font!;
      ctx.fillStyle = item.color!;
      ctx.direction = item.dir || 'ltr';

      if (item.type === 'bismillah') {
        ctx.shadowColor = isDarkCanvas ? 'rgba(241, 206, 104, 0.45)' : 'transparent';
        ctx.shadowBlur = isDarkCanvas ? 8 * k : 0;
      } else if (item.type === 'ar') {
        ctx.shadowColor = isDarkCanvas ? 'rgba(250, 219, 127, 0.45)' : 'transparent';
        ctx.shadowBlur = isDarkCanvas ? 12 * k : 0;
      } else if (item.type === 'bn' || item.type === 'heading') {
        ctx.shadowColor = isDarkCanvas ? 'rgba(0, 0, 0, 0.75)' : 'transparent';
        ctx.shadowBlur = isDarkCanvas ? 6 * k : 0;
      } else if (item.type === 'ref') {
        ctx.shadowBlur = 0;
        ctx.letterSpacing = `${1.5 * k}px`;
      }

      for (const line of item.lines || []) {
        ctx.fillText(line, alignX, currY + (item.lineHeight || 40) / 2);
        currY += item.lineHeight || 40;
      }
      ctx.restore();
    }
  };

  const pinnedHeight = layout.pinnedBottom.length
    ? layout.pinnedBottom.reduce((acc, it) => acc + it.height, 0) + (layout.pinnedBottom.length - 1) * layout.spacing
    : 0;

  const freeSpace = availableContentHeight - (pinnedHeight ? pinnedHeight + layout.spacing * 2 : 0);
  const mainHeight = layout.mainSequence.reduce((acc, it) => acc + it.height, 0) + (layout.mainSequence.length - 1) * layout.spacing;

  // Center vertically in free space
  const mainStartY = topReserved + Math.max(0, (freeSpace - mainHeight) / 2);
  drawBlockSequence(layout.mainSequence, mainStartY);

  if (layout.pinnedBottom.length > 0) {
    const pinnedStartY = bottomReserved - pinnedHeight;
    drawBlockSequence(layout.pinnedBottom, pinnedStartY);
  }

  ctx.restore();
}

/**
 * Generate a data URL thumbnail of a given canvas.
 */
export function generateThumbnail(canvas: HTMLCanvasElement, width = 360): string {
  const thumbCanvas = document.createElement('canvas');
  const height = Math.round((width * canvas.height) / canvas.width);
  thumbCanvas.width = width;
  thumbCanvas.height = height;
  const tCtx = thumbCanvas.getContext('2d');
  if (tCtx) {
    tCtx.drawImage(canvas, 0, 0, width, height);
  }
  return thumbCanvas.toDataURL('image/jpeg', 0.82);
}

/**
 * Trigger browser file download from Blob.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
