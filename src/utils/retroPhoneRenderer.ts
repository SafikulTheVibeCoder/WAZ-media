import { RetroPhonePosterConfig, RetroScreenPresetId } from '../types';

export interface RetroScreenPalette {
  id: RetroScreenPresetId;
  label: string;
  labelEn: string;
  centerHex: string;
  midHex: string;
  outerHex: string;
  edgeHex: string;
  glowRgb: string;
  inkHex: string;
}

export const RETRO_SCREEN_PRESETS: Record<RetroScreenPresetId, RetroScreenPalette> = {
  'amber-classic': {
    id: 'amber-classic',
    label: 'ক্লাসিক অ্যাম্বার (ডিফল্ট)',
    labelEn: 'Classic Amber LCD',
    centerHex: '#FFC21C',
    midHex: '#F7B500',
    outerHex: '#F59F00',
    edgeHex: '#D88200',
    glowRgb: '255, 174, 0',
    inkHex: '#111111',
  },
  'amber-warm': {
    id: 'amber-warm',
    label: 'উষ্ণ গোল্ডেন অ্যাম্বার',
    labelEn: 'Warm Golden Amber',
    centerHex: '#FFB614',
    midHex: '#FFA800',
    outerHex: '#EB8B00',
    edgeHex: '#C76D00',
    glowRgb: '255, 156, 0',
    inkHex: '#111111',
  },
  'amber-bright': {
    id: 'amber-bright',
    label: 'হাই-ব্রাইট ইয়েলো',
    labelEn: 'Bright Backlit Yellow',
    centerHex: '#FFD53D',
    midHex: '#FFC008',
    outerHex: '#F7A500',
    edgeHex: '#DB8A00',
    glowRgb: '255, 200, 24',
    inkHex: '#111111',
  },
  'green-lcd': {
    id: 'green-lcd',
    label: 'ভিন্টেজ গ্রিন এলসিডি',
    labelEn: 'Vintage Monochrome Green',
    centerHex: '#B6D47D',
    midHex: '#A2C167',
    outerHex: '#8AA950',
    edgeHex: '#6B8838',
    glowRgb: '158, 198, 92',
    inkHex: '#111111',
  },
};

export const DEFAULT_RETRO_PHONE_CONFIG: RetroPhonePosterConfig = {
  version: 1,
  text: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا\n\nনিশ্চয়ই কষ্টের সাথেই রয়েছে স্বস্তি। 🌙\n\nPatience brings peace to the heart.',
  time: '10:34',
  bottomTag: 'WAZ MEDIA',
  leftSoftKey: 'Menu',
  rightSoftKey: 'Back',
  screenPreset: 'amber-classic',
  screenBrightness: 1.0,
  screenGlow: 0.55,
  signalLevel: 4,
  batteryLevel: 4,
  showEnvelope: true,
  size: '1080x1080',
  bengaliFont: 'Noto Sans Bengali',
  arabicFont: 'Amiri',
  uiFont: 'Barlow Condensed',
  fontSize: 40,
  lineHeight: 1.48,
  curvature: 1.0,
};

const RETRO_SIZES: Record<'1080x1080' | '1080x1350', [number, number]> = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
};

function adjustHexBrightness(hex: string, factor: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) || 0;
  const g = parseInt(clean.slice(2, 4), 16) || 0;
  const b = parseInt(clean.slice(4, 6), 16) || 0;
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v * factor)));
  return `rgb(${clamp(r)}, ${clamp(g)}, ${clamp(b)})`;
}

let lcdGridPatternTile: HTMLCanvasElement | null = null;
function getLcdDotMatrixTile(): HTMLCanvasElement {
  if (lcdGridPatternTile) return lcdGridPatternTile;
  const tile = document.createElement('canvas');
  tile.width = 4;
  tile.height = 4;
  const tCtx = tile.getContext('2d');
  if (tCtx) {
    tCtx.clearRect(0, 0, 4, 4);
    // Fine retro LCD pixel grid lines
    tCtx.fillStyle = 'rgba(42, 20, 0, 0.085)';
    tCtx.fillRect(0, 0, 1, 4);
    tCtx.fillRect(0, 0, 4, 1);
    // Subtle inner pixel highlight/depth
    tCtx.fillStyle = 'rgba(255, 245, 205, 0.045)';
    tCtx.fillRect(1, 1, 2, 2);
  }
  lcdGridPatternTile = tile;
  return tile;
}

