// src/support/commands/global.commands.js
const { expect } = require('@playwright/test');
const { GlobalElements } = require('../elements/global.elements');

class GlobalCommands {
  constructor(page) {
    this.page = page;
    this.el = new GlobalElements(page);
  }

  async visualizarMenu(menu) {
    await this.page.evaluate(() => window.scrollTo(0, 0));

    const item = this.el.menuItem(menu);
    await expect(item).toBeVisible({ timeout: 20000 });
  }

  async buscar(texto) {
    const input = this.el.inputBusca();

    await input.waitFor({ state: 'attached' });
    await expect(input).toBeVisible({ timeout: 20000 });

    await input.click();
    await input.fill(texto);
    await input.press('Enter');
  }

  async validarBusca(texto) {
    const resultados = this.el.resultadosBusca();

    await expect(resultados.first()).toBeVisible({ timeout: 30000 });
    await expect(resultados.first()).toHaveText(new RegExp(texto, 'i'));
  }

  async carregarMaisNoticiasPaginaSeguinte() {
    const btnVejaMais = this.el.botaoVejaMais();
    const visivel = await btnVejaMais.isVisible().catch(() => false);
    if (!visivel) return false;

    await Promise.all([
      this.page.waitForLoadState('domcontentloaded'),
      btnVejaMais.click(),
    ]);

    await this.page.waitForSelector(this.el.seletorNoticiasBase(), {
      timeout: 40000,
    });

    await this.page.waitForTimeout(1000);

    return true;
  }

  async garantirNoticiaCarregada(idx, maxPaginas = 5) {
    let paginasVisitadas = 0;

    while (true) {
      const noticias = this.el.noticias();
      const total = await noticias.count();

      if (total > idx) {
        return noticias.nth(idx);
      }

      if (paginasVisitadas >= maxPaginas) {
        throw new Error(
          `Mesmo após navegar por ${maxPaginas} páginas de feed, não há notícia no índice ${idx}`
        );
      }

      const navegou = await this.carregarMaisNoticiasPaginaSeguinte();
      if (!navegou) {
        throw new Error(
          `Não há mais páginas de feed e não foi possível carregar a notícia de índice ${idx}`
        );
      }

      paginasVisitadas++;
    }
  }

  async obterTituloNoticiaLocator(noticia) {
    const possiveisSeletores = [
      'h2 a p',
      '.feed-post-body-title h2 a p',
      '.feed-post-body-title h2 a',
      '.feed-post-body-title h2',
      'h2 a',
      'h2',
      'h1 a p',
      'h1 a',
      'h1',
      '[data-testid*="title"]',
    ];

    for (const sel of possiveisSeletores) {
      const loc = noticia.locator(sel);
      if (await loc.count()) {
        return loc.first();
      }
    }

    return noticia.locator('h2 a p').first();
  }

  async validarFeedCompleto(minimo) {
    await this.page.waitForSelector(this.el.seletorNoticiasBase(), {
      timeout: 40000,
    });

    for (let i = 0; i < 2; i++) {
      await this.page.mouse.wheel(0, 2000);
      await this.page.waitForTimeout(800);
    }

    let noticiasValidas = 0;
    let idx = 0;

    while (noticiasValidas < minimo) {
      const noticia = await this.garantirNoticiaCarregada(idx);

      await noticia.scrollIntoViewIfNeeded();
      await expect(
        noticia,
        `Card de notícia no índice ${idx} não ficou visível`
      ).toBeVisible({ timeout: 15000 });

      const titulo = await this.obterTituloNoticiaLocator(noticia);

      const temTituloNoDom = await titulo.count();
      if (!temTituloNoDom) {
        idx++;
        continue;
      }

      await expect(
        titulo,
        `Notícia ${idx + 1}: título não visível`
      ).toBeVisible({ timeout: 15000 });

      const linkPrincipal = this.el.linkPrincipalNoticia(noticia);
      const temLink = await linkPrincipal.count();
      if (!temLink) {
        idx++;
        continue;
      }

      await expect(
        linkPrincipal,
        `Notícia ${idx + 1}: link principal não encontrado`
      ).toBeVisible({ timeout: 15000 });

      const href = await linkPrincipal.getAttribute('href');
      if (!href) {
        idx++;
        continue;
      }

      const imagem = this.el.imagemNoticia(noticia);
      const temImagem = await imagem.count();
      if (!temImagem) {
        idx++;
        continue;
      }

      await expect(
        imagem,
        `Notícia ${idx + 1}: imagem destacada não encontrada`
      ).toBeVisible({ timeout: 15000 });

      const src = await imagem.getAttribute('src');
      if (!src) {
        idx++;
        continue;
      }

      const resumo = this.el.resumoNoticia(noticia);
      let temResumoVisivel = false;
      try {
        temResumoVisivel =
          (await resumo.count()) > 0 && (await resumo.first().isVisible());
      } catch {
        temResumoVisivel = false;
      }

      const tituloVisivel = await titulo.isVisible();

      if (!(temResumoVisivel || tituloVisivel)) {
        idx++;
        continue;
      }

      noticiasValidas++;
      idx++;
    }

    expect(
      noticiasValidas,
      `Foram validadas apenas ${noticiasValidas} notícias com estrutura completa`
    ).toBeGreaterThanOrEqual(minimo);
  }
}

module.exports = { GlobalCommands };