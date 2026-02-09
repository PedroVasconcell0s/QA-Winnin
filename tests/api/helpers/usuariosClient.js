const { expect } = require('@playwright/test');
const { gerarEmail } = require('./emailUtils');

/**
 * Cria usuário via /usuarios
 * @param {import('@playwright/test').APIRequestContext} api
 * @param {Object} [opcoes]
 * @returns {Promise<{_id: string, nome: string, email: string, password: string, administrador: string}>}
 */
async function criarUsuario(api, opcoes = {}) {
  const {
    administrador = "false",
    prefixoEmail = administrador === "true" ? "Admin" : "Cliente",
    nome = administrador === "true" ? "Usuario Admin" : "Usuario Cliente",
    password = "senha123",
  } = opcoes;

  const email = gerarEmail(prefixoEmail);

  const payload = {
    nome,
    email,
    password,
    administrador,
  };

  const resp = await api.post('/usuarios', { data: payload });
  expect(resp.status(), 'status POST /usuarios').toBe(201);

  const body = await resp.json();

  expect(body).toHaveProperty('message', 'Cadastro realizado com sucesso');
  expect(body).toHaveProperty('_id');
  expect(typeof body._id).toBe('string');

  return {
    _id: body._id,
    ...payload,
  };
}

module.exports = {
  criarUsuario,
};