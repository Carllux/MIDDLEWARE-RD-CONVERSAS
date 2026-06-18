const { z } = require('zod');

const schema = z.object({
  Cep: z.string().min(8, 'CEP é obrigatório e deve conter no mínimo 8 caracteres').regex(/^[0-9\-]+$/, 'Formato de CEP inválido'),
  Nome: z.string().min(1, 'Nome é obrigatório'),
  CpfCnpj: z.string().min(11, 'CpfCnpj é obrigatório'),
  Email: z.string().email('Email inválido'),
  NumeroCelular1: z.string().min(10, 'Número de celular é obrigatório'),
  Numero: z.string().min(1, 'Número do endereço é obrigatório'),
  Complemento: z.string().optional(),
});

module.exports = (req, res, next) => {
  const parse = schema.safeParse(req.body);
  
  if (!parse.success) {
    const mensagens = parse.error.issues.map((e) => e.message).join(', ');
    console.warn(`[Validação Falhou] Rota de Postagem | Motivo: ${mensagens}`);
    return res.status(400).json({ status: 400, mensagem: mensagens });
  }
  
  next();
};