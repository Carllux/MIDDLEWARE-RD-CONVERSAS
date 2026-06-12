const { buscarRastreioOrange } = require('../services/orangeService');
const logger = require('../utils/logger');

function formatDateTime(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return null;
  }

  const pad = (number) => String(number).padStart(2, '0');
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  // Formato amigável: DD/MM/YYYY às HH:mm
  return `${day}/${month}/${year} às ${hours}:${minutes}`;
}

async function getRastreio(req, res, next) {
  try {
    const { codigoRastreio } = req.params;
    const data = await buscarRastreioOrange(codigoRastreio);

    const eventos = Array.isArray(data.eventos) ? data.eventos : [];
    const primeiro = eventos[0] || null;

    const result = {
      codigoRastreio: data.codigoRastreio ?? null,
      dataPostado: formatDateTime(data.dataPostado),
      dataEntregue: formatDateTime(data.dataEntregue),
      dataAtualizacao: formatDateTime(data.dataAtualizacao),
      eventoData: formatDateTime(primeiro ? primeiro.data : null),
      eventoDescricao: primeiro ? primeiro.descricao : null,
    };

    // Monta mensagem amigável única
    const codigo = result.codigoRastreio ?? 'desconhecido';
    const dataPostado = result.dataPostado ?? 'data desconhecida';
    const descricao = result.eventoDescricao ?? 'status desconhecido';

    result.mensagem = `Seu pacote ${codigo}, foi postado dia ${dataPostado}\nStatus atual:\n ${descricao}`;

    res.json(result);
  } catch (err) {
    logger.error('Erro no controller getRastreio: %o', err);
    next(err);
  }
}

module.exports = { getRastreio };
