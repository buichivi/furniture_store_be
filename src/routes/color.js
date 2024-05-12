const express = require('express');
const router = express.Router();
const upload = require('../middleware/file');
const { verifyTokenAndAmin } = require('../middleware/auth');
const colorController = require('../app/controllers/ColorController');

router.put(
    '/:colorId',
    upload.fields([{ name: 'thumb', maxCount: 1 }, { name: 'images' }]),
    colorController.editColorById
);
router.get('/:colorId', colorController.getColorById);
router.delete('/:productId/:colorId', colorController.deleteColorById);
router.post(
    '/:slug',
    verifyTokenAndAmin,
    upload.fields([{ name: 'thumb', maxCount: 1 }, { name: 'images' }]),
    colorController.createColorByProductSlug
);

module.exports = router;
