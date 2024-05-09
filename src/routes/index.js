const userRouters = require('./user');
const authRouters = require('./auth');
const orderRouters = require('./order');
const categoryRouters = require('./category');
const productRouters = require('./product');
const brandRouters = require('./brand');
const express = require('express');
const router = express.Router();

router.use('/users', userRouters);
router.use('/auth', authRouters);
router.use('/orders', orderRouters);
router.use('/categories', categoryRouters);
router.use('/products', productRouters);
router.use('/brands', brandRouters);

module.exports = router;
