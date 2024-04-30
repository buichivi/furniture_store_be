const express = require('express');
const router = express.Router();
const userController = require('../app/controllers/UserController');

router.get('/:id', userController.getUserById);
router.get('/', userController.index);
router.post('/', userController.createUser);

module.exports = router;
