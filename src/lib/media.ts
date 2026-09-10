import * as FileSystem from 'expo-file-system/legacy';
import { createId } from './id';

/**
 * O image picker devolve um arquivo em cache, que o sistema pode limpar a
 * qualquer momento. Copiamos para o diretório de documentos para que a foto
 * sobreviva entre sessões.
 */
const MEDIA_DIR = `${FileSystem.documentDirectory}bicloset/`;

async function ensureMediaDir(): Promise<void> {
  const dir = await FileSystem.getInfoAsync(MEDIA_DIR);
  if (!dir.exists) {
    await FileSystem.makeDirectoryAsync(MEDIA_DIR, { intermediates: true });
  }
}

export async function persistImage(uri: string): Promise<string> {
  try {
    await ensureMediaDir();
    const ext = uri.split('?')[0].split('.').pop() || 'jpg';
    const dest = `${MEDIA_DIR}${createId('img')}.${ext}`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  } catch {
    // Se a cópia falhar seguimos com o uri original: pior caso a imagem some
    // depois, e a peça cai na silhueta vetorial.
    return uri;
  }
}

/** Lê um arquivo de imagem local como base64, para enviar no corpo de uma API. */
export async function readImageAsBase64(uri: string): Promise<string> {
  return FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

/** Grava um PNG devolvido em base64 (resposta da remove.bg) como arquivo. */
export async function saveBase64Image(base64: string, ext = 'png'): Promise<string> {
  await ensureMediaDir();
  const dest = `${MEDIA_DIR}${createId('cut')}.${ext}`;
  await FileSystem.writeAsStringAsync(dest, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return dest;
}

export async function deleteImage(uri: string | null): Promise<void> {
  if (!uri || !uri.startsWith(MEDIA_DIR)) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // Arquivo já removido — nada a fazer.
  }
}
