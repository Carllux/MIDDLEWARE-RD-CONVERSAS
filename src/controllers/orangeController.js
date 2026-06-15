const { buscarFretesDisponiveis } = require('../services/orangeService');
const logger = require('../utils/logger');

function formatCurrency(value) {
  return typeof value === 'number'
    ? `R$ ${value.toFixed(2).replace('.', ',')}`
    : 'R$ 0,00';
}

async function getFretesDisponiveis(req, res, next) {
  try {
    const payload = req.validatedFrete || req.body;
    const data = await buscarFretesDisponiveis(payload);

    if (!Array.isArray(data)) {
      return res.json({
        status: 200,
        mensagem: 'Não foi possível obter cotações de frete no momento.',
        fretes: [],
      });
    }

    const disponiveis = data.filter((item) => !item.erro);
    const erros = data.filter((item) => item.erro);

    let mensagem = `Resultados de frete para ${payload.remetente} → ${payload.destino}:\n\n`;

    if (disponiveis.length > 0) {
      mensagem += '✅ Opções disponíveis:\n';
      disponiveis.forEach((item) => {
        mensagem += `• ${item.referencia}: ${formatCurrency(item.preco)} em ${item.prazo} dia(s) / transportadora ${item.transportadora} / modalidade ${item.modalidade}\n`;
      });
      mensagem += '\n';
    } else {
      mensagem += '❌ Nenhuma opção de frete disponível no momento.\n\n';
    }

    if (erros.length > 0) {
      mensagem += '⚠️ Erros encontrados:\n';
      erros.forEach((item) => {
        mensagem += `• ${item.referencia}: ${item.erroMensagem || 'erro desconhecido'}\n`;
      });
    }

    res.json({
      status: 200,
      mensagem: mensagem.trim(),
      fretes: data,
    });
  } catch (err) {
    logger.error('Erro no controller getFretesDisponiveis: %o', err);
    next(err);
  }
}

module.exports = { getFretesDisponiveis };
