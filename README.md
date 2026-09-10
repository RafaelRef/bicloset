# bicloset

Guarda-roupa digital com prova virtual, planejamento de looks e controle de lavanderia.
App pessoal, React Native + Expo, roda no iPhone pelo Expo Go — sem Xcode, sem Mac, sem
conta de desenvolvedor Apple.

> Projeto independente. Não tem relação de código com `~/Documents/bicloset`, apesar do
> mesmo nome.

---

## Como rodar

```bash
npm install
```

```bash
npx expo start --tunnel
```

Depois:

1. Instale o **Expo Go** no iPhone (App Store).
2. Aponte a câmera do iPhone para o QR code do terminal (ou escaneie pelo próprio Expo Go).
3. O app abre direto no Expo Go.

`--tunnel` funciona mesmo que o computador e o iPhone estejam em redes diferentes. Se os
dois estiverem no mesmo Wi-Fi, `npx expo start` sozinho é mais rápido. O `@expo/ngrok`
que o tunnel exige já está como devDependency, então não pede instalação global.

Para ver o app com conteúdo sem fotografar nada: **Perfil → Carregar closet de exemplo**
(23 peças fictícias, desenhadas como silhuetas vetoriais).


### Remoção de fundo das fotos (opcional, mas recomendado)

Sem isso as peças entram com o fundo do quarto e o grid perde o visual de catálogo.