/**
 * Traces a realistic retro feature-phone LCD screen shape:
 * smooth rounded corners paired with subtle barrel curvature on all 4 edges.
 */
function traceCurvedScreenPath(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  r: number,
  bowX: number,
  bowY: number
) {
  ctx.beginPath();
  // Top edge (bowing subtly upward in center)
  ctx.moveTo(sx + r, sy);
  ctx.bezierCurveTo(
    sx + sw * 0.32,
    sy - bowY,
    sx + sw * 0.68,
    sy - bowY,
    sx + sw - r,
    sy
  );
  // Top-right smooth corner
  ctx.quadraticCurveTo(sx + sw, sy, sx + sw, sy + r);

  // Right edge (gentle outward bow)
  ctx.bezierCurveTo(
    sx + sw + bowX,
    sy + sh * 0.33,
    sx + sw + bowX,
    sy + sh * 0.67,
    sx + sw,
    sy + sh - r
  );
  // Bottom-right smooth corner
  ctx.quadraticCurveTo(sx + sw, sy + sh, sx + sw - r, sy + sh);

  // Bottom edge (bowing subtly downward in center)
  ctx.bezierCurveTo(
    sx + sw * 0.68,
    sy + sh + bowY,
    sx + sw * 0.32,
    sy + sh + bowY,
    sx + r,
    sy + sh
  );
  // Bottom-left smooth corner
  ctx.quadraticCurveTo(sx, sy + sh, sx, sy + sh - r);

  // Left edge (gentle outward bow)
  ctx.bezierCurveTo(
    sx - bowX,
    sy + sh * 0.67,
    sx - bowX,
    sy + sh * 0.33,
    sx,
    sy + r
  );
  // Top-left smooth corner
  ctx.quadraticCurveTo(sx, sy, sx + r, sy);
  ctx.closePath();
}

const ARABIC_CHAR_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const BENGALI_CHAR_REGEX = /[\u0980-\u09FF]/;

type RetroLineScript = 'arabic' | 'bengali' | 'latin' | 'blank';

interface WrappedRetroLine {
  text: string;
  script: RetroLineScript;
}

function detectParagraphScript(para: string): RetroLineScript {
  if (!para.trim()) return 'blank';
  const hasAr = ARABIC_CHAR_REGEX.test(para);
  const hasBn = BENGALI_CHAR_REGEX.test(para);
  if (hasAr && !hasBn && !/[A-Za-z]/.test(para)) return 'arabic';
  if (hasAr && !hasBn) return 'arabic';
  if (hasBn) return 'bengali';
  return 'latin';
}

/**
 * Grapheme-safe script-aware word & line wrapper preserving Arabic RTL shaping,
 * Bengali ligatures, English words, emojis, and explicit newlines verbatim.
 */
