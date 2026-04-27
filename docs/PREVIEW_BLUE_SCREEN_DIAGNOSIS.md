# Diagnostico: Preview com tela azul escura antes do login

Data do diagnostico: 2026-04-27

## Escopo e restricoes

Este diagnostico foi feito sem alterar Vercel Production, sem `supabase db push`, sem merge e sem commit. A alteracao persistente deste trabalho e apenas este relatorio.

## Branch e commit analisados

Deployment Preview analisado:

- URL: `https://pddeonlinesme-517zc1acn-wilson-m-peixotos-projects.vercel.app`
- Alias: `https://pddeonlinesme-rj-git-copilot-39aa86-wilson-m-peixotos-projects.vercel.app`
- Vercel deployment id: `dpl_37BbZHzoNBJsaENAjTCPbE2ePDgU`
- Target: `preview`
- Criado em: `2026-04-27T13:56:58Z`
- Build log: `Branch: copilot/revert-production-deploy, Commit: 3f362fe`

Ultimo commit funcional conhecido informado:

- `432cc48000afae708f2890aa593927078468a9d9` - `Add Vercel Web Analytics`

O checkout local esta em `decc7277c4470e57678a5535a984cee8483c5651`, merge de `3f362fe`. A arvore de `decc727` nao apresenta diff contra `3f362fe`, entao a reproducao local foi feita sobre conteudo equivalente ao Preview analisado.

Atualizacao apos comparacao com Production:

- Production atual: `https://pddeonlinesme-f4rsztroi-wilson-m-peixotos-projects.vercel.app`
- Target: `production`
- Criado em: `2026-04-27T14:01:01Z`
- Build log: `Branch: main, Commit: decc727`
- O build de Production e o build do Preview analisado geraram os mesmos assets principais:
  - `dist/assets/index-CMEOmr44.css`
  - `dist/assets/index-q_aPtcaP.js`

Isso indica que o Production atual e o Preview analisado estao efetivamente no mesmo bundle compilado. Portanto, se Production renderiza login normalmente, o codigo/bundle atual tambem e capaz de renderizar login; a tela azul observada no Preview nao deve ser tratada como regressao confirmada de codigo.

Addendum apos esclarecimento do incidente:

- A Production chegou a receber por engano um estado de Preview e foi revertida manualmente no mesmo dia.
- O deployment Production que representa o estado problemático mais provavel e `https://pddeonlinesme-8dasxbmk1-wilson-m-peixotos-projects.vercel.app`.
- Build log desse deployment: `Branch: main, Commit: 8446b18`.
- Esse build gerou `dist/assets/index-BLuX4Rxb.js`.
- Esse commit contem `.env.example`, mas nao contem `.env`.
- O `.env.example` desse commit documenta `VITE_SUPABASE_ANON_KEY`, enquanto o codigo espera `VITE_SUPABASE_PUBLISHABLE_KEY`.

## Variaveis esperadas pelo codigo

Arquivo: `src/integrations/supabase/client.ts`

O client Supabase usa exatamente:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Nao ha referencia no codigo atual a `VITE_SUPABASE_ANON_KEY`.

Trecho relevante:

```ts
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

## Variaveis documentadas

No commit problemático `8446b18`, existe `.env.example` com:

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Isso diverge do codigo, que espera `VITE_SUPABASE_PUBLISHABLE_KEY`.

No checkout atual, nao existe `.env.example`. Tambem nao ha `.env.example` nos refs testados via raw GitHub para:

- `main`
- `3f362fe`
- `432cc480`

Isso impede a documentacao do ambiente de servir como contrato verificavel. A divergencia principal hoje e por omissao: o codigo espera `VITE_SUPABASE_PUBLISHABLE_KEY`, mas nao ha `.env.example` declarando esse nome. Se algum roteiro externo estiver usando `VITE_SUPABASE_ANON_KEY`, ele esta divergente do codigo atual.

Observacao: existe `.env` versionado contendo `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`, mas os valores nao foram registrados neste relatorio.

## Vercel Environment Variables

Leitura feita via `vercel env ls` em pasta temporaria vinculada ao projeto, sem `vercel pull` e sem baixar valores.

Resultado:

- `preview`: `envs: []`
- `production`: `envs: []`
- `development`: `envs: []`

Ou seja, o projeto Vercel nao tem variaveis de ambiente cadastradas nos targets consultados. Qualquer build que nao receba o `.env` versionado, ou que seja gerado em contexto sem essas variaveis, vai compilar o bundle sem configuracao Supabase valida.

## Reproducao local

Instalacao:

- `npm ci` falhou porque `package.json` e `package-lock.json` nao estao sincronizados. O lock nao contem `xlsx@0.18.5` e transitivas (`adler-32`, `cfb`, `codepage`, `crc-32`, `ssf`, `wmf`, `word`, `frac`).
- Para nao reescrever `package-lock.json`, foi usado `npm install --package-lock=false`.

Builds executados:

- `npm run build -- --outDir dist-missing --emptyOutDir`, sem `VITE_SUPABASE_URL` e sem `VITE_SUPABASE_PUBLISHABLE_KEY`.
- `npm run build -- --outDir dist-invalid --emptyOutDir`, com placeholders invalidos.
- `npm run build -- --outDir dist-valid --emptyOutDir`, com o `.env` local valido.

Todos os builds passaram. O erro acontece no navegador, quando o bundle executa `createClient`.

### Sem variaveis Supabase

Resultado visual:

- `bodyBackground`: `rgb(9, 14, 26)`
- `#root` vazio: `rootChildCount: 0`, `rootHtmlLength: 0`
- Tela azul escura sem login

