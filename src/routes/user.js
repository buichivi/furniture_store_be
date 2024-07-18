const express = require('express');
const router = express.Router();
const userController = require('../app/controllers/UserController');
const upload = require('../middleware/file');
const { verifyToken, verifyTokenAndAmin } = require('../middleware/auth');

router.put(
    '/',
    verifyToken,
    upload.single('avatar'),
    userController.updateInfomation
);

router.patch('/', verifyToken, userController.updatePassword);

module.exports = router;
