const express = require('express');
const router = express.Router();
const { verifyToken, verifyTokenAndAmin } = require('../middleware/auth');
const OrderController = require('../app/controllers/OrderController');
const cartMiddleware = require('../middleware/cart');

router.get(
    '/statistics',
    verifyTokenAndAmin,
    OrderController.getStatisticsData
);
router.get('/vnpay-return', verifyToken, OrderController.vnPayReturn);
router.post('/create-vnpay-url', verifyToken, OrderController.createVNPayUrl);
router.get('/:id', verifyTokenAndAmin, OrderController.getOrderByID);
router.get('/', verifyToken, OrderController.getAllOrders);
router.post('/', verifyToken, cartMiddleware, OrderController.createOrder);
router.put('/:id', verifyTokenAndAmin, OrderController.editOrder);
router.delete('/:id', verifyTokenAndAmin, OrderController.deleteOrder);

module.exports = router;
