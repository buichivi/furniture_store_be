const express = require('express');
const router = express.Router();
const { verifyTokenAndAmin } = require('../middleware/auth');
const productController = require('../app/controllers/ProductController');
const upload = require('../middleware/file');

router.get('/colors/:slug/:colorId', productController.getColor);
router.post(
    '/colors/:slug',
    verifyTokenAndAmin,
    upload.fields([
        { name: 'thumb', maxCount: 1 },
        { name: 'images' },
        { name: 'model3D', maxCount: 1 },
    ]),
    productController.createColor
);
router.put(
    '/colors/:slug/:colorId',
    verifyTokenAndAmin,
    upload.fields([
        { name: 'thumb', maxCount: 1 },
        { name: 'images' },
        { name: 'model3D', maxCount: 1 },
    ]),
    productController.editColor
);
router.delete(
    '/colors/:slug/:colorId',
    verifyTokenAndAmin,
    productController.deleteColor
);
router.get('/brand/:brand', productController.getProductByBrand);
router.get('/tag/:tag', productController.getProductByTag);
router.get('/search/:query', productController.searchProduct);
router.get('/:slug', productController.getProductBySlug);
router.patch(
    '/:id',
    verifyTokenAndAmin,
    productController.toggleActiveProductById
);
router.delete('/:id', verifyTokenAndAmin, productController.deleteProductById);
router.put('/:id', verifyTokenAndAmin, productController.editProductById);
router.get('/', productController.getAllProducts);
router.post(
    '/',
    verifyTokenAndAmin,
    upload.fields([{ name: 'thumb', maxCount: 1 }, { name: 'images' }]),
    productController.createProduct
);

module.exports = router;
