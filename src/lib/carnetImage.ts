import "server-only";

import QRCode from "qrcode";
import sharp from "sharp";
import type { Elector, Institucion } from "@/lib/types";

const SCALE = 4; // renders at ~4x the point size of the printable card for a crisp JPG
const CARD_WIDTH = 220 * SCALE;
const CARD_HEIGHT = 340 * SCALE;
const HEADER_HEIGHT = 62 * SCALE;

export async function generateQrPng(dni: string): Promise<Buffer> {
  return QRCode.toBuffer(dni, {
    margin: 1,
    width: 300,
    errorCorrectionLevel: "H",
    color: { dark: "#1e3a8a", light: "#ffffff" },
  });
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Rough Helvetica-ish average character width — good enough for wrapping a
// name onto at most two lines in a rendered image (not a print-precision layout).
function estimateWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.55;
}

type TextoAjustado = { lines: string[]; fontSize: number; overflow: boolean };

// Fit `text` into `maxWidth` x `maxLines`: use the largest font size (in card
// units, between `maxSize` and `minSize`) at which the wrapped text fits.
// `charFactor` is the average glyph width in ems — kept conservative so the
// text still fits if the server falls back to a wider font than Helvetica/Arial.
function fitText(
  text: string,
  maxWidth: number,
  maxLines: number,
  maxSize: number,
  minSize: number,
  charFactor: number
): TextoAjustado {
  const words = text.split(/\s+/).filter(Boolean);

  const wrap = (size: number): string[] => {
    const px = size * SCALE;
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length * px * charFactor > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);
    return lines;
  };

  for (let size = maxSize; size >= minSize; size -= 0.25) {
    const lines = wrap(size);
    const fits =
      lines.length <= maxLines &&
      lines.every((l) => l.length * size * SCALE * charFactor <= maxWidth);
    if (fits) return { lines, fontSize: size, overflow: false };
  }

  // Even the smallest size does not fit: keep the first lines, mark overflow so
  // the renderer squeezes each line to the available width instead of cutting it.
  return { lines: wrap(minSize).slice(0, maxLines), fontSize: minSize, overflow: true };
}

function wrapText(text: string, fontSize: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (estimateWidth(candidate, fontSize) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 2);
}

