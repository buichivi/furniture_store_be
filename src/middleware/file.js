const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        let folder = './public/uploads';
        if (['.gltf', '.glb'].includes(ext)) {
            folder = './public/uploads/models';
        } else if (
            [
                '.jpg',
                '.jpeg',
                '.webp',
                '.avif',
                '.apng',
                '.png',
                '.jfif',
                '.pjpeg',
                '.pjp',
            ]
        ) {
            folder = './public/uploads/images';
        }
        cb(null, folder);
    },
    filename: function (req, file, cb) {
        const fileName = crypto.randomUUID() + path.extname(file.originalname);
        cb(null, fileName);
    },
});
const upload = multer({ storage });

module.exports = upload;
