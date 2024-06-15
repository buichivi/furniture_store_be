const express = require('express');
const router = express.Router();
const PromoCodeController = require('../app/controllers/PromoCodeController');
const { verifyTokenAndAmin } = require('../middleware/auth');
const PromoCode = require('../models/PromoCode');

router.get('/', PromoCodeController.getAllPromoCode);
router.get('/:promoCode', PromoCodeController.getPromoCode);
router.post('/', verifyTokenAndAmin, PromoCodeController.createPromoCode);
router.patch('/:id', verifyTokenAndAmin, PromoCodeController.toggleActive);
router.put('/:id', verifyTokenAndAmin, PromoCodeController.changePromoCode);
router.delete('/:id', verifyTokenAndAmin, PromoCodeController.deletePromoCode);
module.exports = router;
