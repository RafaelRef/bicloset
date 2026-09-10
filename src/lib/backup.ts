import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { createId } from './id';
import { readImageAsBase64, saveBase64Image } from './media';
import type { ClothingItem, Outfit, PlanEntry, Settings } from '@/store/types';

/**
 * Backup do closet em arquivo único.
 *
 * Rodando no Expo Go, os dados vivem dentro do Expo Go: apagar ou reinstalar
 * o app leva o closet junto. Um arquivo exportável cobre esse risco sem exigir
 * backend, conta ou mensalidade.
 *
 * As fotos vão embutidas em base64 porque os caminhos de arquivo mudam entre
 * aparelhos e entre reinstalações — guardar só o caminho daria um backup que
 * restaura peças sem imagem.
 */

const FORMAT = 'bicloset-backup';
const VERSION = 1;

/**
 * Nos registros do arquivo, `imageUri`, `originalUri`, `avatarUri` e
 * `modelPhotoUri` guardam a **chave** do asset, não um caminho — o caminho real
 * é recriado na importação.
 */
export interface BackupFile {
  format: typeof FORMAT;
  version: number;
  exportedAt: string;
  items: ClothingItem[];
  outfits: Outfit[];
  plans: PlanEntry[];
  settings: Settings;
  assets: Record<string, string>;
}

export interface BackupPayload {
  items: ClothingItem[];
  outfits: Outfit[];
  plans: PlanEntry[];
  settings: Settings;
}

/** Lê a imagem para dentro do arquivo e devolve a chave que a representa. */
async function stashAsset(
  uri: string | null,
  assets: Record<string, string>,
): Promise<string | null> {
  if (!uri) return null;
  try {
    const base64 = await readImageAsBase64(uri);
    const key = uri.split('/').pop() || createId('asset');
    assets[key] = base64;
    return key;
  } catch {
    // Arquivo sumiu do disco: a peça volta como silhueta em vez de travar
    // o backup inteiro.
    return null;
  }
}

export async function buildBackup(payload: BackupPayload): Promise<BackupFile> {
  const assets: Record<string, string> = {};

  const items: ClothingItem[] = [];
  for (const item of payload.items) {
    items.push({
      ...item,
      imageUri: await stashAsset(item.imageUri, assets),
      // A original só entra se for um arquivo diferente do recorte.
      originalUri:
        item.originalUri && item.originalUri !== item.imageUri
          ? await stashAsset(item.originalUri, assets)
          : null,
    });
  }

  const outfits: Outfit[] = [];
  for (const outfit of payload.outfits) {
    outfits.push({ ...outfit, personUri: await stashAsset(outfit.personUri, assets) });
  }

  const settings: Settings = {
    ...payload.settings,
    avatarUri: await stashAsset(payload.settings.avatarUri, assets),
    modelPhotoUri: await stashAsset(payload.settings.modelPhotoUri, assets),
  };

  return {
    format: FORMAT,
    version: VERSION,
    exportedAt: new Date().toISOString(),
    items,
    outfits,
    plans: payload.plans,
    settings,
    assets,
  };
}

export interface ExportResult {
  /** Caminho do arquivo gerado. */
  path: string;
  /** Tamanho aproximado, para mostrar na tela. */
  sizeMb: number;
  /** false quando o aparelho não tem folha de compartilhamento. */
  shared: boolean;
}

export async function exportBackup(payload: BackupPayload): Promise<ExportResult> {
  const backup = await buildBackup(payload);
  const json = JSON.stringify(backup);

  const stamp = new Date().toISOString().slice(0, 10);
  const path = `${FileSystem.cacheDirectory}bicloset-${stamp}.json`;
  await FileSystem.writeAsStringAsync(path, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const sizeMb = json.length / 1024 / 1024;

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, {
      mimeType: 'application/json',
      dialogTitle: 'Salvar backup do bicloset',
      UTI: 'public.json',
    });
    return { path, sizeMb, shared: true };
  }
  return { path, sizeMb, shared: false };
}

export type ImportOutcome =
  | { status: 'canceled' }
  | { status: 'invalid'; message: string }
  | { status: 'ok'; payload: BackupPayload; counts: { items: number; outfits: number } };

function isBackupFile(value: unknown): value is BackupFile {
  if (typeof value !== 'object' || value === null) return false;
  const file = value as Partial<BackupFile>;
  return (
    file.format === FORMAT &&
    Array.isArray(file.items) &&
    Array.isArray(file.outfits) &&
    Array.isArray(file.plans) &&
    typeof file.assets === 'object'
  );
}

/** Abre o seletor de arquivos, valida e regrava as fotos no disco. */
export async function importBackup(): Promise<ImportOutcome> {
  const picked = await DocumentPicker.getDocumentAsync({
    // O tipo exato varia conforme de onde o arquivo veio (Arquivos, WhatsApp,
    // e-mail), então aceitamos tudo e validamos o conteúdo.
    type: '*/*',
    copyToCacheDirectory: true,
  });

  if (picked.canceled || picked.assets.length === 0) return { status: 'canceled' };

  let parsed: unknown;
  try {
    const raw = await FileSystem.readAsStringAsync(picked.assets[0].uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    parsed = JSON.parse(raw);
  } catch {
    return { status: 'invalid', message: 'Não deu para ler esse arquivo.' };
  }

  if (!isBackupFile(parsed)) {
    return {
      status: 'invalid',
      message: 'Esse arquivo não é um backup do bicloset.',
    };
  }

  if (parsed.version > VERSION) {
    return {
      status: 'invalid',
      message: 'Esse backup foi feito por uma versão mais nova do app.',
    };
  }

  // Regrava cada foto no disco e mapeia chave -> novo caminho.
  const uriByKey: Record<string, string> = {};
  for (const [key, base64] of Object.entries(parsed.assets)) {
    try {
      const ext = key.split('.').pop() || 'jpg';
      uriByKey[key] = await saveBase64Image(base64, ext);
    } catch {
      // Um asset corrompido não invalida o backup inteiro.
    }
  }

  const resolve = (key: string | null): string | null =>
    key ? (uriByKey[key] ?? null) : null;

  return {
    status: 'ok',
    counts: { items: parsed.items.length, outfits: parsed.outfits.length },
    payload: {
      items: parsed.items.map((item) => ({
        ...item,
        imageUri: resolve(item.imageUri),
        originalUri: resolve(item.originalUri),
      })),
      outfits: parsed.outfits.map((outfit) => ({
        ...outfit,
        personUri: resolve(outfit.personUri),
      })),
      plans: parsed.plans,
      settings: {
        ...parsed.settings,
        avatarUri: resolve(parsed.settings.avatarUri),
        modelPhotoUri: resolve(parsed.settings.modelPhotoUri),
      },
    },
  };
}
