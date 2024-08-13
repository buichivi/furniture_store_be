const express = require('express');
const router = express.Router();
const RoomController = require('../app/controllers/RoomController');
const { verifyTokenAndAmin } = require('../middleware/auth');
const upload = require('../middleware/file');

router.get('/:slug', RoomController.getRoomBySlug);
router.get('/', RoomController.getRooms);
router.post(
    '/:slug',
    verifyTokenAndAmin,
    upload.single('image'),
    RoomController.addInspiration
);
router.post('/', verifyTokenAndAmin, RoomController.createRoom);

module.exports = router;