// Fetch + resize the logo once and reuse the data URI across every card —
// refetching per elector would be wasteful for bulk generation.
export async function loadLogoDataUri(institucion: Institucion): Promise<string | null> {
  if (!institucion.logo_url) return null;
  try {
    const res = await fetch(institucion.logo_url);
    if (!res.ok) return null;
    const original = Buffer.from(await res.arrayBuffer());
    const resized = await sharp(original)
      .resize(240, 240, { fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
    return `data:image/png;base64,${resized.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function generateCarnetJpg(
  elector: Elector,
  institucion: Institucion,
  fechaTexto: string,
  logoDataUri: string | null
): Promise<Buffer> {
  const w = CARD_WIDTH;
  const h = CARD_HEIGHT;
  const cx = w / 2;

  const qrPng = await generateQrPng(elector.dni);
  const qrDataUri = `data:image/png;base64,${qrPng.toString("base64")}`;

  // Header text: the institution name (and process name) can be long, so wrap
  // them onto several lines and shrink the font until everything fits inside
  // the header, next to the logo when there is one.
  const textX = logoDataUri ? 46 * SCALE : cx;
  const anchor = logoDataUri ? "start" : "middle";
  const headerTextWidth = logoDataUri ? w - 46 * SCALE - 8 * SCALE : w - 16 * SCALE;

  const nombreAjustado = fitText(
    (institucion.nombre || "Institución Educativa").toUpperCase(),
    headerTextWidth,
    3,
    9,
    4.5,
    0.72 // bold capitals are wide
  );
  const procesoAjustado = fitText(
    institucion.proceso_electoral || "Proceso Electoral",
    headerTextWidth,
    2,
    7,
    4.5,
    0.58
  );

  const nombreLineH = nombreAjustado.fontSize * 1.2;
  const procesoLineH = procesoAjustado.fontSize * 1.2;
  const bloqueAlto =
    nombreAjustado.lines.length * nombreLineH + 3 + procesoAjustado.lines.length * procesoLineH;
  let headerY = (HEADER_HEIGHT / SCALE - bloqueAlto) / 2;

  const headerLineTag = (
    line: string,
    size: number,
    baseline: number,
    bold: boolean,
    fill: string,
    overflow: boolean,
    factor: number
  ) => {
    const squeeze =
      overflow && line.length * size * SCALE * factor > headerTextWidth
        ? ` textLength="${headerTextWidth}" lengthAdjust="spacingAndGlyphs"`
        : "";
    return `<text x="${textX}" y="${baseline * SCALE}" font-family="Helvetica, Arial, sans-serif"${bold ? ' font-weight="700"' : ""} font-size="${size * SCALE}" fill="${fill}" text-anchor="${anchor}"${squeeze}>${escapeXml(line)}</text>`;
  };

  const headerTags: string[] = [];
  for (const line of nombreAjustado.lines) {
    headerTags.push(
      headerLineTag(line, nombreAjustado.fontSize, headerY + nombreAjustado.fontSize * 0.95, true, "#ffffff", nombreAjustado.overflow, 0.72)
    );
    headerY += nombreLineH;
  }
  headerY += 3;
  for (const line of procesoAjustado.lines) {
    headerTags.push(
      headerLineTag(line, procesoAjustado.fontSize, headerY + procesoAjustado.fontSize * 0.95, false, "#d9e6ff", procesoAjustado.overflow, 0.58)
    );
    headerY += procesoLineH;
  }

  // SVG uses a top-left origin (y grows downward) — lay everything out
  // top-to-bottom in that order, unlike the PDF version's bottom-up math.
  const qrSize = 110 * SCALE;
  const qrX = cx - qrSize / 2;
  const labelY = HEADER_HEIGHT + 2 * SCALE + 18 * SCALE;
  const qrY = labelY + 14 * SCALE;

  let cursorY = qrY + qrSize + 24 * SCALE;
  const nombreLines = wrapText(`${elector.nombres} ${elector.apellidos}`, 10 * SCALE, w - 24 * SCALE);
  const nombreTags = nombreLines
    .map((line) => {
      const tag = `<text x="${cx}" y="${cursorY}" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="${10 * SCALE}" fill="#0f172a" text-anchor="middle">${escapeXml(line)}</text>`;
      cursorY += 15 * SCALE;
      return tag;
    })
    .join("\n");

  cursorY += 2 * SCALE;
  const dniY = cursorY;
  cursorY += 18 * SCALE;

  const detalle = [
    elector.grado ? `Grado ${elector.grado}` : "",
    elector.seccion ? `Sec. ${elector.seccion}` : "",
    elector.mesa ? `Mesa ${elector.mesa}` : "",
  ]
    .filter(Boolean)
    .join("   •   ");

  const logoTag = logoDataUri
    ? `<image x="${12 * SCALE}" y="${HEADER_HEIGHT / 2 - 13 * SCALE}" width="${26 * SCALE}" height="${26 * SCALE}" href="${logoDataUri}" />`
    : "";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect x="0" y="0" width="${w}" height="${h}" fill="#ffffff" stroke="#d9dde3" stroke-width="${SCALE}" />
    <rect x="0" y="0" width="${w}" height="${HEADER_HEIGHT}" fill="#1e3a8a" />
    <rect x="0" y="${HEADER_HEIGHT}" width="${w}" height="${2 * SCALE}" fill="#0891b2" />
    ${logoTag}
    ${headerTags.join("\n    ")}
    <text x="${cx}" y="${labelY}" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="${7 * SCALE}" fill="#1e3a8a" text-anchor="middle">CREDENCIAL ELECTORAL</text>
    <image x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" href="${qrDataUri}" />
    ${nombreTags}
    <text x="${cx}" y="${dniY}" font-family="Courier New, monospace" font-size="${9 * SCALE}" fill="#6b7280" text-anchor="middle">${escapeXml(elector.dni)}</text>
    ${detalle ? `<text x="${cx}" y="${cursorY}" font-family="Helvetica, Arial, sans-serif" font-size="${7 * SCALE}" fill="#6b7280" text-anchor="middle">${escapeXml(detalle)}</text>` : ""}
    <line x1="${16 * SCALE}" y1="${h - 20 * SCALE}" x2="${w - 16 * SCALE}" y2="${h - 20 * SCALE}" stroke="#d9dde3" stroke-width="${SCALE}" stroke-dasharray="${2 * SCALE},${2 * SCALE}" />
    <text x="${cx}" y="${h - 10 * SCALE}" font-family="Helvetica, Arial, sans-serif" font-size="${6.5 * SCALE}" fill="#6b7280" text-anchor="middle">${escapeXml(fechaTexto)}</text>
  </svg>`;

  return sharp(Buffer.from(svg)).jpeg({ quality: 92 }).toBuffer();
}
