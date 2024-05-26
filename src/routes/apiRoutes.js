const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');

// Exemplo de rota de API
router.get('/example', apiController.getExample);

module.exports = router;