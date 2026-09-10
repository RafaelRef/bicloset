import * as FileSystem from 'expo-file-system/legacy';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { createId } from './id';

/** Acima disso não ganha nada: a remove.bg devolve 0,25 MP no plano grátis. */
const MAX_UPLOAD_WIDTH = 1600;

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

/**
 * Converte para JPEG e limita a largura.
 *
 * O iPhone salva as fotos em HEIC, que a remove.bg recusa com "invalid file
 * type" — e HEIC também não é universal para exibir. Normalizar aqui resolve
 * os dois de uma vez, e de quebra corta o tamanho do upload.
 */
export async function toUploadableJpeg(uri: string): Promise<string> {
  const context = ImageManipulator.manipulate(uri);
  const rendered = await context.renderAsync();

  if (rendered.width > MAX_UPLOAD_WIDTH) {
    const resized = ImageManipulator.manipulate(uri);
    resized.resize({ width: MAX_UPLOAD_WIDTH });
    const output = await resized.renderAsync();
    const saved = await output.saveAsync({
      format: SaveFormat.JPEG,
      compress: 0.85,
    });
    return saved.uri;
  }

  const saved = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.9,
  });
  return saved.uri;
}

export async function persistImage(uri: string): Promise<string> {
  try {
    await ensureMediaDir();
    // Normaliza antes de guardar: o que fica no closet é sempre JPEG.
    const normalized = await toUploadableJpeg(uri).catch(() => uri);
    const ext = normalized === uri ? uri.split('?')[0].split('.').pop() || 'jpg' : 'jpg';
    const dest = `${MEDIA_DIR}${createId('img')}.${ext}`;
    await FileSystem.copyAsync({ from: normalized, to: dest });
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
