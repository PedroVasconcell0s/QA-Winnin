const { test, expect } = require('@playwright/test');
const { gerarEmail } = require('./helpers/emailUtils');

test.describe('CRUD Usuários - ServeRest (/usuarios)', () => {

  test('POST /usuarios - cria usuário com sucesso e valida coerência via GET', async ({ request }) => {
    const email = gerarEmail();
    const payload = {
      nome: "Fulano da Silva",
      email,
      password: "teste",
      administrador: "true",
    };

    const resp = await request.post('/usuarios', { data: payload });
    expect(resp.status()).toBe(201);

    const body = await resp.json();
    expect(body).toHaveProperty('message', 'Cadastro realizado com sucesso');
    expect(body).toHaveProperty('_id');
    const userId = body._id;

    // Coerência via GET
    const respGet = await request.get(`/usuarios/${userId}`);
    expect(respGet.status()).toBe(200);

    const bodyGet = await respGet.json();
    expect(bodyGet._id).toBe(userId);
    expect(bodyGet.nome).toBe(payload.nome);
    expect(bodyGet.email).toBe(payload.email);
    expect(bodyGet.administrador).toBe(payload.administrador);
  });

  test('POST /usuarios - não deve permitir email inválido (400)', async ({ request }) => {
    const payload = {
      nome: "Fulano Email Invalido",
      email: "email-invalido",
      password: "teste",
      administrador: "true",
    };

    const resp = await request.post('/usuarios', { data: payload });
    expect(resp.status()).toBe(400);

    const body = await resp.json();
    const bodyString = JSON.stringify(body).toLowerCase();
    expect(bodyString).toMatch(/email.*válid/); // "deve ser um email válido", etc.
  });

  test('POST /usuarios - não deve permitir administrador diferente de "true" ou "false" (400)', async ({ request }) => {
    const payload = {
      nome: "Fulano Admin Invalido",
      email: gerarEmail(),
      password: "teste",
      administrador: "sim",
    };

    const resp = await request.post('/usuarios', { data: payload });
    expect(resp.status()).toBe(400);

    const body = await resp.json();
    const bodyString = JSON.stringify(body).toLowerCase();
    expect(bodyString).toMatch(/administrador.*true.*false|administrador.*inválid/);
  });

  test.describe('POST /usuarios - campos obrigatórios ausentes (400)', () => {
    const camposObrigatorios = ['nome', 'email', 'password', 'administrador'];

    for (const campo of camposObrigatorios) {
      test(`não deve permitir criação sem o campo obrigatório "${campo}"`, async ({ request }) => {
        const payloadBase = {
          nome: "Fulano Campos Obrigatorios",
          email: gerarEmail(),
          password: "teste",
          administrador: "true",
        };

        delete payloadBase[campo];

        const resp = await request.post('/usuarios', { data: payloadBase });
        expect(resp.status()).toBe(400);

        const body = await resp.json();
        const bodyString = JSON.stringify(body).toLowerCase();
        const regex = new RegExp(`${campo}.*obrigatór|${campo}.*required`, 'i');
        expect(bodyString).toMatch(regex);
      });
    }
  });

  test('PUT /usuarios/:id - deve editar usuário com sucesso (200)', async ({ request }) => {
    // cria usuário
    const email = gerarEmail();
    const payloadPost = {
      nome: "Fulano da Silva",
      email,
      password: "teste",
      administrador: "true",
    };

    const respPost = await request.post('/usuarios', { data: payloadPost });
    expect(respPost.status()).toBe(201);
    const bodyPost = await respPost.json();
    const userId = bodyPost._id;

    // altera usuário
    const payloadPut = {
      nome: "Fulano da Silva Editado",
      email,
      password: "teste123",
      administrador: "true",
    };

    const respPut = await request.put(`/usuarios/${userId}`, { data: payloadPut });
    expect(respPut.status()).toBe(200);

    const bodyPut = await respPut.json();
    expect(bodyPut).toHaveProperty('message');
    expect(bodyPut.message).toMatch(/Registro alterado com sucesso/i);
  });

  test('PUT /usuarios/:id - deve retornar 400 ao editar com e-mail já cadastrado', async ({ request }) => {
    const emailA = gerarEmail();
    const usuarioA = { nome: "Usuário A", email: emailA, password: "senhaA", administrador: "true" };

    const respA = await request.post('/usuarios', { data: usuarioA });
    expect(respA.status()).toBe(201);
    const bodyA = await respA.json();
    const idA = bodyA._id;

    const emailB = gerarEmail();
    const usuarioB = { nome: "Usuário B", email: emailB, password: "senhaB", administrador: "false" };

    const respB = await request.post('/usuarios', { data: usuarioB });
    expect(respB.status()).toBe(201);

    const payloadPutDuplicado = {
      nome: "Usuário A Editado",
      email: emailB, // já usado
      password: "novaSenhaA",
      administrador: "true",
    };

    const respPutDup = await request.put(`/usuarios/${idA}`, { data: payloadPutDuplicado });
    expect(respPutDup.status()).toBe(400);

    const bodyPutDup = await respPutDup.json();
    expect(bodyPutDup).toHaveProperty('message');
    expect(bodyPutDup.message).toMatch(/email.*já.*sendo.*usado/i);
  });

  test('GET /usuarios/:id - deve refletir alterações feitas no PUT (200)', async ({ request }) => {
    const email = gerarEmail();
    const payloadPost = {
      nome: "Fulano da Silva",
      email,
      password: "teste",
      administrador: "true",
    };

    const respPost = await request.post('/usuarios', { data: payloadPost });
    expect(respPost.status()).toBe(201);
    const bodyPost = await respPost.json();
    const userId = bodyPost._id;

    const payloadPut = {
      nome: "Fulano da Silva Editado",
      email,
      password: "teste123",
      administrador: "true",
    };

    const respPut = await request.put(`/usuarios/${userId}`, { data: payloadPut });
    expect(respPut.status()).toBe(200);

    const respGet = await request.get(`/usuarios/${userId}`);
    expect(respGet.status()).toBe(200);

    const bodyGet = await respGet.json();
    expect(bodyGet._id).toBe(userId);
    expect(bodyGet.nome).toBe(payloadPut.nome);
    expect(bodyGet.email).toBe(email); // email original
    expect(bodyGet.administrador).toBe("true");
  });

  test('DELETE /usuarios/:id - deve excluir usuário com sucesso (200)', async ({ request }) => {
    const email = gerarEmail();
    const usuario = { nome: "Usuario a Excluir", email, password: "senha", administrador: "false" };

    const respPost = await request.post('/usuarios', { data: usuario });
    expect(respPost.status()).toBe(201);
    const bodyPost = await respPost.json();
    const userId = bodyPost._id;

    const respDelete = await request.delete(`/usuarios/${userId}`);
    expect(respDelete.status()).toBe(200);

    const bodyDelete = await respDelete.json();
    expect(bodyDelete).toHaveProperty('message');
    expect(bodyDelete.message).toMatch(/Registro excluído com sucesso/i);
  });

  test('DELETE /usuarios/:id - após excluir, GET deve retornar 400 (não encontrado)', async ({ request }) => {
    const email = gerarEmail();
    const usuario = { nome: "Usuario para Delete+GET", email, password: "senha", administrador: "true" };

    const respPost = await request.post('/usuarios', { data: usuario });
    expect(respPost.status()).toBe(201);
    const bodyPost = await respPost.json();
    const userId = bodyPost._id;

    const respDelete = await request.delete(`/usuarios/${userId}`);
    expect(respDelete.status()).toBe(200);

    const respGet = await request.get(`/usuarios/${userId}`);
    expect(respGet.status()).toBe(400);

    const bodyGet = await respGet.json();
    expect(bodyGet).toHaveProperty('message');
    expect(bodyGet.message).toMatch(/não encontrado/i);
  });

  test('DELETE /usuarios/:id - segunda exclusão do mesmo id deve indicar nenhum registro excluído (200)', async ({ request }) => {
    const email = gerarEmail();
    const usuario = { nome: "Usuario para Delete Duplo", email, password: "senha", administrador: "true" };

    const respPost = await request.post('/usuarios', { data: usuario });
    expect(respPost.status()).toBe(201);
    const bodyPost = await respPost.json();
    const userId = bodyPost._id;

    const respDelete1 = await request.delete(`/usuarios/${userId}`);
    expect(respDelete1.status()).toBe(200);

    const respDelete2 = await request.delete(`/usuarios/${userId}`);
    expect(respDelete2.status()).toBe(200);

    const bodyDelete2 = await respDelete2.json();
    expect(bodyDelete2).toHaveProperty('message');
    expect(bodyDelete2.message).toMatch(/Nenhum registro excluído|Registro inexistente|não encontrado/i);
  });
});