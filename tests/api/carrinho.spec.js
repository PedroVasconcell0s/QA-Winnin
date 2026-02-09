// tests/api/carrinho.spec.js
const { test, expect } = require('@playwright/test');
const { criarUsuarioELogar } = require('./helpers/authClient');

function gerarNomeProdutoUnico(base = 'Produto') {
  return `${base} - ${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function gerarProdutoRandomico(quantidade) {
  return {
    nome: gerarNomeProdutoUnico('Produto Carrinho'),
    preco: Math.floor(Math.random() * 900) + 100,
    descricao: `Descricao carrinho ${Math.floor(Math.random() * 10000)}`,
    quantidade: quantidade ?? Math.floor(Math.random() * 500) + 1,
  };
}

async function criarProduto(api, tokenAdmin, overrides = {}) {
  const base = gerarProdutoRandomico(overrides.quantidade);
  const payload = { ...base, ...overrides };
  const resp = await api.post('/produtos', {
    headers: { Authorization: tokenAdmin },
    data: payload,
  });
  expect(resp.status()).toBe(201);
  const body = await resp.json();
  return { ...payload, _id: body._id };
}

test.describe('Carrinho - ServeRest', () => {
  let admin;

  test.beforeAll(async ({ request }) => {
    admin = await criarUsuarioELogar(request, { administrador: 'true' });
  });

  test.describe('POST /carrinhos - validações', () => {
    test('201 - deve criar carrinho com sucesso', async ({ request }) => {
      const cliente = await criarUsuarioELogar(request, { administrador: 'false' });

      const produto1 = await criarProduto(request, admin.token);
      const produto2 = await criarProduto(request, admin.token);

      const payloadCarrinho = {
        produtos: [
          { idProduto: produto1._id, quantidade: 1 },
          { idProduto: produto2._id, quantidade: 3 },
        ],
      };

      const resp = await request.post('/carrinhos', {
        headers: { Authorization: cliente.token },
        data: payloadCarrinho,
      });

      expect(resp.status()).toBe(201);

      const body = await resp.json();
      expect(body).toHaveProperty('message', 'Cadastro realizado com sucesso');
      expect(body).toHaveProperty('_id');
      expect(typeof body._id).toBe('string');
    });

    test('401 - não deve permitir criar carrinho com token ausente', async ({ request }) => {
      const produto = await criarProduto(request, admin.token);

      const payloadCarrinho = {
        produtos: [{ idProduto: produto._id, quantidade: 1 }],
      };

      const resp = await request.post('/carrinhos', {
        data: payloadCarrinho,
      });

      expect(resp.status()).toBe(401);

      const body = await resp.json();
      expect(body).toHaveProperty(
        'message',
        'Token de acesso ausente, inválido, expirado ou usuário do token não existe mais'
      );
    });

    test('401 - não deve permitir criar carrinho com token inválido', async ({ request }) => {
      const produto = await criarProduto(request, admin.token);

      const payloadCarrinho = {
        produtos: [{ idProduto: produto._id, quantidade: 1 }],
      };

      const resp = await request.post('/carrinhos', {
        headers: { Authorization: 'Bearer token-invalido-123' },
        data: payloadCarrinho,
      });

      expect(resp.status()).toBe(401);

      const body = await resp.json();
      expect(body).toHaveProperty(
        'message',
        'Token de acesso ausente, inválido, expirado ou usuário do token não existe mais'
      );
    });

    test('400 - não deve permitir criar carrinho com idProduto inexistente', async ({ request }) => {
      const cliente = await criarUsuarioELogar(request, { administrador: 'false' });

      const payloadCarrinho = {
        produtos: [{ idProduto: 'idInexistente123456', quantidade: 1 }],
      };

      const resp = await request.post('/carrinhos', {
        headers: { Authorization: cliente.token },
        data: payloadCarrinho,
      });

      expect(resp.status()).toBe(400);

      const body = await resp.json();
      expect(body).toHaveProperty('message', 'Produto não encontrado');
    });

    test('400 - não deve permitir quantidade menor ou igual a zero', async ({ request }) => {
      const cliente = await criarUsuarioELogar(request, { administrador: 'false' });
      const produto = await criarProduto(request, admin.token, { quantidade: 10 });

      const payloadCarrinho = {
        produtos: [{ idProduto: produto._id, quantidade: 0 }],
      };

      const resp = await request.post('/carrinhos', {
        headers: { Authorization: cliente.token },
        data: payloadCarrinho,
      });

      expect(resp.status()).toBe(400);

      const body = await resp.json();
      const bodyString = JSON.stringify(body).toLowerCase();
      expect(bodyString).toMatch(/quantidade.*número positivo/);
    });

    test('400 - não deve permitir produto duplicado no mesmo carrinho', async ({ request }) => {
      const cliente = await criarUsuarioELogar(request, { administrador: 'false' });
      const produto = await criarProduto(request, admin.token);

      const payloadCarrinho = {
        produtos: [
          { idProduto: produto._id, quantidade: 1 },
          { idProduto: produto._id, quantidade: 2 },
        ],
      };

      const resp = await request.post('/carrinhos', {
        headers: { Authorization: cliente.token },
        data: payloadCarrinho,
      });

      expect(resp.status()).toBe(400);

      const body = await resp.json();
      expect(body).toHaveProperty('message', 'Não é permitido possuir produto duplicado');
    });

    test('400 - não é permitido ter mais de 1 carrinho para o mesmo usuário', async ({ request }) => {
      const cliente = await criarUsuarioELogar(request, { administrador: 'false' });
      const produto1 = await criarProduto(request, admin.token);
      const produto2 = await criarProduto(request, admin.token);

      const payloadCarrinho1 = {
        produtos: [{ idProduto: produto1._id, quantidade: 1 }],
      };

      const payloadCarrinho2 = {
        produtos: [{ idProduto: produto2._id, quantidade: 2 }],
      };

      const resp1 = await request.post('/carrinhos', {
        headers: { Authorization: cliente.token },
        data: payloadCarrinho1,
      });
      expect(resp1.status()).toBe(201);

      const resp2 = await request.post('/carrinhos', {
        headers: { Authorization: cliente.token },
        data: payloadCarrinho2,
      });

      expect(resp2.status()).toBe(400);

      const body2 = await resp2.json();
      expect(body2).toHaveProperty('message', 'Não é permitido ter mais de 1 carrinho');
    });
  });

  test.describe('GET /carrinhos/:id - validações', () => {
    test('200 - deve retornar carrinho encontrado com dados corretos', async ({ request }) => {
      const cliente = await criarUsuarioELogar(request, { administrador: 'false' });

      const produto1 = await criarProduto(request, admin.token, { preco: 470 });
      const produto2 = await criarProduto(request, admin.token, { preco: 5240 });

      const quantidade1 = 2;
      const quantidade2 = 1;

      const payloadCarrinho = {
        produtos: [
          { idProduto: produto1._id, quantidade: quantidade1 },
          { idProduto: produto2._id, quantidade: quantidade2 },
        ],
      };

      const respPost = await request.post('/carrinhos', {
        headers: { Authorization: cliente.token },
        data: payloadCarrinho,
      });

      expect(respPost.status()).toBe(201);
      const bodyPost = await respPost.json();
      const carrinhoId = bodyPost._id;

      const respGet = await request.get(`/carrinhos/${carrinhoId}`);
      expect(respGet.status()).toBe(200);

      const bodyGet = await respGet.json();
      expect(bodyGet._id).toBe(carrinhoId);
      expect(bodyGet.idUsuario).toBe(cliente._id);

      const precoTotalEsperado =
        produto1.preco * quantidade1 + produto2.preco * quantidade2;
      const quantidadeTotalEsperada = quantidade1 + quantidade2;

      expect(bodyGet.precoTotal).toBe(precoTotalEsperado);
      expect(bodyGet.quantidadeTotal).toBe(quantidadeTotalEsperada);

      const produtosArrayRaw = bodyGet.produtos;
      const itens =
        Array.isArray(produtosArrayRaw) && Array.isArray(produtosArrayRaw[0])
          ? produtosArrayRaw[0]
          : produtosArrayRaw;

      expect(Array.isArray(itens)).toBe(true);

      const item1 = itens.find((p) => p.idProduto === produto1._id);
      const item2 = itens.find((p) => p.idProduto === produto2._id);

      expect(item1).toBeTruthy();
      expect(item1.quantidade).toBe(quantidade1);
      expect(item1.precoUnitario).toBe(produto1.preco);

      expect(item2).toBeTruthy();
      expect(item2.quantidade).toBe(quantidade2);
      expect(item2.precoUnitario).toBe(produto2.preco);
    });

    test('400 - deve retornar erro quando carrinho não for encontrado', async ({ request }) => {
      const idInexistenteFormatoValido = 'A1B2C3D4E5F6G7H8';

      const resp = await request.get(`/carrinhos/${idInexistenteFormatoValido}`);
      expect(resp.status()).toBe(400);

      const body = await resp.json();
      const bodyString = JSON.stringify(body).toLowerCase();
      expect(
        body.message === 'Carrinho não encontrado' ||
        bodyString.includes('carrinho não encontrado') ||
        bodyString.includes('id deve ter exatamente 16 caracteres alfanuméricos')
      ).toBeTruthy();
    });
  });

  test.describe('DELETE /carrinhos/concluir-compra - validações', () => {
    test('200 - deve concluir compra e excluir carrinho do usuário', async ({ request }) => {
      const cliente = await criarUsuarioELogar(request, { administrador: 'false' });
      const produto = await criarProduto(request, admin.token, { quantidade: 10 });

      const payloadCarrinho = {
        produtos: [{ idProduto: produto._id, quantidade: 2 }],
      };

      const respCarrinho = await request.post('/carrinhos', {
        headers: { Authorization: cliente.token },
        data: payloadCarrinho,
      });
      expect(respCarrinho.status()).toBe(201);

      const respDelete = await request.delete('/carrinhos/concluir-compra', {
        headers: { Authorization: cliente.token },
      });

      expect(respDelete.status()).toBe(200);

      const bodyDelete = await respDelete.json();
      expect(bodyDelete).toHaveProperty('message', 'Registro excluído com sucesso');
    });

    test('200 - deve retornar mensagem quando não houver carrinho para o usuário', async ({ request }) => {
      const clienteSemCarrinho = await criarUsuarioELogar(request, { administrador: 'false' });

      const respDelete = await request.delete('/carrinhos/concluir-compra', {
        headers: { Authorization: clienteSemCarrinho.token },
      });

      expect(respDelete.status()).toBe(200);

      const bodyDelete = await respDelete.json();
      expect(bodyDelete).toHaveProperty('message', 'Não foi encontrado carrinho para esse usuário');
    });

    test('401 - não deve concluir compra com token ausente', async ({ request }) => {
      const respDelete = await request.delete('/carrinhos/concluir-compra');

      expect(respDelete.status()).toBe(401);

      const bodyDelete = await respDelete.json();
      expect(bodyDelete).toHaveProperty(
        'message',
        'Token de acesso ausente, inválido, expirado ou usuário do token não existe mais'
      );
    });

    test('401 - não deve concluir compra com token inválido', async ({ request }) => {
      const respDelete = await request.delete('/carrinhos/concluir-compra', {
        headers: { Authorization: 'Bearer token-invalido-123' },
      });

      expect(respDelete.status()).toBe(401);

      const bodyDelete = await respDelete.json();
      expect(bodyDelete).toHaveProperty(
        'message',
        'Token de acesso ausente, inválido, expirado ou usuário do token não existe mais'
      );
    });
  });

  test.describe('DELETE /carrinhos/cancelar-compra - validações', () => {
    test('200 - deve cancelar compra, excluir carrinho e reabastecer estoque', async ({ request }) => {
      const cliente = await criarUsuarioELogar(request, { administrador: 'false' });

      const quantidadeInicial = 10;
      const produto = await criarProduto(request, admin.token, { quantidade: quantidadeInicial });

      const respGetInicial = await request.get(`/produtos/${produto._id}`);
      expect(respGetInicial.status()).toBe(200);
      const bodyGetInicial = await respGetInicial.json();
      expect(bodyGetInicial.quantidade).toBe(quantidadeInicial);

      const quantidadeCarrinho = 3;
      const payloadCarrinho = {
        produtos: [{ idProduto: produto._id, quantidade: quantidadeCarrinho }],
      };

      const respCarrinho = await request.post('/carrinhos', {
        headers: { Authorization: cliente.token },
        data: payloadCarrinho,
      });
      expect(respCarrinho.status()).toBe(201);

      const respGetAposCarrinho = await request.get(`/produtos/${produto._id}`);
      expect(respGetAposCarrinho.status()).toBe(200);
      const bodyGetAposCarrinho = await respGetAposCarrinho.json();
      expect(bodyGetAposCarrinho.quantidade).toBe(
        quantidadeInicial - quantidadeCarrinho
      );

      const respCancelar = await request.delete('/carrinhos/cancelar-compra', {
        headers: { Authorization: cliente.token },
      });

      expect(respCancelar.status()).toBe(200);
      const bodyCancelar = await respCancelar.json();
      expect(bodyCancelar).toHaveProperty(
        'message',
        'Registro excluído com sucesso. Estoque dos produtos reabastecido'
      );

      const respGetFinal = await request.get(`/produtos/${produto._id}`);
      expect(respGetFinal.status()).toBe(200);
      const bodyGetFinal = await respGetFinal.json();
      expect(bodyGetFinal.quantidade).toBe(quantidadeInicial);
    });

    test('200 - deve retornar mensagem quando não houver carrinho para o usuário', async ({ request }) => {
      const clienteSemCarrinho = await criarUsuarioELogar(request, { administrador: 'false' });

      const respCancelar = await request.delete('/carrinhos/cancelar-compra', {
        headers: { Authorization: clienteSemCarrinho.token },
      });

      expect(respCancelar.status()).toBe(200);

      const bodyCancelar = await respCancelar.json();
      expect(bodyCancelar).toHaveProperty('message', 'Não foi encontrado carrinho para esse usuário');
    });

    test('401 - não deve cancelar compra com token ausente', async ({ request }) => {
      const respCancelar = await request.delete('/carrinhos/cancelar-compra');

      expect(respCancelar.status()).toBe(401);

      const bodyCancelar = await respCancelar.json();
      expect(bodyCancelar).toHaveProperty(
        'message',
        'Token de acesso ausente, inválido, expirado ou usuário do token não existe mais'
      );
    });

    test('401 - não deve cancelar compra com token inválido', async ({ request }) => {
      const respCancelar = await request.delete('/carrinhos/cancelar-compra', {
        headers: { Authorization: 'Bearer token-invalido-123' },
      });

      expect(respCancelar.status()).toBe(401);

      const bodyCancelar = await respCancelar.json();
      expect(bodyCancelar).toHaveProperty(
        'message',
        'Token de acesso ausente, inválido, expirado ou usuário do token não existe mais'
      );
    });
  });
});