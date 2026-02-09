const { test, expect } = require('@playwright/test');
const { criarUsuario } = require('./helpers/usuariosClient');

test.describe('Login - ServeRest (/login)', () => {
  let userAdmin;

  test.beforeAll(async ({ request }) => {
    // cria um admin para usar em todos os testes deste arquivo
    userAdmin = await criarUsuario(request, { administrador: "true" });
  });

  test('POST /login - login com sucesso utilizando usuário criado e capturar token', async ({ request }) => {
    const { email, password } = userAdmin;

    const resp = await request.post('/login', {
      data: { email, password },
    });

    expect(resp.status()).toBe(200);

    const body = await resp.json();
    expect(body).toHaveProperty('message');
    expect(body.message).toMatch(/login realizado com sucesso/i);

    expect(body).toHaveProperty('authorization');
    expect(typeof body.authorization).toBe('string');
    const token = body.authorization;

    // Exemplo: validar formato Bearer
    expect(token).toMatch(/^Bearer\s.+/);

    // Se quiser reutilizar depois neste arquivo:
    // (poderia salvar em variável module-level, mas aqui só estamos validando)
  });

  test('POST /login - erro ao logar com senha incorreta', async ({ request }) => {
    const { email } = userAdmin;

    const resp = await request.post('/login', {
      data: {
        email,
        password: 'senhaErrada123',
      },
    });

    expect(resp.status()).toBe(401);

    const body = await resp.json();
    expect(body).toHaveProperty('message');
    expect(body.message).toMatch(/email.*senha.*inválid/i);

    expect(body).not.toHaveProperty('authorization');
  });

  test('POST /login - email deve ser válido (formato inválido → 400)', async ({ request }) => {
    const resp = await request.post('/login', {
      data: {
        email: 'email-invalido',
        password: 'qualquerSenha',
      },
    });

    expect(resp.status()).toBe(400);

    const body = await resp.json();
    const bodyString = JSON.stringify(body).toLowerCase();
    expect(bodyString).toMatch(/email.*válid/);
  });
});