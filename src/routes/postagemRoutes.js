const express = require('express');
const router = express.Router();

const validatePostagem = require('../middlewares/validatePostagem');
const { gerarAgendamentoPostagem } = require('../controllers/postagemController');

router.route('/api/v1/agendamento')
  .post(validatePostagem, gerarAgendamentoPostagem);

module.exports = router;