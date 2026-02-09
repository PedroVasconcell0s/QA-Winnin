const { test, expect } = require('@playwright/test');
const { criarUsuarioELogar } = require('./helpers/authClient');

function gerarNomeProdutoUnico(base = 'Produto') {
  return `${base} - ${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function gerarProdutoRandomico() {
  return {
    nome: gerarNomeProdutoUnico('Produto Random'),
    preco: Math.floor(Math.random() * 900) + 100,
    descricao: `Descricao random ${Math.floor(Math.random() * 10000)}`,
    quantidade: Math.floor(Math.random() * 500) + 1,
  };
}

test.describe('Produtos - ServeRest', () => {
  let admin;
  let cliente;

  test.beforeAll(async ({ request }) => {
    admin = await criarUsuarioELogar(request, { administrador: 'true' });
    cliente = await criarUsuarioELogar(request, { administrador: 'false' });
  });

  test.describe('POST /produtos - validações', () => {
    test('201 - deve cadastrar produto com sucesso (admin + token válido)', async ({ request }) => {
      const nomeProduto = gerarNomeProdutoUnico();

      const payload = {
        nome: nomeProduto,
        preco: 470,
        descricao: 'Mouse',
        quantidade: 381,
      };

      const resp = await request.post('/produtos', {
        headers: {
          Authorization: admin.token,
        },
        data: payload,
      });

      expect(resp.status()).toBe(201);

      const body = await resp.json();
      expect(body).toHaveProperty('message', 'Cadastro realizado com sucesso');
      expect(body).toHaveProperty('_id');
      expect(typeof body._id).toBe('string');
    });

    test('400 - não deve permitir cadastro de produto com nome já existente', async ({ request }) => {
      const nomeProduto = gerarNomeProdutoUnico();

      const payload = {
        nome: nomeProduto,
        preco: 470,
        descricao: 'Mouse',
        quantidade: 381,
      };

      const resp1 = await request.post('/produtos', {
        headers: { Authorization: admin.token },
        data: payload,
      });
      expect(resp1.status()).toBe(201);

      const resp2 = await request.post('/produtos', {
        headers: { Authorization: admin.token },
        data: payload,
      });

      expect(resp2.status()).toBe(400);

      const body2 = await resp2.json();
      expect(body2).toHaveProperty('message', 'Já existe produto com esse nome');
    });

    test('401 - deve retornar erro quando token estiver ausente', async ({ request }) => {
      const payload = {
        nome: gerarNomeProdutoUnico(),
        preco: 470,
        descricao: 'Mouse',
        quantidade: 381,
      };

      const resp = await request.post('/produtos', {
        data: payload,
      });

      expect(resp.status()).toBe(401);

      const body = await resp.json();
      expect(body).toHaveProperty(
        'message',
        'Token de acesso ausente, inválido, expirado ou usuário do token não existe mais'
      );
    });

    test('401 - deve retornar erro quando token for inválido', async ({ request }) => {
      const payload = {
        nome: gerarNomeProdutoUnico(),
        preco: 470,
        descricao: 'Mouse',
        quantidade: 381,
      };

      const resp = await request.post('/produtos', {
        headers: {
          Authorization: 'Bearer token-invalido-123',
        },
        data: payload,
      });

      expect(resp.status()).toBe(401);

      const body = await resp.json();
      expect(body).toHaveProperty(
        'message',
        'Token de acesso ausente, inválido, expirado ou usuário do token não existe mais'
      );
    });

    test('403 - rota exclusiva para administradores (usuário não admin)', async ({ request }) => {
      const payload = {
        nome: gerarNomeProdutoUnico(),
        preco: 470,
        descricao: 'Mouse',
        quantidade: 381,
      };

      const resp = await request.post('/produtos', {
        headers: {
          Authorization: cliente.token,
        },
        data: payload,
      });

      expect(resp.status()).toBe(403);

      const body = await resp.json();
      expect(body).toHaveProperty('message', 'Rota exclusiva para administradores');
    });

    test('400 - não deve permitir criar produto com dados inválidos (preço/quantidade negativos)', async ({ request }) => {
      const payloadInvalido = {
        nome: gerarNomeProdutoUnico(),
        preco: -10,
        descricao: 'Mouse',
        quantidade: -5,
      };

      const resp = await request.post('/produtos', {
        headers: {
          Authorization: admin.token,
        },
        data: payloadInvalido,
      });

      expect(resp.status()).toBe(400);

      const body = await resp.json();
      const bodyString = JSON.stringify(body).toLowerCase();
      expect(bodyString).toMatch(/preco|preço/);
      expect(bodyString).toMatch(/quantidade/);
    });

    test.describe('400 - não deve permitir criar produto sem campos obrigatórios', () => {
      const camposObrigatorios = ['nome', 'preco', 'descricao', 'quantidade'];

      for (const campo of camposObrigatorios) {
        test(`campo obrigatório ausente: "${campo}"`, async ({ request }) => {
          const basePayload = {
            nome: gerarNomeProdutoUnico(),
            preco: 470,
            descricao: 'Mouse',
            quantidade: 381,
          };

          delete basePayload[campo];

          const resp = await request.post('/produtos', {
            headers: { Authorization: admin.token },
            data: basePayload,
          });

          expect(resp.status()).toBe(400);

          const body = await resp.json();
          const bodyString = JSON.stringify(body).toLowerCase();
          const regex = new RegExp(`${campo}.*obrigatór|${campo}.*required`, 'i');
          expect(bodyString).toMatch(regex);
        });
      }
    });
  });

  test.describe('PUT /produtos/:id - validações', () => {
    test('401 - não deve permitir edição sem token', async ({ request }) => {
      const produtoOriginal = gerarProdutoRandomico();

      const respPost = await request.post('/produtos', {
        headers: { Authorization: admin.token },
        data: produtoOriginal,
      });
      expect(respPost.status()).toBe(201);
      const bodyPost = await respPost.json();
      const produtoId = bodyPost._id;

      const payloadPut = gerarProdutoRandomico();

      const respPut = await request.put(`/produtos/${produtoId}`, {
        data: payloadPut,
      });

      expect(respPut.status()).toBe(401);

      const bodyPut = await respPut.json();
      expect(bodyPut).toHaveProperty(
        'message',
        'Token de acesso ausente, inválido, expirado ou usuário do token não existe mais'
      );
    });

    test('401 - não deve permitir edição com token inválido', async ({ request }) => {
      const produtoOriginal = gerarProdutoRandomico();

      const respPost = await request.post('/produtos', {
        headers: { Authorization: admin.token },
        data: produtoOriginal,
      });
      expect(respPost.status()).toBe(201);
      const bodyPost = await respPost.json();
      const produtoId = bodyPost._id;

      const payloadPut = gerarProdutoRandomico();

      const respPut = await request.put(`/produtos/${produtoId}`, {
        headers: {
          Authorization: 'Bearer token-invalido-123',
        },
        data: payloadPut,
      });

      expect(respPut.status()).toBe(401);

      const bodyPut = await respPut.json();
      expect(bodyPut).toHaveProperty(
        'message',
        'Token de acesso ausente, inválido, expirado ou usuário do token não existe mais'
      );
    });

    test('403 - não deve permitir edição com usuário não admin', async ({ request }) => {
      const produtoOriginal = gerarProdutoRandomico();

      const respPost = await request.post('/produtos', {
        headers: { Authorization: admin.token },
        data: produtoOriginal,
      });
      expect(respPost.status()).toBe(201);
      const bodyPost = await respPost.json();
      const produtoId = bodyPost._id;

      const payloadPut = gerarProdutoRandomico();

      const respPut = await request.put(`/produtos/${produtoId}`, {
        headers: {
          Authorization: cliente.token,
        },
        data: payloadPut,
      });

      expect(respPut.status()).toBe(403);

      const bodyPut = await respPut.json();
      expect(bodyPut).toHaveProperty('message', 'Rota exclusiva para administradores');
    });

    test('400 - não deve permitir editar produto com dados inválidos (preço/quantidade negativos)', async ({ request }) => {
      const produtoOriginal = gerarProdutoRandomico();

      const respPost = await request.post('/produtos', {
        headers: { Authorization: admin.token },
        data: produtoOriginal,
      });
      expect(respPost.status()).toBe(201);
      const bodyPost = await respPost.json();
      const produtoId = bodyPost._id;

      const payloadInvalido = {
        nome: gerarNomeProdutoUnico(),
        preco: -10,
        descricao: 'Mouse invalido',
        quantidade: -5,
      };

      const respPut = await request.put(`/produtos/${produtoId}`, {
        headers: {
          Authorization: admin.token,
        },
        data: payloadInvalido,
      });

      expect(respPut.status()).toBe(400);

      const bodyPut = await respPut.json();
      const bodyString = JSON.stringify(bodyPut).toLowerCase();
      expect(bodyString).toMatch(/preco|preço/);
      expect(bodyString).toMatch(/quantidade/);
    });

    test.describe('400 - não deve permitir editar produto sem campos obrigatórios', () => {
      const camposObrigatorios = ['nome', 'preco', 'descricao', 'quantidade'];

      for (const campo of camposObrigatorios) {
        test(`campo obrigatório ausente na edição: "${campo}"`, async ({ request }) => {
          const produtoOriginal = gerarProdutoRandomico();

          const respPost = await request.post('/produtos', {
            headers: { Authorization: admin.token },
            data: produtoOriginal,
          });
          expect(respPost.status()).toBe(201);
          const bodyPost = await respPost.json();
          const produtoId = bodyPost._id;

          const payloadPut = { ...gerarProdutoRandomico() };
          delete payloadPut[campo];

          const respPut = await request.put(`/produtos/${produtoId}`, {
            headers: { Authorization: admin.token },
            data: payloadPut,
          });

          expect(respPut.status()).toBe(400);

          const bodyPut = await respPut.json();
          const bodyString = JSON.stringify(bodyPut).toLowerCase();
          const regex = new RegExp(`${campo}.*obrigatór|${campo}.*required`, 'i');
          expect(bodyString).toMatch(regex);
        });
      }
    });

    test('200 - deve permitir editar produto sem alterar nada (payload idêntico)', async ({ request }) => {
      const produtoOriginal = gerarProdutoRandomico();

      const respPost = await request.post('/produtos', {
        headers: { Authorization: admin.token },
        data: produtoOriginal,
      });
      expect(respPost.status()).toBe(201);
      const bodyPost = await respPost.json();
      const produtoId = bodyPost._id;

      const payloadPut = { ...produtoOriginal };

      const respPut = await request.put(`/produtos/${produtoId}`, {
        headers: {
          Authorization: admin.token,
        },
        data: payloadPut,
      });

      expect(respPut.status()).toBe(200);

      const bodyPut = await respPut.json();
      expect(bodyPut).toHaveProperty('message');
      expect(bodyPut.message).toMatch(/Registro alterado com sucesso/i);

      const respGet = await request.get(`/produtos/${produtoId}`);
      expect(respGet.status()).toBe(200);

      const bodyGet = await respGet.json();
      expect(bodyGet._id).toBe(produtoId);
      expect(bodyGet.nome).toBe(produtoOriginal.nome);
      expect(bodyGet.preco).toBe(produtoOriginal.preco);
      expect(bodyGet.descricao).toBe(produtoOriginal.descricao);
      expect(bodyGet.quantidade).toBe(produtoOriginal.quantidade);
    });
  });

  test.describe('CRUD de produto por etapas', () => {
    let produtoId;
    let produtoInicial;
    let produtoEditado;

    test('1 - criar produto (POST /produtos)', async ({ request }) => {
      produtoInicial = gerarProdutoRandomico();

      const respPost = await request.post('/produtos', {
        headers: {
          Authorization: admin.token,
        },
        data: produtoInicial,
      });

      expect(respPost.status()).toBe(201);

      const bodyPost = await respPost.json();
      expect(bodyPost).toHaveProperty('_id');
      expect(bodyPost).toHaveProperty('message', 'Cadastro realizado com sucesso');

      produtoId = bodyPost._id;
    });

    test('2 - editar produto criado (PUT /produtos/:id)', async ({ request }) => {
      expect(produtoId).toBeTruthy();

      produtoEditado = gerarProdutoRandomico();

      const respPut = await request.put(`/produtos/${produtoId}`, {
        headers: {
          Authorization: admin.token,
        },
        data: produtoEditado,
      });

      expect(respPut.status()).toBe(200);

      const bodyPut = await respPut.json();
      expect(bodyPut).toHaveProperty('message');
      expect(bodyPut.message).toMatch(/Registro alterado com sucesso/i);
    });

    test('3 - consultar produto por ID (GET /produtos/:id)', async ({ request }) => {
      expect(produtoId).toBeTruthy();

      const respGet = await request.get(`/produtos/${produtoId}`);
      expect(respGet.status()).toBe(200);

      const bodyGet = await respGet.json();
      expect(bodyGet._id).toBe(produtoId);
      expect(bodyGet.nome).toBe(produtoEditado.nome);
      expect(bodyGet.preco).toBe(produtoEditado.preco);
      expect(bodyGet.descricao).toBe(produtoEditado.descricao);
      expect(bodyGet.quantidade).toBe(produtoEditado.quantidade);
    });

    test('4 - deletar produto por ID (DELETE /produtos/:id)', async ({ request }) => {
      expect(produtoId).toBeTruthy();

      const respDelete = await request.delete(`/produtos/${produtoId}`, {
        headers: {
          Authorization: admin.token,
        },
      });

      expect(respDelete.status()).toBe(200);

      const bodyDelete = await respDelete.json();
      expect(bodyDelete).toHaveProperty('message');
      expect(bodyDelete.message).toMatch(/Registro excluído com sucesso/i);
    });
  });
});