const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const AddressController = require('../app/controllers/AddressController');

router.post('/', verifyToken, AddressController.createAddress);
router.patch('/:addressId', verifyToken, AddressController.setDefaultAddress);
router.put('/:addressId', verifyToken, AddressController.editAddress);
router.delete('/:addressId', verifyToken, AddressController.deleteAddress);

module.exports = router;
