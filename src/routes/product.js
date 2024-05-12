const express = require('express');
const router = express.Router();
const { verifyTokenAndAmin } = require('../middleware/auth');
const productController = require('../app/controllers/ProductController');
const upload = require('../middleware/file');

router.get('/:id', productController.getProductById);
router.patch('/:id', productController.toggleActiveProductById);
router.delete('/:id', productController.deleteProductById);
router.put('/:id', productController.editProductById);
router.get('/', productController.getAllProducts);
router.post(
    '/',
    verifyTokenAndAmin,
    upload.fields([{ name: 'thumb', maxCount: 1 }, { name: 'images' }]),
    productController.createProduct
);

module.exports = router;
