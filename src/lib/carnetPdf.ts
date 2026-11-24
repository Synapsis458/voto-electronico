import "server-only";

import QRCode from "qrcode";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import type { Elector, Institucion } from "@/lib/types";

// Hoja A4 vertical con 9 carnets (3 columnas x 3 filas). Todo se dibuja en
// vectores (texto, QR y recuadros), así que el PDF es liviano y nítido a
// cualquier resolución de impresión, y no depende de `sharp`.
const A4_W = 595.28;
const A4_H = 841.89;
const MARGEN = 24;
const COLS = 3;
const FILAS = 3;

// El carnet se diseña en un lienzo de 220 x 340 y se escala a la celda.
const DW = 220;
const DH = 340;
const HEADER_H = 62;

const AZUL = rgb(0x1e / 255, 0x3a / 255, 0x8a / 255);
const CIAN = rgb(0x08 / 255, 0x91 / 255, 0xb2 / 255);
const GRIS = rgb(0x6b / 255, 0x72 / 255, 0x80 / 255);
const BORDE = rgb(0xd9 / 255, 0xdd / 255, 0xe3 / 255);
const TINTA = rgb(0x0f / 255, 0x17 / 255, 0x2a / 255);
const CLARO = rgb(0xd9 / 255, 0xe6 / 255, 1);
const BLANCO = rgb(1, 1, 1);

type Fuentes = { normal: PDFFont; negrita: PDFFont; mono: PDFFont };

// Las fuentes estándar del PDF solo cubren Latin-1 (tildes y ñ sí): se
// descartan los caracteres que no pueden codificarse para no romper el archivo.
function seguro(texto: string): string {
  return texto.replace(/[^\x20-\x7E\xA0-\xFF•]/g, "").replace(/\s+/g, " ").trim();
}

