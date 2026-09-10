import { saveBase64Image } from '@/lib/media';

/**
 * Remoção de fundo da foto da peça, via API da remove.bg.
 *
 * Funciona assim que existir `EXPO_PUBLIC_REMOVE_BG_KEY` no `.env` (veja o
 * README). Sem chave, o app continua funcionando: a foto entra como está e a
 * UI avisa que o recorte não aconteceu — nada finge ter sido processado.
 */

const ENDPOINT = 'https://api.remove.bg/v1.0/removebg';

/**
 * `preview` (até 0,25 MP) consome 1 crédito por foto — o plano grátis dá 50
 * por mês. É resolução de sobra para o card do closet e para a prova virtual.
 * Trocar para 'auto' aumenta a qualidade e o consumo de créditos.
 */
const OUTPUT_SIZE = process.env.EXPO_PUBLIC_REMOVE_BG_SIZE ?? 'preview';

const TIMEOUT_MS = 30_000;

export type BackgroundRemovalStatus =
  /** Fundo removido de verdade pela API. */
  | 'removed'
  /** Sem chave configurada: a foto passou direto. */
  | 'skipped'
  /** Tentou e falhou (crédito, chave inválida, rede). A foto passou direto. */
  | 'failed';

export interface BackgroundRemovalResult {
  /** URI da imagem pronta para uso no guarda-roupa. */
  uri: string;
  status: BackgroundRemovalStatus;
  /** Explicação curta para a UI. null quando deu certo. */
  message: string | null;
}

function mimeFor(uri: string): string {
  const ext = uri.split('?')[0].split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'heic' || ext === 'heif') return 'image/heic';
  return 'image/jpeg';
}

/** Traduz o erro da API para algo acionável na tela. */
function messageForStatus(httpStatus: number, apiTitle?: string): string {
  switch (httpStatus) {
    case 402:
      return 'Os créditos da remove.bg acabaram este mês. A foto entrou sem recorte.';
    case 401:
    case 403:
      return 'A chave da remove.bg foi recusada. Confira EXPO_PUBLIC_REMOVE_BG_KEY no .env.';
    case 429:
      return 'Muitas fotos seguidas para a remove.bg. Espere um instante e tente de novo.';
    default:
      return apiTitle
        ? `A remove.bg recusou a foto: ${apiTitle}. Ela entrou sem recorte.`
        : 'Não deu para falar com a remove.bg agora. A foto entrou sem recorte.';
  }
}

export async function removeBackground(
  uri: string,
): Promise<BackgroundRemovalResult> {
  const apiKey = process.env.EXPO_PUBLIC_REMOVE_BG_KEY;

  if (!apiKey) {
    return {
      uri,
      status: 'skipped',
      message:
        'Remoção de fundo desligada: falta a chave da remove.bg no .env. A foto entrou como está.',
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const form = new FormData();
    form.append('image_file', {
      uri,
      name: 'item.jpg',
      type: mimeFor(uri),
    } as unknown as Blob);
    form.append('size', OUTPUT_SIZE);
    form.append('format', 'png');
    // Sem isso a peça sai com o fundo transparente cortado rente ao contorno.
    form.append('crop', 'true');

    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        // Devolve base64 em JSON em vez de binário — mais simples de gravar
        // em arquivo no React Native.
        Accept: 'application/json',
      },
      body: form,
      signal: controller.signal,
    });

    if (!response.ok) {
      let apiTitle: string | undefined;
      try {
        const errorBody = await response.json();
        apiTitle = errorBody?.errors?.[0]?.title;
      } catch {
        // Corpo não era JSON — seguimos com a mensagem genérica.
      }
      return {
        uri,
        status: 'failed',
        message: messageForStatus(response.status, apiTitle),
      };
    }

    const body = await response.json();
    const base64: string | undefined = body?.data?.result_b64;
    if (!base64) {
      return {
        uri,
        status: 'failed',
        message: 'A remove.bg respondeu sem imagem. A foto entrou sem recorte.',
      };
    }

    const cutoutUri = await saveBase64Image(base64, 'png');
    return { uri: cutoutUri, status: 'removed', message: null };
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    return {
      uri,
      status: 'failed',
      message: aborted
        ? 'A remove.bg demorou demais para responder. A foto entrou sem recorte.'
        : 'Não deu para falar com a remove.bg agora. A foto entrou sem recorte.',
    };
  } finally {
    clearTimeout(timeout);
  }
}
