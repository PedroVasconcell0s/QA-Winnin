# QA Winnin Automation

Projeto de automação de testes E2E utilizando **Playwright**, **Cucumber (BDD)** e **TypeScript**.

## Estrutura do Projeto

O projeto segue o padrão **Commands Global** e **Elements Global**.

```
src/
  features/           # Arquivos .feature (Gherkin)
  steps/              # Step Definitions (Cucumber + Playwright)
  support/
    elements/         # Mapeamento global de elementos (Page Objects estáticos)
    commands/         # Comandos globais reutilizáveis
    world.ts          # Configuração do Cucumber World e Playwright
```
```
tests/
  api/
    helpers/
      emailUtils.js       # Geração de e-mails únicos
      usuariosClient.js   # Funções auxiliares para /usuarios
      authClient.js       # Login e criação de usuário + token
    usuarios.spec.js      # Regras de negócio + CRUD /usuarios
    login.spec.js         # Regras de /login
    produtos.spec.js      # Regras de negócio + CRUD /produtos
    carrinho.spec.js      # Regras de negócio + CRUD /carrinhos
```

## Instalação

```bash
npm install
npx playwright install
```

## Executando os Testes de Front

```bash
npm run test:bdd
```

## Executando os Testes de API

```bash
npx playwright test --project=serverest-api
```

## Executar apenas um arquivo de API, por exemplo o de carrinho:

```bash
npx playwright test tests/api/carrinho.spec.js --project=serverest-api
```

## Adicionando Novos Testes UI 

1. Crie um arquivo `.feature` em `src/features/`.
2. Adicione os elementos necessários em `src/support/elements/global.elements.ts`.
3. Crie ou reutilize comandos em `src/support/commands/global.commands.ts`.
4. Implemente os passos em `src/steps/`.

## Adicionando Novos Testes API 

1. Criar um arquivo *.spec.js em tests/api/.
2. Se precisar de lógica comum (como criação de usuário, login, payloads), adicionar helpers em tests/api/helpers/.


## Configuração

- **Browser**: Por padrão roda no Chromium. Para mudar, altere `src/support/world.ts` ou use variáveis de ambiente (implementação futura).
- **Headless**: Configurado como `false` (com navegador visível) em `src/support/world.ts`. Altere para `true` para rodar em background.


