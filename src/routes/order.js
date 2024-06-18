const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const OrderController = require('../app/controllers/OrderController');
const paypal = require('@paypal/checkout-server-sdk');
const cartMiddleware = require('../middleware/cart');

router.get('/', verifyToken, OrderController.getAllOrders);
router.post('/', verifyToken, cartMiddleware, OrderController.createOrder);

module.exports = router;
