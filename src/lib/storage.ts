import "server-only";

import { supabaseAdmin } from "@/lib/supabase/server";

const BUCKET = "imagenes";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  return file.type.split("/").pop() ?? "bin";
}

// Uploads a File to Storage at `pathWithoutExt` (extension is derived from
// the file) and returns a cache-busted public URL. Only call this from
// admin Server Actions — it uses the service role client.
export async function uploadImage(
  pathWithoutExt: string,
  file: File
): Promise<string> {
  if (file.size === 0) {
    throw new Error("El archivo está vacío.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("La imagen no debe superar 5 MB.");
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Formato de imagen no soportado (usa PNG, JPG, WEBP o SVG).");
  }

  const path = `${pathWithoutExt}.${extensionFor(file)}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) {
    throw new Error(`No se pudo subir la imagen: ${error.message}`);
  }

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

// Returns the uploaded file from `formData` under `field`, or null if the
// field is empty (no file selected — e.g. an unchanged upload input).
export function optionalFile(formData: FormData, field: string): File | null {
  const value = formData.get(field);
  if (value instanceof File && value.size > 0) return value;
  return null;
}
