import * as FileSystem from 'expo-file-system/legacy';
import { createId } from './id';

/**
 * O image picker devolve um arquivo em cache, que o sistema pode limpar a
 * qualquer momento. Copiamos para o diretorio de documentos para que a foto
 * sobreviva entre sessoes.
 */
const MEDIA_DIR = `${FileSystem.documentDirectory}bicloset/`;

export async function persistImage(uri: string): Promise<string> {
  try {
    const dir = await FileSystem.getInfoAsync(MEDIA_DIR);
    if (!dir.exists) {
      await FileSystem.makeDirectoryAsync(MEDIA_DIR, { intermediates: true });
    }
    const ext = uri.split('?')[0].split('.').pop() || 'jpg';
    const dest = `${MEDIA_DIR}${createId('img')}.${ext}`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  } catch {
    // Se a copia falhar seguimos com o uri original: pior caso a imagem some
    // depois, e a peca cai na silhueta vetorial.
    return uri;
  }
}

export async function deleteImage(uri: string | null): Promise<void> {
  if (!uri || !uri.startsWith(MEDIA_DIR)) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // Arquivo ja removido — nada a fazer.
  }
}
