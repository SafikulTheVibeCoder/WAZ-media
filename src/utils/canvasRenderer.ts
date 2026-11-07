import { PosterConfig, BrandConfig, AspectRatio, ThemeConfig, BorderStyle } from '../types';
import { THEME_PRESETS } from '../data/quotes';

const SIZES: Record<AspectRatio, [number, number]> = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1080x1920': [1080, 1920],
  '1200x630': [1200, 630],
};

const BISMILLAH_TEXT = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';

// Cache loaded images
const imageCache = new Map<string, HTMLImageElement>();

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

// Intricate decorative divider
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
  ctx.lineWidth = Math.max(1, 2.5 * scale);
  ctx.globalAlpha = 0.85;

  const half = width / 2;
  const centerGap = 32 * scale;

  // Left & right lines with diamond taper
  ctx.beginPath();
  ctx.moveTo(cx - half, cy);
  ctx.lineTo(cx - centerGap, cy);
  ctx.moveTo(cx + centerGap, cy);
  ctx.lineTo(cx + half, cy);
  ctx.stroke();

  // Small accents on ends
  ctx.beginPath();
  ctx.arc(cx - half, cy, 3 * scale, 0, Math.PI * 2);
  ctx.arc(cx + half, cy, 3 * scale, 0, Math.PI * 2);
  ctx.fill();

  // Center star
  drawStar8(ctx, cx, cy, 14 * scale);
  ctx.fill();

  // Tiny dots around center
  ctx.beginPath();
  ctx.arc(cx - 20 * scale, cy, 2.5 * scale, 0, Math.PI * 2);
  ctx.arc(cx + 20 * scale, cy, 2.5 * scale, 0, Math.PI * 2);
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
    const step = 90 * scale;
    ctx.lineWidth = 1 * scale;
    ctx.globalAlpha = 0.08;

    for (let x = 0; x < width + step; x += step) {
      for (let y = 0; y < height + step; y += step) {
        drawStar8(ctx, x, y, step * 0.38);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x + step / 2, y + step / 2, 4 * scale, 0, Math.PI * 2);
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
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#fef1c8');
    grad.addColorStop(0.35, '#ebd189');
    grad.addColorStop(0.75, '#c99b3a');
    grad.addColorStop(1, '#9f7020');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Warm radial glow
    const radial = ctx.createRadialGradient(
      width / 2,
      height * 0.4,
      50 * k,
      width / 2,
      height * 0.4,
      width * 0.85
    );
    radial.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    radial.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
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
    ctx.lineWidth = 4 * scale;
    ctx.strokeRect(width * 0.035, width * 0.035, width * 0.93, height - width * 0.07);
    ctx.lineWidth = 1.5 * scale;
    ctx.globalAlpha = 0.75;
    ctx.strokeRect(width * 0.048, width * 0.048, width * 0.904, height - width * 0.096);
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
  const o = width * 0.075;
  const r = 24 * scale;
  ctx.save();
  ctx.fillStyle = color;
  const positions = [
    [o, o],
    [width - o, o],
    [o, height - o],
    [width - o, height - o],
  ];
  positions.forEach(([x, y]) => {
    drawStar8(ctx, x, y, r);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, r * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fill();
    ctx.fillStyle = color;
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

interface BlockItem {
  type: 'bismillah' | 'ar' | 'bn' | 'div' | 'ref';
  lines?: string[];
  font?: string;
  lineHeight?: number;
  color?: string;
  dir?: 'ltr' | 'rtl';
  height: number;
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
  const theme = THEME_PRESETS.find((t) => t.id === poster.theme) || THEME_PRESETS[0];

  const primaryText = poster.textColor || theme.text;
  const accent = poster.accentColor || theme.accent;
  const arColor = poster.arabicColor || theme.ar;

  // 1. Clear & draw background
  ctx.clearRect(0, 0, W, H);
  drawBackgroundTheme(ctx, W, H, poster.theme, accent);

  // 2. Custom Background or Pattern
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
      // Dark overlay
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

  // 4. Margins & Padding calculation
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
        ctx.font = `700 ${nameFontSize}px "Hind Siliguri", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.letterSpacing = `${3 * k}px`;
        ctx.fillText(brand.name, W / 2, curY);
        curY += nameH;
      }
      if (brand.showTag && brand.tagline) {
        ctx.font = `500 ${tagFontSize}px "Hind Siliguri", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.letterSpacing = `${1.5 * k}px`;
        ctx.globalAlpha = 0.85;
        ctx.fillText(brand.tagline, W / 2, curY);
        curY += tagH;
        ctx.globalAlpha = 1;
      }
      if (brand.showHandle && brand.handle) {
        ctx.font = `400 ${tagFontSize * 0.9}px "Hind Siliguri", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.globalAlpha = 0.7;
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
        ctx.font = `700 ${nameFontSize}px "Hind Siliguri", sans-serif`;
        ctx.letterSpacing = `${2 * k}px`;
        ctx.fillText(brand.name, textX, textY);
        textY += nameH;
      }
      if (brand.showTag && brand.tagline) {
        ctx.font = `500 ${tagFontSize}px "Hind Siliguri", sans-serif`;
        ctx.letterSpacing = `${1 * k}px`;
        ctx.globalAlpha = 0.85;
        ctx.fillText(brand.tagline, textX, textY);
        textY += tagH;
        ctx.globalAlpha = 1;
      }
      if (brand.showHandle && brand.handle) {
        ctx.font = `400 ${tagFontSize * 0.9}px "Hind Siliguri", sans-serif`;
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
    ctx.globalAlpha = 0.5;
    ctx.font = `500 ${14 * k}px "Hind Siliguri", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.letterSpacing = `${2 * k}px`;
    ctx.fillText(`${brand.name} • ${brand.handle || 'ISLAMIC MEDIA'}`, W / 2, H - padY * 0.5);
    ctx.restore();
    bottomReserved -= 24 * k;
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
      ctx.font = `400 ${bismSize}px "Noto Naskh Arabic", "Amiri", serif`;
      items.push({
        type: 'bismillah',
        lines: [BISMILLAH_TEXT],
        font: `400 ${bismSize}px "Noto Naskh Arabic", "Amiri", serif`,
        lineHeight: bismSize * 1.6,
        color: accent,
        dir: 'rtl',
        height: bismSize * 1.6,
      });
    }

    // Arabic text
    if (poster.showAr && poster.ar && poster.ar.trim()) {
      const arSize = baseSize * (poster.arabicSizeRatio || 1.15);
      const fontStr = `400 ${arSize}px "Noto Naskh Arabic", "Amiri", serif`;
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
    const bnFontStr = `600 ${bnSize}px "${poster.font}", sans-serif`;
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
    let hasRef = Boolean(poster.ref && poster.ref.trim());
    let refItem: BlockItem | null = null;
    let divItem: BlockItem | null = null;

    if (poster.decorDivider) {
      divItem = {
        type: 'div',
        height: baseSize * 0.8,
      };
    }

    if (hasRef) {
      const refSize = Math.max(baseSize * 0.45, 18 * k);
      const refFontStr = `500 ${refSize}px "${poster.font}", sans-serif`;
      ctx.font = refFontStr;
      const refLines = wrapText(ctx, `— ${poster.ref.trim()} —`, maxContentWidth);
      refItem = {
        type: 'ref',
        lines: refLines,
        font: refFontStr,
        lineHeight: refSize * 1.4,
        color: accent,
        dir: 'ltr',
        height: refLines.length * (refSize * 1.4),
      };
    }

    // Compose in chosen order
    let mainSequence: BlockItem[] = [];
    let pinnedBottom: BlockItem[] = [];

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
        drawDivider(ctx, W / 2, currY + item.height / 2, Math.min(maxContentWidth, 360 * k), accent, k);
        currY += item.height;
        continue;
      }

      ctx.font = item.font!;
      ctx.fillStyle = item.color!;
      ctx.direction = item.dir || 'ltr';

      for (const line of item.lines || []) {
        ctx.fillText(line, alignX, currY + (item.lineHeight || 40) / 2);
        currY += item.lineHeight || 40;
      }
      ctx.direction = 'ltr';
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
