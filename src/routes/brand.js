const express = require('express');
const router = express.Router();
const { verifyTokenAndAmin } = require('../middleware/auth');
const brandController = require('../app/controllers/BrandController');

router.get('/', brandController.getAllBrands);
router.post('/', verifyTokenAndAmin, brandController.createBrand);
router.patch('/:id', verifyTokenAndAmin, brandController.toggleActiveBrandById);
router.put('/:id', verifyTokenAndAmin, brandController.editBrandById);
router.delete('/:id', verifyTokenAndAmin, brandController.deleteBrandById);

module.exports = router;
