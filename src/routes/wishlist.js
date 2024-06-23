const express = require('express');
const router = express.Router();
const WishlistController = require('../app/controllers/WishlistController');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, WishlistController.getWishlist);
router.post('/', verifyToken, WishlistController.addProducToWishlist);
router.delete(
    '/:productId',
    verifyToken,
    WishlistController.removeProductFromWishlist
);

module.exports = router;
