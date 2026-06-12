const { z } = require('zod');

const schema = z.object({
  codigoRastreio: z
    .string()
    .min(1, 'codigoRastreio é obrigatório')
    .regex(/^[A-Za-z0-9\-]+$/, 'Formato inválido para codigoRastreio'),
});

module.exports = (req, res, next) => {
  const parse = schema.safeParse(req.params);
  
  if (!parse.success) {
    const mensagens = parse.error.issues.map((e) => e.message).join(', ');
    
    // Capturamos o que a URL tentou nos enviar
    const valorRecebido = req.params.codigoRastreio;
    
    // Logamos o valor recebido entre colchetes para facilitar a visualização de espaços vazios
    console.warn(`[Validação Falhou] Valor recebido: [${valorRecebido}] | Motivo: ${mensagens}`);
    
    return res.status(400).json({ status: 400, mensagem: mensagens });
  }
  
  next();
};