const { expect } = require('@playwright/test');
const { criarUsuario } = require('./usuariosClient');

/**
 * Faz login via /login
 * @param {import('@playwright/test').APIRequestContext} api
 * @param {string} email
 * @param {string} password
 * @returns {Promise<string>} token
 */
async function loginApi(api, email, password) {
  const resp = await api.post('/login', {
    data: { email, password },
  });

  expect(resp.status(), 'status POST /login').toBe(200);

  const body = await resp.json();

  expect(body).toHaveProperty('authorization');
  expect(typeof body.authorization).toBe('string');

  return body.authorization; 
}

/**
 * @param {import('@playwright/test').APIRequestContext} api
 * @param {Object} [opcoesUsuario]
 * @returns {Promise<{_id: string, nome: string, email: string, password: string, administrador: string, token: string}>}
 */
async function criarUsuarioELogar(api, opcoesUsuario = {}) {
  const usuario = await criarUsuario(api, opcoesUsuario);
  const token = await loginApi(api, usuario.email, usuario.password);

  return {
    ...usuario,
    token,
  };
}

module.exports = {
  loginApi,
  criarUsuarioELogar,
};