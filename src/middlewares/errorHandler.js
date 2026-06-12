const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error(err);
  const status = err.status || 500;
  const mensagem = status === 500 ? 'Erro interno no servidor' : err.message;
  res.status(status).json({ status, mensagem });
}

module.exports = errorHandler;
