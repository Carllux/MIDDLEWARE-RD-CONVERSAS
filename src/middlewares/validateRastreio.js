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
    const mensagens = parse.error.errors.map((e) => e.message).join(', ');
    return res.status(400).json({ status: 400, mensagem: mensagens });
  }
  next();
};
