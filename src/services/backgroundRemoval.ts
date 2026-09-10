/**
 * Remocao de fundo da foto da peca.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * MOCKADO. Hoje devolve a propria foto e marca `mocked: true`; a UI mostra o
 * selo "Preview" para nao fingir que houve recorte.
 *
 * TODO: integrar com remove.bg ou um modelo de segmentacao no Replicate —
 * precisa de API key do usuario. Basta trocar o corpo de `removeBackground`
 * mantendo a assinatura; nenhuma tela precisa mudar.
 *
 * Exemplo (remove.bg):
 *   const form = new FormData();
 *   form.append('image_file', { uri, name: 'item.jpg', type: 'image/jpeg' } as any);
 *   form.append('size', 'auto');
 *   const res = await fetch('https://api.remove.bg/v1.0/removebg', {
 *     method: 'POST',
 *     headers: { 'X-Api-Key': process.env.EXPO_PUBLIC_REMOVE_BG_KEY! },
 *     body: form,
 *   });
 * ─────────────────────────────────────────────────────────────────────────
 */

export interface BackgroundRemovalResult {
  /** URI da imagem pronta para uso no guarda-roupa. */
  uri: string;
  /** false quando um servico real processou a imagem. */
  mocked: boolean;
}

export async function removeBackground(
  uri: string,
): Promise<BackgroundRemovalResult> {
  // Latencia artificial para que a UI de processamento tenha o que mostrar.
  await new Promise((resolve) => setTimeout(resolve, 1100));
  return { uri, mocked: true };
}