Erro exato capturado pelo Playwright:

```text
Error: supabaseUrl is required.
    at pie (http://127.0.0.1:4173/assets/index-Ds5VeooZ.js:430:45410)
    at new gie (http://127.0.0.1:4173/assets/index-Ds5VeooZ.js:430:45784)
    at vie (http://127.0.0.1:4173/assets/index-Ds5VeooZ.js:430:49183)
    at http://127.0.0.1:4173/assets/index-Ds5VeooZ.js:430:49676
```

### Com placeholders invalidos

Resultado visual:

- `bodyBackground`: `rgb(9, 14, 26)`
- `#root` vazio: `rootChildCount: 0`, `rootHtmlLength: 0`
- Tela azul escura sem login

Erro exato capturado pelo Playwright:

```text
Error: Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.
    at pie (http://127.0.0.1:4174/assets/index-Bn4M_vlH.js:430:45483)
    at new gie (http://127.0.0.1:4174/assets/index-Bn4M_vlH.js:430:45784)
    at vie (http://127.0.0.1:4174/assets/index-Bn4M_vlH.js:430:49183)
    at http://127.0.0.1:4174/assets/index-Bn4M_vlH.js:430:49692
```

### Com variaveis validas do Supabase antigo

Resultado:

- A tela de login voltou a renderizar.
- `#root` montado: `rootChildCount: 3`, `rootHtmlLength: 6172`
- Texto visivel: `PDDE Online`, `Acesso ao sistema`, `E-mail institucional`, `Senha`, `Entrar`.

Unico erro de console observado nesse modo:

```text
Failed to load resource: the server responded with a status of 404 (Not Found)
http://127.0.0.1:4175/_vercel/insights/script.js
```

Esse 404 e esperado em `vite preview` local para o script do Vercel Analytics e nao bloqueia o login.

Nao foram validadas paginas autenticadas.

## Verificacao do Preview remoto

A tentativa de abrir o Preview real no Chromium headless foi redirecionada para `Login - Vercel` e retornou `401`, indicando protecao/autenticacao da Vercel para esta sessao. Por isso, o console da aplicacao hospedada nao foi capturado diretamente.

Ainda assim, a reproducao local mostra que a tela azul escura com `#root` vazio e causada exatamente por ambiente Supabase ausente ou invalido.

## Componentes globais antes da rota de login

Arquivos verificados:

- `src/App.tsx`
- `src/components/CommandPalette.tsx`
- `src/components/TopLoadingBar.tsx`
- `src/components/ProtectedRoute.tsx`
- `src/hooks/useAuth.ts`
- `src/hooks/useExercicio.tsx`
- `src/components/ErrorBoundary.tsx`

Achados:

- `CommandPalette`, `TopLoadingBar`, `ExercicioProvider` e `ErrorBoundary` nao importam Supabase nem `useAuth`.
- `App.tsx` importa `ProtectedRoute` no topo do modulo.
- `ProtectedRoute` importa `useAuth`.
- `useAuth` importa `supabase`.
- `supabase` e criado em module scope em `src/integrations/supabase/client.ts`.
- A rota `/` renderiza `Index`, que renderiza `Login`; `Login` tambem importa `supabase` e chama `supabase.auth.getSession()` no `useEffect`.

Conclusao tecnica: mesmo que `ProtectedRoute` nao seja renderizado na rota de login, o import chain ja carrega `useAuth` e inicializa o client Supabase antes da montagem da aplicacao. Quando `VITE_SUPABASE_URL` esta ausente ou invalida, o erro ocorre antes do React renderizar o login e antes do `ErrorBoundary` conseguir proteger a interface.

