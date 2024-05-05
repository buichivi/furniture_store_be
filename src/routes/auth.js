const express = require('express');
const router = express.Router();
const authController = require('../app/controllers/AuthController');
const { verifyToken, verifyTokenAndAmin } = require('../middleware/auth');
const upload = require('../middleware/file');

router.post('/admin/login', authController.adminLogin);
router.patch('/admin/logout', verifyTokenAndAmin, authController.adminLogout);
router.post('/login', authController.login);
router.post('/register', upload.single('avatar'), authController.register);
router.patch('/logout', verifyToken, authController.logout);
router.get('/me', verifyToken, authController.getMe);

module.exports = router;
