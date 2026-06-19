const logger = require('../utils/logger');

const gerarAgendamentoPostagem = async (req, res, next) => {
  try {
    logger.info('[PostagemController] Iniciando requisição de agendamento de postagem');
    
    // === NOVO: Log Completo (Headers e Body) ===
    logger.info(`[PostagemController] Headers recebidos do Chatbot: ${JSON.stringify(req.headers)}`);
    logger.info(`[PostagemController] Payload (Body) recebido: ${JSON.stringify(req.body)}`);
    // ============================================

    // 1. Extraímos o token de autorização que o cliente enviou
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Adicionado log específico para ver o que chegou no lugar do token
      logger.warn(`[PostagemController] Requisição negada. O que chegou no authHeader foi: "${authHeader}"`);
      return res.status(401).json({ 
        status: 401, 
        mensagem: "Token de autorização não fornecido ou inválido. Envie no formato 'Bearer SEU_TOKEN'." 
      });
    }

    // Separa a palavra "Bearer " do token em si
    const tokenCliente = authHeader.split(' ')[1];

    // 2. Extraímos os dados já validados do body
    const { 
      Cep, Nome, CpfCnpj, Email, 
      NumeroCelular1, Numero, Complemento = "" 
    } = req.body;

    logger.debug(`[PostagemController] Dados extraídos. Consultando BrasilAPI para o CEP: ${Cep}`);

    // 3. Chamada para a BrasilAPI
    const brasilApiResponse = await fetch(`https://brasilapi.com.br/api/cep/v1/${Cep}`);
    
    if (!brasilApiResponse.ok) {
      logger.warn(`[PostagemController] Falha na BrasilAPI: CEP ${Cep} não encontrado`);
      return res.status(404).json({ status: 404, mensagem: "CEP não encontrado na base da BrasilAPI" });
    }

    const cepData = await brasilApiResponse.json();
    logger.debug('[PostagemController] Endereço retornado com sucesso pela BrasilAPI');

    // 4. Tradução dos campos da response
    const enderecoTraduzido = {
      Cep: cepData.cep,
      Uf: cepData.state,
      Cidade: cepData.city,
      Bairro: cepData.neighborhood,
      Logradouro: cepData.street
    };

    // 5. Construção do Payload para a API de Postagem
    const payloadPostagem = {
      Observacao: "",
      Contratante: "7210e152-f3d3-4f4c-a4eb-1419855a2a65", // Fixo conforme documentação
      Nome: Nome,
      CpfCnpj: CpfCnpj,
      Email: Email,
      NumeroCelular1: NumeroCelular1,
      NumeroResidencial1: "",
      Logradouro: enderecoTraduzido.Logradouro,
      Numero: Numero,
      Complemento: Complemento,
      Bairro: enderecoTraduzido.Bairro,
      Cidade: enderecoTraduzido.Cidade,
      Uf: enderecoTraduzido.Uf,
      Cep: enderecoTraduzido.Cep,
      Referencia: "",
      Contrato: "",
      Transportador: 0, // Fixo conforme documentação
      CodEmbalagem: "",
      TipoEmbalagem: "",
      DescricaoEmbalagem: ""
    };

    logger.info('[PostagemController] Enviando dados para a API DBAnalyze...');
    logger.debug(`[PostagemController] Payload DBAnalyze montado: ${JSON.stringify(payloadPostagem)}`);

    // === Montagem e Log do cURL ===
    const curlCommand = `curl --location 'https://apipostagem.dbanalyze.com.br/api/v1/AgendamentoPostagem/Cadastrar' \\
--header 'Content-Type: application/json' \\
--header 'Authorization: Bearer ${tokenCliente}' \\
--data-raw '${JSON.stringify(payloadPostagem)}'`;

    logger.debug(`[PostagemController] cURL gerado para debug:\n${curlCommand}`);
    // ====================================

    // 6. Chamada para a API DBAnalyze usando o TOKEN DO CLIENTE
    const postagemResponse = await fetch('https://apipostagem.dbanalyze.com.br/api/v1/AgendamentoPostagem/Cadastrar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenCliente}` 
      },
      body: JSON.stringify(payloadPostagem)
    });

    // 7. Leitura segura da resposta
    const textoResposta = await postagemResponse.text();
    let postagemData;

    logger.debug(`[PostagemController] Resposta bruta da DBAnalyze (Status ${postagemResponse.status}): ${textoResposta}`);

    try {
      postagemData = textoResposta ? JSON.parse(textoResposta) : {};
    } catch (e) {
      logger.debug('[PostagemController] Resposta não é JSON válido. Acionando tratamento de string de erro dos Correios');
      postagemData = tratarErroCorreios(textoResposta);
    }

    if (!postagemResponse.ok) {
      logger.warn(`[PostagemController] Voucher não gerado. A API retornou status ${postagemResponse.status}`);
      
      const mensagemFinal = postagemData.mensagem || "Erro na geração do voucher";

      return res.status(postagemResponse.status || 400).json({ 
        status: postagemResponse.status || 400, 
        mensagem: mensagemFinal, 
        detalhes: postagemData 
      });
    }

    // === AJUSTE: Extração do Código do Voucher usando navegação segura e Formatação da Mensagem ===
    const codigoVoucher = postagemData?.dadosVoucher?.Voucher || postagemData?.Voucher || "Não informado";
    const mensagemWhatsApp = `Seu Voucher *${codigoVoucher}* foi criado com sucesso.\nMais informações foram enviadas para o e-mail *${Email}*`;

    // 8. Retorno de Sucesso Ajustado para o Bot
    logger.info(`[PostagemController] Agendamento criado com sucesso para o remetente: ${Nome}`);
    
    return res.status(200).json({
      erro: false,
      status: 200,
      mensagem: mensagemWhatsApp,
      enderecoUtilizado: enderecoTraduzido,
      dadosVoucher: {
        Agendamento: postagemData?.dadosVoucher?.Agendamento || postagemData?.Agendamento,
        Voucher: codigoVoucher,
        Abrangente: postagemData?.dadosVoucher?.Abrangente || postagemData?.Abrangente
      }
    });

  } catch (error) {
    logger.error(`[PostagemController] Erro interno durante a execução: ${error.message}`);
    next(error); 
  }
};

/**
 * Extrai informações estruturadas de uma string de erro dos Correios.
 */
function tratarErroCorreios(mensagemRaw) {
  if (typeof mensagemRaw !== 'string' || !mensagemRaw.includes('Erro Correios')) {
    return { erroOriginal: mensagemRaw };
  }

  const matchPrincipal = mensagemRaw.match(/Erro Correios:\s*(\d+)\s*-\s*(.*)/);
  
  if (matchPrincipal) {
    const codigoErro = matchPrincipal[1];
    const textoRestante = matchPrincipal[2]; 
    
    let numeroPedido = null;
    let mensagemAmigavel = textoRestante.replace(/Número do pedido/ig, 'Número do Voucher').trim(); 

    const matchPedido = textoRestante.match(/Número do pedido\s*(\d+)/i);
    
    if (matchPedido) {
      numeroPedido = matchPedido[1];
    }

    return {
      isErroCorreios: true,
      codigo: codigoErro,
      mensagem: mensagemAmigavel,
      pedidoDuplicado: numeroPedido,
      erroOriginal: mensagemRaw
    };
  }

  return { erroOriginal: mensagemRaw };
}

module.exports = {
  gerarAgendamentoPostagem
};