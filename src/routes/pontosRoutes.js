const express = require('express');
const router = express.Router();
const validateCep = require('../middlewares/validateCep');
const { getPontosProximos } = require('../controllers/pontosController');

router.get('/api/v1/pontos/:cep', validateCep, getPontosProximos);

module.exports = router;