1. Crie uma conta em [remove.bg](https://www.remove.bg/users/sign_up) — o plano grátis dá
   **50 fotos por mês**, sem cartão.
2. Pegue a chave em [remove.bg/api](https://www.remove.bg/api) → *API Key*.
3. Na raiz do projeto, copie `.env.example` para `.env` e cole a chave:

   ```
   EXPO_PUBLIC_REMOVE_BG_KEY=sua_chave_aqui
   ```

4. **Reinicie o servidor** (Ctrl+C e `npx expo start` de novo). Variáveis `EXPO_PUBLIC_*`
   são embutidas no bundle, então não valem sem reiniciar.

5. Para a **versão publicada** funcionar, a chave também precisa estar no EAS — o
   `eas update` lê variáveis do ambiente do EAS, não do `.env` local:

   ```bash
   npx eas-cli env:push production --path .env --force
   ```

O `.env` está no `.gitignore`. Peças cadastradas antes da chave podem ser reprocessadas:
abra a peça no closet e toque em **Remover o fundo desta foto**.

Fotos de iPhone chegam em HEIC, que a remove.bg recusa; o app converte para JPEG
(máx. 1600px) antes de enviar, em `src/lib/media.ts`.

---

## Publicar (usar sem o PC ligado)

O app está publicado com EAS Update em [`@ref_1012/bicloset`](https://expo.dev/accounts/ref_1012/projects/bicloset).
Abre no Expo Go direto da nuvem:

```
exp://u.expo.dev/8a65535f-f740-48b0-a1d5-ebdbebbb742e?channel-name=production
```

Para publicar uma versão nova:

```bash
npx eas-cli update --branch production --message "o que mudou" --environment production --platform ios
```

Quem abrir o app recebe na próxima vez que fechar e abrir.

Três detalhes que quebram se forem mexidos:

- **`runtimeVersion` precisa ser `"exposdk:57.0.0"`** em `app.json`. O Expo Go só
  carrega updates com o runtime da SDK dele. A policy `appVersion` que o
  `eas update:configure` deixa por padrão só serve para build standalone.
- **`web.output` precisa ser `"single"`**. Com `"static"` o export renderiza em Node e
  quebra com `window is not defined`.
- **O canal `production` precisa existir** e apontar para a branch de mesmo nome,
  senão o manifest responde 404 (`eas channel:create production`).

### Ícone na tela inicial

Pelo Expo Go não existe ícone nativo. O contorno é o app **Atalhos**: nova ação
"Abrir URL" com a URL acima, salvar, e no menu de compartilhar escolher
"Adicionar à Tela de Início". Um toque abre o app.

Ícone nativo de verdade exige conta paga da Apple (US$ 99/ano) e build via EAS.

---

## O que tem no app

| Tela | O que faz |
| --- | --- |
| **Onboarding** | 3 passos, aparece só na primeira abertura |
| **Home** | Look do dia sugerido, estatísticas do closet, ideias e looks recentes |
| **Closet** | Grade de peças e de looks, busca, filtros por categoria/cor/estação/ocasião |
| **Prova virtual** | Monta o look sobre a sua foto de referência e salva como look |
| **Agenda** | Calendário mensal, agenda look por dia/evento e confirma o uso |
| **Explorar** | Grade de combinações sugeridas a partir do closet atual |
| **Perfil** | Avatar, nome, período de lavagem, saldo de recortes, backup, peças mais usadas |

### Disponibilidade de peça (lavanderia)

Ao confirmar **"usei este look"** numa data da Agenda, todas as peças daquele look ficam
indisponíveis por um período configurável (padrão **7 dias**, ajustável em Perfil, 0 desliga).
Enquanto isso elas:

- aparecem esmaecidas no closet, com um selo `3d` indicando quanto falta;
- somem da seleção de peças da prova virtual;
- deixam de entrar nas sugestões de look.

A peça volta sozinha quando o período passa — não existe ação de "tirar da lavanderia".

Detalhe de implementação: `lastWornAt` e `wearCount` são **cache derivado**. A fonte da
verdade são as entradas de calendário confirmadas, e tudo é recalculado a partir delas
(`recomputeWear` em [`src/store/useAppStore.ts`](src/store/useAppStore.ts)). Por isso
desfazer um "usei" devolve a peça imediatamente, sem contador dessincronizado.

---

### Backup do closet

**Perfil → Backup → Exportar closet** gera um arquivo único com peças, looks, agenda
e as fotos embutidas em base64, e abre a folha de compartilhamento do iOS (Arquivos,
iCloud, WhatsApp, e-mail). **Restaurar backup** lê o arquivo de volta.

As fotos vão dentro do arquivo de propósito: caminho de arquivo muda entre aparelhos
e entre reinstalações, então guardar só o caminho daria um backup que restaura peças
sem imagem.

Isso importa mais do que parece: rodando no Expo Go, os dados vivem **dentro do Expo
Go**. Apagar ou reinstalar o Expo Go leva o closet junto.

---

## O que está mockado vs. real

**Real (roda de verdade, offline, sem chave de API):**

- Todo o CRUD de peças, looks e agenda, persistido localmente com AsyncStorage.
- Cálculo de disponibilidade / período de lavagem.
- Motor de sugestão de looks — [`src/services/stylist.ts`](src/services/stylist.ts).
  Pontua combinações por ocasião, estação, harmonia de cor e frescor (peças menos usadas
  primeiro). É heurística local, não é um modelo de IA.
- Composição visual do look — [`src/components/TryOnCanvas.tsx`](src/components/TryOnCanvas.tsx).
  Sobrepõe as peças na foto de referência por zona do corpo (torso, pernas, pés).

**Real, mas depende de chave de API:**

- **Remoção de fundo** — [`src/services/backgroundRemoval.ts`](src/services/backgroundRemoval.ts),
  via [remove.bg](https://www.remove.bg/api). Liga sozinho assim que
  `EXPO_PUBLIC_REMOVE_BG_KEY` existir no `.env` (veja a seção acima). Sem chave, ou se a
  API falhar, a foto entra sem recorte e a tela diz exatamente o motivo — nunca finge
  que processou.

**Ainda mockado:**

| O quê | Arquivo | O que trocar |
| --- | --- | --- |
| **Prova virtual com IA** | [`src/services/tryOn.ts`](src/services/tryOn.ts) | Corpo de `generateTryOn`. Sugestão: Replicate (`cuuupid/idm-vton` ou similar). Devolver `compositeUri` preenchido e `mocked: false` — nenhuma tela precisa mudar. |

O arquivo já tem a assinatura final (`foto da pessoa + peças → imagem combinada`), o
exemplo de request comentado e um `TODO` marcando o ponto exato. Enquanto estiver
mockado, a UI mostra o selo **Preview** e um aviso explícito.

Nota de segurança: `EXPO_PUBLIC_*` é embutido no bundle, então a chave viaja com o app.
Para uso pessoal está ok. Num app distribuído, as chamadas deveriam passar por um backend
próprio para a chave não sair da sua máquina.

---

## Stack

- **Expo SDK 57** + **Expo Router** (rotas por arquivo, em `src/app`)
- **TypeScript** estrito
- **Zustand** + `persist` sobre **AsyncStorage** (offline, sem backend)
- **react-native-reanimated** para as transições
- **react-native-svg** para as silhuetas de peça
- **lucide-react-native** para ícones
- **Inter** + **Playfair Display** via `@expo-google-fonts`

### Estrutura

```
src/
  app/              rotas (expo-router)
    (tabs)/         Home, Closet, Prova virtual, Agenda, Perfil
    add-item.tsx    fluxo de cadastro de peça
    explore.tsx     sugestões de look
    outfit/[id].tsx detalhe do look
    onboarding.tsx
  components/       UI compartilhada (ui/ = primitivos)
  services/         tryOn, backgroundRemoval (mockados) e stylist (local)
  store/            estado global e tipos
  lib/              datas, disponibilidade, mídia, seed
  theme/            tokens.ts e typography.ts
```

Nenhum estilo inline solto: cores, espaçamentos, raios e tipografia saem de
[`src/theme/tokens.ts`](src/theme/tokens.ts) e [`src/theme/typography.ts`](src/theme/typography.ts).

### Design

Linguagem visual tirada do case [Closetly — AI-Powered Virtual Wardrobe App](https://www.behance.net/gallery/240575227/Closetly-AI-Powered-Virtual-Wardrobe-App)
(Andrey Klimenkov): fundo cinza neutro, cards brancos bem arredondados, CTAs em pílula
grafite, chips com borda fina e estado selecionado sólido, barra de abas flutuante.
O wordmark serifado vem do app publicado na App Store. O case original tem 4 abas
(Home / Closet / Try On / Profile); aqui são 5, porque a Agenda é uma tela própria.

---

## Trocar nome e ícone

- **Nome, slug e scheme:** `app.json` → `expo.name`, `expo.slug`, `expo.scheme`.
- **Ícone:** substitua `assets/images/icon.png` (1024×1024). O ícone atual é o
  placeholder do template Expo — provisório.
- **Splash:** `assets/images/splash-icon.png` e a cor em `expo.plugins` → `expo-splash-screen`.
- **Wordmark dentro do app:** a string `bicloset` na Home
  ([`src/app/(tabs)/index.tsx`](src/app/(tabs)/index.tsx)) e no
  [onboarding](src/app/onboarding.tsx).

---

## Próximos passos sugeridos

1. **Trocar o mock de try-on por Replicate** — é a última feature ainda mockada.
2. **Detecção automática de categoria e cor** no upload, para economizar toques.
3. **Notificação** no fim do dia perguntando se usou o look planejado — hoje a
   confirmação depende de abrir a Agenda.
4. **Cadastro em lote** (seleção múltipla no picker), se o guarda-roupa crescer.
5. **Backend para sincronizar entre aparelhos** — o backup em arquivo cobre a perda
   de dados, mas não sincroniza dois celulares.
6. **Build standalone** com EAS quando quiser sair do Expo Go (exige conta Apple paga).

---

## Scripts

```bash
npx tsc --noEmit
```

```bash
npm run lint
```
