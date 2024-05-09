const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const productController = require('../app/controllers/ProductController');

router.get('/', productController.getAllProducts);
router.post('/', verifyToken, productController.createProduct);

module.exports = router;
