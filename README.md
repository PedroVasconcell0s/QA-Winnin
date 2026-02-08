# QA Winnin Automation

Projeto de automação de testes E2E utilizando **Playwright**, **Cucumber (BDD)** e **TypeScript**.

## Estrutura do Projeto

O projeto segue o padrão **Commands Global** e **Elements Global**.

```
src/
  features/         # Arquivos .feature (Gherkin)
  steps/            # Definição dos passos (Step Definitions)
  support/
    elements/       # Mapeamento global de elementos (Page Objects estáticos)
    commands/       # Comandos globais reutilizáveis
    world.ts        # Configuração do Cucumber World e Playwright
    hooks.ts        # Hooks (Before/After) para setup/teardown do browser
```

## Instalação

```bash
npm install
npx playwright install
```

## Executando os Testes

```bash
npm run test:bdd
```

## Adicionando Novos Testes

1. Crie um arquivo `.feature` em `src/features/`.
2. Adicione os elementos necessários em `src/support/elements/global.elements.ts`.
3. Crie ou reutilize comandos em `src/support/commands/global.commands.ts`.
4. Implemente os passos em `src/steps/`.

## Configuração

- **Browser**: Por padrão roda no Chromium. Para mudar, altere `src/support/world.ts` ou use variáveis de ambiente (implementação futura).
- **Headless**: Configurado como `false` (com navegador visível) em `src/support/world.ts`. Altere para `true` para rodar em background.
