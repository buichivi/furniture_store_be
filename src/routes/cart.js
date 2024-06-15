const express = require('express');
const router = express.Router();
const cartController = require('../app/controllers/CartController');
const cartMiddleware = require('../middleware/cart');

router.get('/', cartMiddleware, cartController.getCart);
router.post('/', cartMiddleware, cartController.addProductToCart);
router.patch('/', cartMiddleware, cartController.updateQuantity);
router.delete('/clear', cartMiddleware, cartController.clearCart);
router.delete('/:id', cartMiddleware, cartController.deleteCartItem);

module.exports = router;
