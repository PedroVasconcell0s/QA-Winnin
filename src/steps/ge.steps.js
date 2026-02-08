const {
  Given,
  When,
  Then,
  After,
  setDefaultTimeout,
} = require('@cucumber/cucumber');

const { chromium, expect } = require('@playwright/test');
const { GlobalCommands } = require('../support/commands/global.commands');

setDefaultTimeout(60 * 1000);

Given('que acesso o site GE', async function () {
  this.browser = await chromium.launch({ headless: false });

  this.context = await this.browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  this.page = await this.context.newPage();
  this.commands = new GlobalCommands(this.page);

  await this.page.goto('https://ge.globo.com', {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });

  await this.page.locator('header').waitFor({ timeout: 30000 });
});

Then('o título deve conter {string}', async function (texto) {
  await expect(this.page).toHaveTitle(new RegExp(texto, 'i'));
});

Then('visualizar o menu {string}', async function (menu) {
  await this.commands.visualizarMenu(menu);
});

When('busco por {string}', async function (texto) {
  await this.commands.buscar(texto);
});

Then('encontro resultados refente a {string}', async function (texto) {
  await this.commands.validarBusca(texto);
});

Then(
  'devo ver título, imagem, resumo e link em ao menos {int} notícias do feed',
  async function (minimo) {
    await this.commands.validarFeedCompleto(minimo);
  }
);

After(async function () {
  if (this.browser) {
    await this.browser.close();
  }
});