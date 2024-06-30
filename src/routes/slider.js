const express = require('express');
const router = express.Router();
const SliderController = require('../app/controllers/SliderController');
const upload = require('../middleware/file');
const { verifyTokenAndAmin } = require('../middleware/auth');

router.get('/', SliderController.getSliders);
router.post(
    '/',
    verifyTokenAndAmin,
    upload.single('image'),
    SliderController.createSlider
);
router.put(
    '/:sliderId',
    verifyTokenAndAmin,
    upload.single('image'),
    SliderController.editSlider
);
router.patch(
    '/:sliderId',
    verifyTokenAndAmin,
    SliderController.setSliderActive
);
router.delete('/:sliderId', verifyTokenAndAmin, SliderController.deleteSlider);

module.exports = router;
