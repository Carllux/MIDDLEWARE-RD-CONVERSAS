const express = require('express');
const router = express.Router();
const validate = require('../middlewares/validateRastreio');
const { getRastreio } = require('../controllers/trackingController');

router.get('/api/v1/rastreio/:codigoRastreio', validate, getRastreio);

module.exports = router;
