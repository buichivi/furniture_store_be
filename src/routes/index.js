const userRouters = require('./user');
const authRouters = require('./auth');
const orderRouters = require('./order');
const categoryRouters = require('./category');
const express = require('express');
const router = express.Router();

router.use('/users', userRouters);
router.use('/auth', authRouters);
router.use('/orders', orderRouters);
router.use('/categories', categoryRouters);

module.exports = router;
