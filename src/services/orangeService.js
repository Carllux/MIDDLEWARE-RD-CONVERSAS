require('dotenv').config();
const logger = require('../utils/logger');

const ORANGE_API_URL = process.env.ORANGE_API_URL || 'https://api-painel.orangeenvios.com.br';

async function buscarRastreioOrange(codigo) {
  const url = `${ORANGE_API_URL}/api/Rastreio/${codigo}`;
  logger.info('Chamando Orange API: %s', url);

  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    const err = new Error(`Erro na API Orange: ${res.status}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }

  const data = await res.json();
  return data;
}

async function buscarPontosProximos(cep) {
  const url = `${ORANGE_API_URL}/api/CalculadoraInstitucional/BuscaPontosProximos`;
  const payload = { CepOrigem: cep };

  logger.info('Chamando Orange API BuscaPontosProximos com CEP: %s', cep);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    const err = new Error(`Erro na API Orange: ${res.status}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }

  const data = await res.json();
  return data;
}

async function buscarFretesDisponiveis(payload) {
  const url = `${ORANGE_API_URL}/api/CalculadoraInstitucional/FretesDisponiveis`;

  logger.info('Chamando Orange API FretesDisponiveis: %s', url);
  logger.debug('Payload FretesDisponiveis: %o', payload);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    const err = new Error(`Erro na API Orange: ${res.status}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }

  const data = await res.json();
  return data;
}

module.exports = { buscarRastreioOrange, buscarPontosProximos, buscarFretesDisponiveis };
