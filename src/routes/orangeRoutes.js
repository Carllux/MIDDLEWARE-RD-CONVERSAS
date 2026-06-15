const express = require('express');
const router = express.Router();
const validateFrete = require('../middlewares/validateFrete');
const { getFretesDisponiveis } = require('../controllers/orangeController');

router.route('/api/v1/fretes-disponiveis')
  .post(validateFrete, getFretesDisponiveis)
  .get(validateFrete, getFretesDisponiveis);

module.exports = router;
