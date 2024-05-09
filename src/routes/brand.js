const express = require('express');
const router = express.Router();
const brandController = require('../app/controllers/BrandController');

router.get('/', brandController.getAllBrands);
router.post('/', brandController.createBrand);
router.patch('/:id', brandController.toggleActiveBrandById);
router.put('/:id', brandController.editBrandById);
router.delete('/:id', brandController.deleteBrandById);

module.exports = router;