## Causa confirmada para o estado problemático

A causa tecnica reproduzida para a tela azul e ambiente Supabase ausente ou invalido: `VITE_SUPABASE_URL` e/ou `VITE_SUPABASE_PUBLISHABLE_KEY` ausentes ou invalidas no bundle gerado.

Depois de reproduzir localmente o commit `8446b18`, a causa do estado problemático deixa de ser apenas hipotese:

- `8446b18` nao tem `.env`.
- Vercel Environment Variables retornou `envs: []`.
- O template disponivel naquele commit usa `VITE_SUPABASE_ANON_KEY`, nome que o codigo nao le.
- O build local de `8446b18` sem variaveis Supabase passa, mas a execucao no navegador falha antes da montagem do React.

Erro capturado para `8446b18`:

```text
Error: supabaseUrl is required.
    at pie (http://127.0.0.1:4186/assets/index-Ds5VeooZ.js:430:45410)
    at new gie (http://127.0.0.1:4186/assets/index-Ds5VeooZ.js:430:45784)
    at vie (http://127.0.0.1:4186/assets/index-Ds5VeooZ.js:430:49183)
    at http://127.0.0.1:4186/assets/index-Ds5VeooZ.js:430:49676
```

Resultado visual:

- `bodyBackground`: `rgb(9, 14, 26)`
- `rootChildCount`: `0`
- `rootHtmlLength`: `0`

Isto nao parece ser bug funcional da tela de login. A tela azul e o estado visual do app quando o bundle falha antes de montar o React: o CSS global aplica fundo azul escuro, mas `#root` fica vazio.

Portanto, para o estado `8446b18`/`index-BLuX4Rxb.js`, nao e adequado tratar como mero estado transitorio. O problema era uma combinacao de ambiente ausente no build e documentacao divergente do nome da variavel.

Ha um problema de robustez no codigo: o client Supabase falha em module scope e nao ha validacao amigavel de ambiente antes de `createClient`. Mas a correcao minima para destravar Preview e configurar o ambiente correto, nao alterar regras de banco, migrations ou autenticacao.

## Correcao minima recomendada

1. No Vercel, cadastrar no target `Preview` do projeto `pddeonlinesme-rj`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
2. Redeployar apenas um Preview da branch/PR que sera validada.
3. Abrir o Preview e confirmar que a tela de login renderiza antes de validar fluxos autenticados.
4. Criar ou atualizar `.env.example` com os nomes exatos esperados pelo codigo, sem valores reais:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Nao usar `VITE_SUPABASE_ANON_KEY` enquanto o codigo esperar `VITE_SUPABASE_PUBLISHABLE_KEY`.

## O que nao deve ser feito agora

- Nao rodar `supabase db push`.
- Nao aplicar migrations para tentar resolver a tela azul.
- Nao promover Preview para Production.
- Nao fazer merge enquanto o Preview nao renderizar login com ambiente correto.
- Nao commitar valores reais de Supabase.
- Nao validar paginas autenticadas antes de confirmar que `/` renderiza a tela de login.
- Nao tratar este sintoma primeiro como bug de UI ou rota; o erro acontece antes da montagem do React.

## Chaves Supabase no frontend

O frontend deste projeto deve usar exclusivamente a chave publica/anon do Supabase, exposta como `VITE_SUPABASE_PUBLISHABLE_KEY`. A `service_role` do Supabase nunca deve ser embarcada no bundle do navegador, em variaveis `VITE_*`, em arquivos commitados ou em headers expostos. A `service_role` ignora RLS e, se vazar, abre acesso administrativo total ao banco. Qualquer fluxo que precise de privilegios elevados (importacao oficial, jobs administrativos) acontece em terminal auditado ou em servidor de backend com a chave fora do alcance do cliente.

## Proximos passos antes do PR 3B

1. Corrigir a configuracao de ambiente do Preview no Vercel com os nomes exatos.
2. Gerar novo Preview da branch candidata ao PR 3B.
3. Repetir o teste Playwright somente na rota `/` e confirmar:
   - status HTTP 200;
   - `#root` nao vazio;
   - texto `PDDE Online` visivel;
   - ausencia de `supabaseUrl is required` ou `Invalid supabaseUrl`.
4. Resolver separadamente a divergencia `package.json` vs `package-lock.json`, porque `npm ci` falha hoje.
5. Depois de login renderizado, iniciar validacao autenticada com usuario de teste e escopo definido.
6. Somente apos isso preparar PR 3B.
