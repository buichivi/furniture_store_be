const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/uploads');
    },
    filename: function (req, file, cb) {
        const fileName = crypto.randomUUID() + path.extname(file.originalname);
        cb(null, fileName);
    },
});
const upload = multer({ storage });

module.exports = upload;
