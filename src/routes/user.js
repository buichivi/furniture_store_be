const express = require('express');
const router = express.Router();
const userController = require('../app/controllers/UserController');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/uploads');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});
const upload = multer({ storage });
// const upload = multer({ dest: 'uploads/' });

console.log(__dirname);

router.post('/register', upload.single('avatar'), userController.uploadAvatar);
router.get('/:id', userController.getUserById);
router.get('/', userController.index);

module.exports = router;
