const unlinkAsync = require('./removeImage');

const deleteImages = async (req) => {
    if (req.files?.thumb?.length) await unlinkAsync(req.files?.thumb[0]?.path);
    if (req.files?.images?.length) {
        for (const file of req.files.images) {
            await unlinkAsync(file.path);
        }
    }
};

module.exports = deleteImages;
