const { z } = require('zod');

const volumeSchema = z.object({
  altura: z.number().positive('altura deve ser um número maior que zero'),
  largura: z.number().positive('largura deve ser um número maior que zero'),
  comprimento: z.number().positive('comprimento deve ser um número maior que zero'),
  peso: z.number().positive('peso deve ser um número maior que zero'),
});

const schema = z.object({
  remetente: z.string().min(1, 'remetente é obrigatório'),
  destino: z.string().min(1, 'destino é obrigatório'),
  valorSegurado: z.number().nonnegative('valorSegurado deve ser zero ou positivo'),
  volumes: z.array(volumeSchema).nonempty('volumes é obrigatório'),
});

function parseVolume(value) {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value;
}

function buildVolumeItem(source) {
  return {
    altura: Number(source.altura),
    largura: Number(source.largura),
    comprimento: Number(source.comprimento),
    peso: Number(source.peso),
  };
}

function hasFlatVolumeFields(source) {
  return (
    source !== null &&
    typeof source === 'object' &&
    source.altura !== undefined &&
    source.largura !== undefined &&
    source.comprimento !== undefined &&
    source.peso !== undefined
  );
}

function buildPayload(req) {
  const source = req.body && Object.keys(req.body).length > 0 ? req.body : req.query;

  const payload = {
    remetente: source.remetente,
    destino: source.destino,
    valorSegurado: source.valorSegurado !== undefined ? Number(source.valorSegurado) : undefined,
  };

  if (source.volumes !== undefined) {
    const parsed = parseVolume(source.volumes);

    if (Array.isArray(parsed)) {
      payload.volumes = parsed.map((volume) => {
        const item = parseVolume(volume);
        return hasFlatVolumeFields(item) ? buildVolumeItem(item) : volume;
      });
    } else if (hasFlatVolumeFields(parsed)) {
      payload.volumes = [buildVolumeItem(parsed)];
    } else {
      payload.volumes = [parsed];
    }
  } else if (hasFlatVolumeFields(source)) {
    payload.volumes = [buildVolumeItem(source)];
  }

  return payload;
}

module.exports = (req, res, next) => {
  const payload = buildPayload(req);
  const parse = schema.safeParse(payload);

  if (!parse.success) {
    const mensagens = parse.error.issues.map((issue) => issue.message).join(', ');
    return res.status(400).json({ status: 400, mensagem: mensagens });
  }

  req.validatedFrete = parse.data;
  next();
};
