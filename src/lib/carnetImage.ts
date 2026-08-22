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

  const nombreInstitucion = escapeXml(
    (institucion.nombre || "Institución Educativa").toUpperCase()
  );
  const procesoElectoral = escapeXml(institucion.proceso_electoral || "Proceso Electoral");
  const textX = logoDataUri ? 46 * SCALE : cx;
  const anchor = logoDataUri ? "start" : "middle";

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
    <text x="${textX}" y="${26 * SCALE}" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="${8 * SCALE}" fill="#ffffff" text-anchor="${anchor}">${nombreInstitucion}</text>
    <text x="${textX}" y="${40 * SCALE}" font-family="Helvetica, Arial, sans-serif" font-size="${7 * SCALE}" fill="#d9e6ff" text-anchor="${anchor}">${procesoElectoral}</text>
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
