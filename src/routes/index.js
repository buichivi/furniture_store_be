const userRouters = require('./user');
const authRouters = require('./auth');
const orderRouters = require('./order');
const categoryRouters = require('./category');
const productRouters = require('./product');
const brandRouters = require('./brand');
const tagRouters = require('./tag');
const colorRouters = require('./color');
const cartRouters = require('./cart');
const promoCodeRouters = require('./promocode');
const wishlistRouter = require('./wishlist');
const reviewRouter = require('./review');
const addressesRouter = require('./addresses');
const sliderRoute = require('./slider');

const express = require('express');
const router = express.Router();

router.use('/users', userRouters);
router.use('/auth', authRouters);
router.use('/orders', orderRouters);
router.use('/categories', categoryRouters);
router.use('/products', productRouters);
router.use('/brands', brandRouters);
router.use('/tags', tagRouters);
router.use('/colors', colorRouters);
router.use('/cart', cartRouters);
router.use('/promo-code', promoCodeRouters);
router.use('/orders', orderRouters);
router.use('/wishlist', wishlistRouter);
router.use('/reviews', reviewRouter);
router.use('/addresses', addressesRouter);
router.use('/sliders', sliderRoute);

module.exports = router;
