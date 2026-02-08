// src/support/elements/global.elements.js
class GlobalElements {
  constructor(page) {
    this.page = page;
  }

  menuItem(texto) {
    return this.page.locator(`header a:has-text("${texto}")`).first();
  }

  inputBusca() {
    return this.page.locator('#busca-campo');
  }

  resultadosBusca() {
    return this.page.locator(
      'li.widget--navigational a.widget--navigational__title'
    );
  }

  seletorNoticiasBase() {
    return 'div.feed-post-body';
  }

  noticias() {
    return this.page.locator(this.seletorNoticiasBase());
  }

  botaoVejaMais() {
    return this.page.locator(
      'a:has-text("Veja mais"), a[href*="/index/feed/pagina-"]'
    );
  }

  linkPrincipalNoticia(noticia) {
    return noticia
      .locator(
        'a.feed-post-link, a.feed-post-figure-link, a[href*="ge.globo.com"]'
      )
      .first();
  }

  imagemNoticia(noticia) {
    return noticia
      .locator(
        'picture img, figure img, .bstn-fd-picture-image, img[loading]'
      )
      .first();
  }

  resumoNoticia(noticia) {
    return noticia.locator(
      [
        '[data-testid*="summary"]',
        '.feed-post-body-resumo',
        '.summary',
        'p:not(:has(a)):not(:empty)',
      ].join(', ')
    );
  }
}

module.exports = { GlobalElements };