function wrapRetroTextLines(
  ctx: CanvasRenderingContext2D,
  rawText: string,
  maxWidth: number,
  fontForScript: (script: Exclude<RetroLineScript, 'blank'>) => string
): WrappedRetroLine[] {
  const normalized = rawText.replace(/\r\n/g, '\n');
  const paragraphs = normalized.split('\n');
  const lines: WrappedRetroLine[] = [];

  const splitGraphemes = (str: string): string[] => {
    try {
      const SegmenterCtor = (Intl as unknown as {
        Segmenter?: new (
          locale?: string,
          opts?: { granularity: 'grapheme' }
        ) => { segment: (input: string) => Iterable<{ segment: string }> };
      }).Segmenter;
      if (SegmenterCtor) {
        const seg = new SegmenterCtor('bn', { granularity: 'grapheme' });
        return Array.from(seg.segment(str), (s) => s.segment);
      }
    } catch {
      // Fallback below
    }
    return Array.from(str);
  };

  for (const para of paragraphs) {
    if (para.trim() === '') {
      lines.push({ text: '', script: 'blank' });
      continue;
    }

    const script = detectParagraphScript(para);
    ctx.font = fontForScript(script === 'blank' ? 'latin' : script);
    ctx.direction = script === 'arabic' ? 'rtl' : 'ltr';

    const tokens = para.split(/(\s+)/);
    let currentLine = '';

    for (const token of tokens) {
      if (!token) continue;
      if (/^\s+$/.test(token)) {
        if (currentLine.length > 0) {
          const withSpace = currentLine + token;
          if (ctx.measureText(withSpace).width <= maxWidth) {
            currentLine = withSpace;
          }
        }
        continue;
      }

      const candidate = currentLine ? `${currentLine}${token}` : token;
      if (ctx.measureText(candidate).width <= maxWidth) {
        currentLine = candidate;
      } else {
        if (currentLine.trimEnd()) {
          lines.push({ text: currentLine.trimEnd(), script });
          currentLine = '';
        }
        if (ctx.measureText(token).width > maxWidth) {
          const graphemes = splitGraphemes(token);
          let chunk = '';
          for (const g of graphemes) {
            const testChunk = chunk + g;
            if (ctx.measureText(testChunk).width > maxWidth && chunk) {
              lines.push({ text: chunk, script });
              chunk = g;
            } else {
              chunk = testChunk;
            }
          }
          currentLine = chunk;
        } else {
          currentLine = token;
        }
      }
    }

    if (currentLine.trimEnd().length > 0) {
      lines.push({ text: currentLine.trimEnd(), script });
    }
  }

  return lines;
}

function drawSignalIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  inkColor: string,
  level: number
) {
  ctx.save();
  ctx.fillStyle = inkColor;
  ctx.strokeStyle = inkColor;

  // Classic small retro phone antenna mast on left
  const mastX = x + 4.5 * scale;
  const baseBottom = y + 20 * scale;
  ctx.lineWidth = Math.max(1.8, 2.2 * scale);
  ctx.lineCap = 'square';
  ctx.beginPath();
  ctx.moveTo(mastX, y + 3 * scale);
  ctx.lineTo(mastX, baseBottom);
  // Tiny V-shaped antenna dish at top
  ctx.moveTo(mastX - 4 * scale, y + 2 * scale);
  ctx.lineTo(mastX, y + 7.5 * scale);
  ctx.lineTo(mastX + 4 * scale, y + 2 * scale);
  ctx.stroke();

  // 4 ascending signal strength bars
  const barW = 4.2 * scale;
  const barGap = 2.6 * scale;
  const heights = [6.5, 10.5, 14.5, 18.5];
  const startX = x + 11.5 * scale;

  for (let i = 0; i < 4; i++) {
    const bh = heights[i] * scale;
    const bx = startX + i * (barW + barGap);
    const by = baseBottom - bh;
    ctx.globalAlpha = i < level ? 1 : 0.24;
    ctx.fillRect(bx, by, barW, bh);
  }

  ctx.restore();
}

function drawEnvelopeIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  inkColor: string
) {
  const w = 25 * scale;
  const h = 16.5 * scale;
  const topY = y + 3.5 * scale;

  ctx.save();
  ctx.strokeStyle = inkColor;
  ctx.lineWidth = Math.max(1.8, 2.2 * scale);
  ctx.lineJoin = 'miter';
  ctx.strokeRect(x, topY, w, h);

  // Envelope inner V-flap
  ctx.beginPath();
  ctx.moveTo(x + 0.8 * scale, topY + 0.8 * scale);
  ctx.lineTo(x + w / 2, topY + h * 0.58);
  ctx.lineTo(x + w - 0.8 * scale, topY + 0.8 * scale);
  ctx.stroke();
  ctx.restore();
}

