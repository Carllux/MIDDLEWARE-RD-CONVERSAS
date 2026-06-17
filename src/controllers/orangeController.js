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

    // Mapeamentos para nomes legíveis
    const transportadoraMap = {
      0: 'Correios',
      1: 'JadLog',
      2: 'J3',
      3: 'Loggi',
      4: 'J&T Express',
    };

    const modalidadeMap = {
      0: 'SEDEX',
      1: 'PAC',
      2: 'Mini Envios',
      4: 'Package',
      5: '.Com',
      7: 'SameDay',
      8: 'NextDay',
      10: 'SEDEX Centralizado',
      11: 'PAC Centralizado',
      12: 'Mini Envios Centralizado',
      14: 'J&T Standard',
      15: 'Loggi Ponto',
    };

    const getTransportadoraName = (code) => transportadoraMap[code] || `Desconhecida (${code})`;
    const getModalidadeName = (code) => modalidadeMap[code] || `Desconhecida (${code})`;

    if (!Array.isArray(data)) {
      return res.json({
        status: 200,
        mensagem: 'Não foi possível obter cotações de frete no momento.',
        fretes: [],
      });
    }

    // Enriquecer dados com nomes legíveis
    const enriched = data.map((item) => ({
      ...item,
      transportadoraNome: getTransportadoraName(item.transportadora),
      modalidadeNome: getModalidadeName(item.modalidade),
    }));

    const disponiveis = enriched.filter((item) => !item.erro);
    const erros = enriched.filter((item) => item.erro);

    let mensagem = `Resultados de frete para ${payload.remetente} → ${payload.destino}:\n\n`;

    if (disponiveis.length > 0) {
      mensagem += '✅ Opções disponíveis:\n';
      disponiveis.forEach((item, index) => {
        mensagem += `• ${index + 1}. ${item.transportadoraNome} ${item.modalidadeNome} — ${formatCurrency(item.preco)}, prazo ${item.prazo} dia(s)`;
        mensagem += '\n';
      });
      mensagem += '\n';
    } else {
      mensagem += '❌ Nenhuma opção de frete disponível no momento.\n\n';
    }

    res.json({
      status: 200,
      mensagem: mensagem.trim(),
      fretes: enriched,
    });
  } catch (err) {
    logger.error('Erro no controller getFretesDisponiveis: %o', err);
    next(err);
  }
}

module.exports = { getFretesDisponiveis };
