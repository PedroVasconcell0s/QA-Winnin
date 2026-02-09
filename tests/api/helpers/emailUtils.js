function getHojeYYYYMMDD() {
  const d = new Date();
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}${mes}${dia}`;
}

function getTresNumerosAleatorios() {
  return Math.floor(100 + Math.random() * 900);
}

function gerarEmail(prefixo = 'PlaywrightUser') {
  return `${prefixo}${getHojeYYYYMMDD()}${getTresNumerosAleatorios()}@qa.com.br`;
}

module.exports = {
  gerarEmail,
};