const { buscarRastreioOrange } = require('../services/orangeService');
const logger = require('../utils/logger');

async function getRastreio(req, res, next) {
  try {
    const { codigoRastreio } = req.params;
    const data = await buscarRastreioOrange(codigoRastreio);

    const eventos = Array.isArray(data.eventos) ? data.eventos : [];
    const primeiro = eventos[0] || null;

    const result = {
      codigoRastreio: data.codigoRastreio ?? null,
      dataPostado: data.dataPostado ?? null,
      dataEntregue: data.dataEntregue ?? null,
      dataAtualizacao: data.dataAtualizacao ?? null,
      eventoData: primeiro ? primeiro.data : null,
      eventoDescricao: primeiro ? primeiro.descricao : null,
    };

    res.json(result);
  } catch (err) {
    logger.error('Erro no controller getRastreio: %o', err);
    next(err);
  }
}

module.exports = { getRastreio };