function drawBatteryIcon(
  ctx: CanvasRenderingContext2D,
  rightX: number,
  y: number,
  scale: number,
  inkColor: string,
  level: number
) {
  const nubW = 3.5 * scale;
  const bodyW = 34 * scale;
  const bodyH = 17.5 * scale;
  const bx = rightX - nubW - bodyW;
  const by = y + 3 * scale;

  ctx.save();
  ctx.strokeStyle = inkColor;
  ctx.fillStyle = inkColor;
  ctx.lineWidth = Math.max(1.8, 2.2 * scale);

  // Outer battery casing
  ctx.strokeRect(bx, by, bodyW, bodyH);

  // Right-side positive terminal nub
  const nubH = 8.5 * scale;
  ctx.fillRect(bx + bodyW + 0.5 * scale, by + (bodyH - nubH) / 2, nubW, nubH);

  // 4 internal charge blocks
  const pad = 3.2 * scale;
  const innerW = bodyW - pad * 2;
  const innerH = bodyH - pad * 2;
  const segGap = 2.2 * scale;
  const segW = (innerW - segGap * 3) / 4;

  for (let i = 0; i < 4; i++) {
    ctx.globalAlpha = i < level ? 1 : 0.18;
    const sx = bx + pad + i * (segW + segGap);
    ctx.fillRect(sx, by + pad, segW, innerH);
  }

  ctx.restore();
}

