const express = require('express');
const router = express.Router();
const categoryController = require('../app/controllers/CategoryController');
const { verifyTokenAndAmin } = require('../middleware/auth');
const upload = require('../middleware/file');

router.post(
    '/',
    verifyTokenAndAmin,
    upload.single('imageUrl'),

    categoryController.createCate
);
router.patch(
    '/:id',
    verifyTokenAndAmin,
    categoryController.toggleActiveCateById
);
router.put(
    '/:id',
    verifyTokenAndAmin,
    upload.single('imageUrl'),
    categoryController.updateCateById
);
router.delete('/:id', verifyTokenAndAmin, categoryController.deleteCateById);
router.get('/', categoryController.getAllCategories);

module.exports = router;
