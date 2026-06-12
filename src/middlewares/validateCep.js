const { z } = require('zod');

const schema = z.object({
  cep: z
    .string()
    .min(1, 'CEP é obrigatório')
    .transform((val) => val.replace(/\D/g, '')) // Remove caracteres não numéricos
    .refine((val) => val.length === 8, 'CEP deve conter 8 dígitos'),
});

module.exports = (req, res, next) => {
  const cepParam = req.params.cep || req.query.cep || req.body?.cep;

  const parse = schema.safeParse({ cep: cepParam });

  if (!parse.success) {
    const mensagens = parse.error.issues.map((e) => e.message).join(', ');
    console.warn(`[Validação CEP Falhou] CEP recebido: [${cepParam}] | Motivo: ${mensagens}`);
    return res.status(400).json({ status: 400, mensagem: mensagens });
  }

  // Armazena o CEP validado no request para uso no controller
  req.cepValidado = parse.data.cep;
  next();
};