function envolver(texto: string, font: PDFFont, size: number, ancho: number): string[] {
  const lineas: string[] = [];
  let actual = "";
  for (const palabra of texto.split(" ").filter(Boolean)) {
    const candidata = actual ? `${actual} ${palabra}` : palabra;
    if (actual && font.widthOfTextAtSize(candidata, size) > ancho) {
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = candidata;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

// Mayor tamaño de letra (hasta `max`) con el que el texto cabe en `maxLineas`
// líneas de `ancho`; si hace falta, reduce hasta que todo quepa.
function ajustar(
  texto: string,
  font: PDFFont,
  ancho: number,
  maxLineas: number,
  max: number
): { lineas: string[]; size: number } {
  for (let size = max; size >= 2; size -= 0.25) {
    const lineas = envolver(texto, font, size, ancho);
    const cabe =
      lineas.length <= maxLineas && lineas.every((l) => font.widthOfTextAtSize(l, size) <= ancho);
    if (cabe) return { lineas, size };
  }
  return { lineas: envolver(texto, font, 2, ancho).slice(0, maxLineas), size: 2 };
}

type Logo = { image: PDFImage } | null;

// Incrusta el logo una sola vez; se reutiliza en todos los carnets.
async function incrustarLogo(pdf: PDFDocument, institucion: Institucion): Promise<Logo> {
  if (!institucion.logo_url) return null;
  try {
    const res = await fetch(institucion.logo_url);
    if (!res.ok) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());

    if (bytes[0] === 0x89 && bytes[1] === 0x50) return { image: await pdf.embedPng(bytes) };
    if (bytes[0] === 0xff && bytes[1] === 0xd8) return { image: await pdf.embedJpg(bytes) };

    // Otro formato (WebP, etc.): convertirlo a PNG si `sharp` está disponible.
    const { default: sharp } = await import("sharp");
    const png = await sharp(Buffer.from(bytes))
      .resize(400, 400, { fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
    return { image: await pdf.embedPng(new Uint8Array(png)) };
  } catch {
    return null;
  }
}

function dibujarCarnet(
  page: PDFPage,
  f: Fuentes,
  logo: Logo,
  elector: Elector,
  institucion: Institucion,
  fechaTexto: string,
  x0: number,
  yTop: number,
  s: number
) {
  // Convierte coordenadas del diseño (origen arriba-izquierda) a las del PDF.
  const X = (x: number) => x0 + x * s;
  const Y = (y: number) => yTop - y * s;
  const rect = (x: number, y: number, w: number, h: number, color: ReturnType<typeof rgb>) =>
    page.drawRectangle({ x: X(x), y: Y(y + h), width: w * s, height: h * s, color });

  const centrado = (texto: string, y: number, font: PDFFont, size: number, color: ReturnType<typeof rgb>) => {
    const w = font.widthOfTextAtSize(texto, size);
    page.drawText(texto, { x: X(DW / 2) - (w * s) / 2, y: Y(y), size: size * s, font, color });
  };

  // Fondo y borde.
  page.drawRectangle({
    x: X(0),
    y: Y(DH),
    width: DW * s,
    height: DH * s,
    color: BLANCO,
    borderColor: BORDE,
    borderWidth: 1,
  });

  // Encabezado.
  rect(0, 0, DW, HEADER_H, AZUL);
  rect(0, HEADER_H, DW, 2, CIAN);

  const ancho = logo ? DW - 46 - 8 : DW - 16;
  const inicioX = logo ? 46 : DW / 2;

  if (logo) {
    page.drawImage(logo.image, {
      x: X(12),
      y: Y(HEADER_H / 2 + 13),
      width: 26 * s,
      height: 26 * s,
    });
  }

  const nombreInst = ajustar(
    seguro(institucion.nombre || "Institución Educativa").toUpperCase(),
    f.negrita,
    ancho,
    3,
    9
  );
  const proceso = ajustar(seguro(institucion.proceso_electoral || "Proceso Electoral"), f.normal, ancho, 2, 7);

  const altoNombre = nombreInst.size * 1.2;
  const altoProceso = proceso.size * 1.2;
  const bloque = nombreInst.lineas.length * altoNombre + 3 + proceso.lineas.length * altoProceso;
  let y = (HEADER_H - bloque) / 2;

  const lineaHeader = (texto: string, size: number, font: PDFFont, color: ReturnType<typeof rgb>, baseline: number) => {
    const w = font.widthOfTextAtSize(texto, size);
    const x = logo ? X(inicioX) : X(inicioX) - (w * s) / 2;
    page.drawText(texto, { x, y: Y(baseline), size: size * s, font, color });
  };
  for (const l of nombreInst.lineas) {
    lineaHeader(l, nombreInst.size, f.negrita, BLANCO, y + nombreInst.size * 0.95);
    y += altoNombre;
  }
  y += 3;
  for (const l of proceso.lineas) {
    lineaHeader(l, proceso.size, f.normal, CLARO, y + proceso.size * 0.95);
    y += altoProceso;
  }

  // Etiqueta y código QR (vectorial).
  const etiquetaY = HEADER_H + 2 + 18;
  centrado("CREDENCIAL ELECTORAL", etiquetaY, f.negrita, 7, AZUL);

  const qrTam = 110;
  const qrX = DW / 2 - qrTam / 2;
  const qrY = etiquetaY + 14;
  rect(qrX, qrY, qrTam, qrTam, BLANCO);
  const qr = QRCode.create(elector.dni, { errorCorrectionLevel: "H" });
  const n = qr.modules.size;
  const total = n + 2; // margen (zona silenciosa) de 1 módulo
  const m = qrTam / total;
  for (let fila = 0; fila < n; fila++) {
    let inicio = -1;
    for (let col = 0; col <= n; col++) {
      const oscuro = col < n && qr.modules.get(fila, col) === 1;
      if (oscuro && inicio < 0) inicio = col;
      if (!oscuro && inicio >= 0) {
        rect(qrX + (inicio + 1) * m, qrY + (fila + 1) * m, (col - inicio) * m, m, AZUL);
        inicio = -1;
      }
    }
  }

  // Nombre, DNI y detalle.
  let cursor = qrY + qrTam + 24;
  const nombre = ajustar(seguro(`${elector.nombres} ${elector.apellidos}`), f.negrita, DW - 24, 2, 10);
  for (const l of nombre.lineas) {
    centrado(l, cursor, f.negrita, nombre.size, TINTA);
    cursor += 15;
  }
  cursor += 2;
  centrado(seguro(elector.dni), cursor, f.mono, 9, GRIS);
  cursor += 18;

  const detalle = [
    elector.grado ? `Grado ${seguro(elector.grado)}` : "",
    elector.seccion ? `Sec. ${seguro(elector.seccion)}` : "",
    elector.mesa ? `Mesa ${seguro(elector.mesa)}` : "",
  ]
    .filter(Boolean)
    .join("   •   ");
  if (detalle) centrado(detalle, cursor, f.normal, 7, GRIS);

  // Pie con la fecha.
  page.drawLine({
    start: { x: X(16), y: Y(DH - 20) },
    end: { x: X(DW - 16), y: Y(DH - 20) },
    thickness: 0.6,
    color: BORDE,
    dashArray: [2 * s, 2 * s],
  });
  centrado(seguro(fechaTexto), DH - 10, f.normal, 6.5, GRIS);
}

export async function generarCarnetsPdf(
  electores: Elector[],
  institucion: Institucion,
  fechaTexto: string
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle("Carnets electorales");
  pdf.setProducer("Sistema de Voto Electrónico Escolar");

  const fuentes: Fuentes = {
    normal: await pdf.embedFont(StandardFonts.Helvetica),
    negrita: await pdf.embedFont(StandardFonts.HelveticaBold),
    mono: await pdf.embedFont(StandardFonts.Courier),
  };
  const logo = await incrustarLogo(pdf, institucion);

  const celdaW = (A4_W - 2 * MARGEN) / COLS;
  const celdaH = (A4_H - 2 * MARGEN) / FILAS;
  const escala = Math.min((celdaW - 6) / DW, (celdaH - 6) / DH);
  const cardW = DW * escala;
  const cardH = DH * escala;

  const porHoja = COLS * FILAS;
  let page: PDFPage | null = null;

  electores.forEach((elector, i) => {
    const pos = i % porHoja;
    if (pos === 0) page = pdf.addPage([A4_W, A4_H]);
    const col = pos % COLS;
    const fila = Math.floor(pos / COLS);
    const x = MARGEN + col * celdaW + (celdaW - cardW) / 2;
    const yTop = A4_H - MARGEN - fila * celdaH - (celdaH - cardH) / 2;
    dibujarCarnet(page!, fuentes, logo, elector, institucion, fechaTexto, x, yTop, escala);
  });

  if (electores.length === 0) {
    pdf.addPage([A4_W, A4_H]).drawText("Sin electores para imprimir.", {
      x: MARGEN,
      y: A4_H - MARGEN - 20,
      size: 12,
      font: fuentes.normal,
    });
  }

  return pdf.save({ useObjectStreams: true });
}