export async function renderRetroPhonePoster(
  canvas: HTMLCanvasElement,
  config: RetroPhonePosterConfig
): Promise<void> {
  const [W, H] = RETRO_SIZES[config.size] || [1080, 1080];
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const k = W / 1080;
  const palette =
    RETRO_SCREEN_PRESETS[config.screenPreset] || RETRO_SCREEN_PRESETS['amber-classic'];
  const brightness = Math.max(0.75, Math.min(1.25, config.screenBrightness || 1.0));
  const glowStrength = Math.max(0, Math.min(1, config.screenGlow ?? 0.55));
  const curvature = Math.max(0.4, Math.min(1.5, config.curvature ?? 1.0));

  const bnFont = config.bengaliFont || 'Noto Sans Bengali';
  const arFont = config.arabicFont || 'Amiri';
  const uiFont = config.uiFont || 'Barlow Condensed';
  const baseBodySize = Math.round((config.fontSize || 40) * k);

  // Ensure Bengali, Arabic, and retro UI fonts are loaded before Canvas2D measurement & painting
  try {
    await Promise.all([
      document.fonts.load(`600 ${Math.round(24 * k)}px "${uiFont}"`),
      document.fonts.load(`700 ${Math.round(24 * k)}px "${uiFont}"`),
      document.fonts.load(`500 ${baseBodySize}px "${bnFont}"`),
      document.fonts.load(`600 ${baseBodySize}px "${bnFont}"`),
      document.fonts.load(`700 ${baseBodySize}px "${bnFont}"`),
      document.fonts.load(`400 ${Math.round(baseBodySize * 1.14)}px "${arFont}"`),
      document.fonts.load(`700 ${Math.round(baseBodySize * 1.14)}px "${arFont}"`),
      document.fonts.load(`500 ${Math.round(baseBodySize * 1.14)}px "Noto Naskh Arabic"`),
      document.fonts.ready,
    ]);
  } catch {
    // Proceed cleanly with loaded fonts
  }

  // 1. Pure black outer background (#000000) — strict: zero stickers/borders/frames
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, H);

  // 2. Centered feature phone screen geometry
  const sw = config.size === '1080x1350' ? Math.round(W * 0.72) : Math.round(W * 0.675);
  const sh = config.size === '1080x1350' ? Math.round(H * 0.635) : Math.round(H * 0.675);
  const sx = Math.round((W - sw) / 2);
  const sy = Math.round((H - sh) / 2);
  const cornerRadius = Math.round(Math.min(sw, sh) * 0.088);
  const bowY = Math.round(sh * 0.024 * curvature);
  const bowX = Math.round(sw * 0.01 * curvature);

  // 3. Subtle realistic ambient LCD glow bleeding gently onto #000000 around screen
  if (glowStrength > 0.01) {
    ctx.save();
    const ambientR = Math.max(sw, sh) * 0.74;
    const ambientGrad = ctx.createRadialGradient(
      W / 2,
      H / 2,
      Math.min(sw, sh) * 0.25,
      W / 2,
      H / 2,
      ambientR
    );
    ambientGrad.addColorStop(0, `rgba(${palette.glowRgb}, ${(0.24 * glowStrength).toFixed(3)})`);
    ambientGrad.addColorStop(0.55, `rgba(${palette.glowRgb}, ${(0.09 * glowStrength).toFixed(3)})`);
    ambientGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = ambientGrad;
    ctx.fillRect(0, 0, W, H);

    // Subtle backlit screen rim glow
    ctx.shadowColor = `rgba(${palette.glowRgb}, ${(0.52 * glowStrength).toFixed(3)})`;
    ctx.shadowBlur = 32 * k * glowStrength;
    ctx.fillStyle = adjustHexBrightness(palette.midHex, brightness);
    traceCurvedScreenPath(ctx, sx, sy, sw, sh, cornerRadius, bowX, bowY);
    ctx.fill();
    ctx.restore();
  }

  // 4. Clip inside curved screen & paint warm amber LCD backlight + soft lighting variation
  ctx.save();
  traceCurvedScreenPath(ctx, sx, sy, sw, sh, cornerRadius, bowX, bowY);
  ctx.clip();

  // Primary radial LCD diffuser lighting
  const lcdGrad = ctx.createRadialGradient(
    W / 2,
    sy + sh * 0.44,
    sw * 0.05,
    W / 2,
    H / 2,
    Math.max(sw, sh) * 0.74
  );
  lcdGrad.addColorStop(0, adjustHexBrightness(palette.centerHex, brightness));
  lcdGrad.addColorStop(0.45, adjustHexBrightness(palette.midHex, brightness));
  lcdGrad.addColorStop(0.84, adjustHexBrightness(palette.outerHex, brightness));
  lcdGrad.addColorStop(1, adjustHexBrightness(palette.edgeHex, brightness));
  ctx.fillStyle = lcdGrad;
  ctx.fillRect(sx - bowX - 10, sy - bowY - 10, sw + bowX * 2 + 20, sh + bowY * 2 + 20);

  // Subtle top-to-bottom natural screen luminance & glass reflection veil
  const sheenGrad = ctx.createLinearGradient(sx, sy - bowY, sx, sy + sh + bowY);
  sheenGrad.addColorStop(0, 'rgba(255, 248, 214, 0.14)');
  sheenGrad.addColorStop(0.28, 'rgba(255, 248, 214, 0.03)');
  sheenGrad.addColorStop(0.75, 'rgba(0, 0, 0, 0.0)');
  sheenGrad.addColorStop(1, 'rgba(85, 38, 0, 0.14)');
  ctx.fillStyle = sheenGrad;
  ctx.fillRect(sx - bowX - 10, sy - bowY - 10, sw + bowX * 2 + 20, sh + bowY * 2 + 20);

  // Very fine retro LCD pixel/grid screen texture
  const dotTile = getLcdDotMatrixTile();
  const matrixPattern = ctx.createPattern(dotTile, 'repeat');
  if (matrixPattern) {
    ctx.save();
    ctx.globalAlpha = 0.62;
    ctx.fillStyle = matrixPattern;
    ctx.fillRect(sx - bowX - 10, sy - bowY - 10, sw + bowX * 2 + 20, sh + bowY * 2 + 20);
    ctx.restore();
  }

  // Soft recessed inner bezel shadow along the curved edges
  ctx.save();
  traceCurvedScreenPath(ctx, sx, sy, sw, sh, cornerRadius, bowX, bowY);
  ctx.strokeStyle = 'rgba(72, 32, 0, 0.24)';
  ctx.lineWidth = 14 * k;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(24, 10, 0, 0.35)';
  ctx.lineWidth = 4 * k;
  ctx.stroke();
  ctx.restore();

  // 5. Top Status Bar (#111111)
  const ink = palette.inkHex;
  const padX = Math.round(sw * 0.088);
  const topBarY = sy + Math.round(sh * 0.068);
  const iconScale = k * 0.96;

  drawSignalIcon(ctx, sx + padX, topBarY, iconScale, ink, config.signalLevel ?? 4);
  if (config.showEnvelope !== false) {
    drawEnvelopeIcon(
      ctx,
      sx + padX + Math.round(44 * k),
      topBarY,
      iconScale,
      ink
    );
  }

  drawBatteryIcon(
    ctx,
    sx + sw - padX,
    topBarY,
    iconScale,
    ink,
    config.batteryLevel ?? 4
  );

  // Editable Digital Time (default "10:34") left of battery
  const timeText = config.time ?? '10:34';
  if (timeText) {
    const timeSize = Math.round(25 * k);
    ctx.save();
    ctx.fillStyle = ink;
    ctx.font = `700 ${timeSize}px "${uiFont}", "Barlow Condensed", "Noto Sans Bengali", sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = `${0.8 * k}px`;
    ctx.fillText(
      timeText,
      sx + sw - padX - Math.round(48 * k),
      topBarY + Math.round(12 * k)
    );
    ctx.restore();
  }

  // 6. Main Center-Aligned Content Block (Bengali, Arabic RTL with diacritics, English, Emojis — exact verbatim text)
  const bodyTop = sy + Math.round(sh * 0.165);
  const bodyBottom = sy + Math.round(sh * 0.845);
  const availableH = bodyBottom - bodyTop;
  const maxTextWidth = Math.round(sw * 0.84);

  const buildFontForScript = (pxSize: number) => (script: Exclude<RetroLineScript, 'blank'>) => {
    if (script === 'arabic') {
      const arPx = Math.round(pxSize * 1.14);
      return `400 ${arPx}px "${arFont}", "Noto Naskh Arabic", "Amiri", "Noto Color Emoji", sans-serif`;
    }
    if (script === 'bengali') {
      return `600 ${pxSize}px "${bnFont}", "${arFont}", "${uiFont}", "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
    }
    return `600 ${pxSize}px "${uiFont}", "${bnFont}", "${arFont}", "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
  };

  let bodyFontSize = Math.min(Math.round((config.fontSize || 40) * k), Math.round(68 * k));
  const minBodySize = Math.round(20 * k);
  const lineRatio = Math.max(1.25, Math.min(1.9, config.lineHeight || 1.48));

  let wrappedLines: WrappedRetroLine[] = [];
  let totalTextH = 0;

  const getLineStep = (ln: WrappedRetroLine, pxSize: number): number => {
    if (ln.script === 'blank') return pxSize * lineRatio * 0.56;
    if (ln.script === 'arabic') return pxSize * 1.14 * Math.max(lineRatio, 1.56);
    return pxSize * lineRatio;
  };

  while (bodyFontSize >= minBodySize) {
    wrappedLines = wrapRetroTextLines(
      ctx,
      config.text || '',
      maxTextWidth,
      buildFontForScript(bodyFontSize)
    );
    totalTextH = wrappedLines.reduce((acc, ln) => acc + getLineStep(ln, bodyFontSize), 0);
    if (totalTextH <= availableH || bodyFontSize === minBodySize) {
      break;
    }
    bodyFontSize -= Math.max(1, Math.round(1.5 * k));
  }

  if (wrappedLines.length > 0) {
    ctx.save();
    ctx.fillStyle = ink;
    ctx.textBaseline = 'middle';

    const emojiRunRegex = /(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)/gu;
    const fontResolver = buildFontForScript(bodyFontSize);
    let cursorY = bodyTop + Math.max(0, (availableH - totalTextH) / 2);

    for (const line of wrappedLines) {
      const stepH = getLineStep(line, bodyFontSize);
      if (line.script === 'blank') {
        cursorY += stepH;
        continue;
      }

      const midY = cursorY + stepH / 2;
      ctx.font = fontResolver(line.script);
      ctx.direction = line.script === 'arabic' ? 'rtl' : 'ltr';

      if (line.script === 'arabic' || !/\p{Extended_Pictographic}/u.test(line.text)) {
        ctx.textAlign = 'center';
        ctx.fillText(line.text, W / 2, midY);
      } else {
        // Draw text segments sharp in #111111 while giving emojis a subtle dark edge lift against amber
        const totalLineW = ctx.measureText(line.text).width;
        let runX = W / 2 - totalLineW / 2;
        ctx.textAlign = 'left';
        const parts = line.text.split(emojiRunRegex);
        for (const part of parts) {
          if (!part) continue;
          const isEmoji = /^\p{Extended_Pictographic}/u.test(part);
          if (isEmoji) {
            ctx.save();
            ctx.shadowColor = 'rgba(17, 17, 17, 0.58)';
            ctx.shadowBlur = 4 * k;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 1 * k;
            ctx.fillText(part, runX, midY);
            ctx.restore();
          } else {
            ctx.fillText(part, runX, midY);
          }
          runX += ctx.measureText(part).width;
        }
      }

      cursorY += stepH;
    }
    ctx.restore();
  }

  // 7. Bottom Soft-Key Bar (#111111, aligned along lower curved edge)
  const bottomEdgeY = sy + Math.round(sh * 0.934);
  const bottomCenterY = bottomEdgeY + Math.round(bowY * 0.25);
  const softKeySize = Math.round(25 * k);
  const tagSize = Math.round(24 * k);

  ctx.save();
  ctx.fillStyle = ink;
  ctx.textBaseline = 'middle';
  ctx.direction = 'ltr';

  // Left soft key ("Menu")
  if (config.leftSoftKey) {
    ctx.font = `700 ${softKeySize}px "${uiFont}", "Barlow Condensed", "Noto Sans Bengali", sans-serif`;
    ctx.textAlign = 'left';
    ctx.letterSpacing = `${0.5 * k}px`;
    ctx.fillText(config.leftSoftKey, sx + padX, bottomEdgeY);
  }

  // Center Page Name (strictly ONLY user's supplied page name; empty -> blank)
  const cleanPageName = (config.bottomTag || '').trim();
  if (cleanPageName) {
    const tagHasArabic = ARABIC_CHAR_REGEX.test(cleanPageName);
    const tagHasBengali = BENGALI_CHAR_REGEX.test(cleanPageName);
    ctx.direction = tagHasArabic ? 'rtl' : 'ltr';
    ctx.font = tagHasArabic
      ? `700 ${tagSize}px "${arFont}", "Noto Naskh Arabic", "${bnFont}", "Noto Color Emoji", sans-serif`
      : tagHasBengali
      ? `700 ${tagSize}px "${bnFont}", "${uiFont}", "Noto Color Emoji", sans-serif`
      : `700 ${tagSize}px "${uiFont}", "${bnFont}", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.letterSpacing = tagHasArabic || tagHasBengali ? '0px' : `${0.6 * k}px`;
    ctx.fillText(cleanPageName, W / 2, bottomCenterY, Math.round(sw * 0.44));
  }

  // Right soft key ("Back")
  if (config.rightSoftKey) {
    ctx.direction = 'ltr';
    ctx.font = `700 ${softKeySize}px "${uiFont}", "Barlow Condensed", "Noto Sans Bengali", sans-serif`;
    ctx.textAlign = 'right';
    ctx.letterSpacing = `${0.5 * k}px`;
    ctx.fillText(config.rightSoftKey, sx + sw - padX, bottomEdgeY);
  }

  ctx.restore();
  ctx.restore(); // End clip
}

