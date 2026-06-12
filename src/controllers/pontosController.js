const { buscarPontosProximos } = require('../services/orangeService');
const logger = require('../utils/logger');

async function getPontosProximos(req, res, next) {
  try {
    const cep = req.cepValidado;
    const dados = await buscarPontosProximos(cep);

    // Validar se é um array
    if (!Array.isArray(dados) || dados.length === 0) {
      return res.json({
        status: 200,
        mensagem: 'Poxa, não encontramos pontos de coleta próximos a este CEP.',
        pontos: [],
      });
    }

    // Limitar aos 3 primeiros pontos e formatar
    const pontosFormatados = dados.slice(0, 3).map((ponto) => {
      // Formatar latitude e longitude para a URL do Google Maps
      const latitude = parseFloat(ponto.latitude);
      const longitude = parseFloat(ponto.longitude);

      return {
        nome: ponto.contatoNome || 'Nome não disponível',
        endereco: `${ponto.logradouro || ''}, ${ponto.bairro || ''} - ${ponto.cidade || ''}/${
          ponto.uf || ''
        }`.trim(),
        cep: ponto.cep || 'CEP não disponível',
        linkMapa: `https://www.google.com/maps/search/?api=1&query=${latitude}%2C${longitude}`,
      };
    });

    // Montar mensagem amigável com os pontos
    let mensagem = `Encontramos ${pontosFormatados.length} ponto(s) de coleta próximo ao CEP ${cep}:\n\n`;

    pontosFormatados.forEach((ponto, index) => {
      mensagem += `*${index + 1}. ${ponto.nome}*\n`;
      mensagem += `📍 ${ponto.endereco}\n`;
      mensagem += `CEP: ${ponto.cep}\n`;
      mensagem += `🗺️ ${ponto.linkMapa}\n\n`;
    });

    mensagem += `Para ver mais pontos próximos, acesse: https://www.orangeenvios.com.br/pontos-proximos.html`;

    res.json({
      status: 200,
      mensagem: mensagem.trim(),
      pontos: pontosFormatados,
    });
  } catch (err) {
    logger.error('Erro no controller getPontosProximos: %o', err);
    next(err);
  }
}

module.exports = { getPontosProximos };