export function serializeRetroPhoneConfig(config: RetroPhonePosterConfig): string {
  return JSON.stringify(config, null, 2);
}

export function parseRetroPhoneConfigJson(raw: string): RetroPhonePosterConfig | null {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    const merged: RetroPhonePosterConfig = {
      ...DEFAULT_RETRO_PHONE_CONFIG,
      version: 1,
      text: typeof parsed.text === 'string' ? parsed.text : DEFAULT_RETRO_PHONE_CONFIG.text,
      time: typeof parsed.time === 'string' ? parsed.time : DEFAULT_RETRO_PHONE_CONFIG.time,
      bottomTag:
        typeof parsed.bottomTag === 'string'
          ? parsed.bottomTag
          : DEFAULT_RETRO_PHONE_CONFIG.bottomTag,
      leftSoftKey:
        typeof parsed.leftSoftKey === 'string'
          ? parsed.leftSoftKey
          : DEFAULT_RETRO_PHONE_CONFIG.leftSoftKey,
      rightSoftKey:
        typeof parsed.rightSoftKey === 'string'
          ? parsed.rightSoftKey
          : DEFAULT_RETRO_PHONE_CONFIG.rightSoftKey,
      screenPreset:
        parsed.screenPreset && parsed.screenPreset in RETRO_SCREEN_PRESETS
          ? parsed.screenPreset
          : DEFAULT_RETRO_PHONE_CONFIG.screenPreset,
      screenBrightness:
        typeof parsed.screenBrightness === 'number'
          ? Math.max(0.75, Math.min(1.25, parsed.screenBrightness))
          : DEFAULT_RETRO_PHONE_CONFIG.screenBrightness,
      screenGlow:
        typeof parsed.screenGlow === 'number'
          ? Math.max(0, Math.min(1, parsed.screenGlow))
          : DEFAULT_RETRO_PHONE_CONFIG.screenGlow,
      signalLevel:
        typeof parsed.signalLevel === 'number'
          ? Math.max(1, Math.min(4, Math.round(parsed.signalLevel)))
          : DEFAULT_RETRO_PHONE_CONFIG.signalLevel,
      batteryLevel:
        typeof parsed.batteryLevel === 'number'
          ? Math.max(1, Math.min(4, Math.round(parsed.batteryLevel)))
          : DEFAULT_RETRO_PHONE_CONFIG.batteryLevel,
      showEnvelope:
        typeof parsed.showEnvelope === 'boolean'
          ? parsed.showEnvelope
          : DEFAULT_RETRO_PHONE_CONFIG.showEnvelope,
      size:
        parsed.size === '1080x1350' || parsed.size === '1080x1080'
          ? parsed.size
          : DEFAULT_RETRO_PHONE_CONFIG.size,
      bengaliFont: ['Noto Sans Bengali', 'Hind Siliguri', 'Noto Serif Bengali', 'Anek Bangla'].includes(
        parsed.bengaliFont
      )
        ? parsed.bengaliFont
        : DEFAULT_RETRO_PHONE_CONFIG.bengaliFont,
      arabicFont: ['Amiri', 'Noto Naskh Arabic'].includes(parsed.arabicFont)
        ? parsed.arabicFont
        : DEFAULT_RETRO_PHONE_CONFIG.arabicFont,
      uiFont: ['Barlow Condensed', 'Archivo', 'Noto Sans Bengali'].includes(parsed.uiFont)
        ? parsed.uiFont
        : DEFAULT_RETRO_PHONE_CONFIG.uiFont,
      fontSize:
        typeof parsed.fontSize === 'number'
          ? Math.max(24, Math.min(68, parsed.fontSize))
          : DEFAULT_RETRO_PHONE_CONFIG.fontSize,
      lineHeight:
        typeof parsed.lineHeight === 'number'
          ? Math.max(1.25, Math.min(1.9, parsed.lineHeight))
          : DEFAULT_RETRO_PHONE_CONFIG.lineHeight,
      curvature:
        typeof parsed.curvature === 'number'
          ? Math.max(0.4, Math.min(1.5, parsed.curvature))
          : DEFAULT_RETRO_PHONE_CONFIG.curvature,
    };

    return merged;
  } catch {
    return null;
  }
}
