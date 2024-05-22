const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Category = new Schema(
    {
        name: { type: String, unique: true },
        description: { type: String, default: '' },
        imageUrl: { type: String, default: '' },
        parentId: { type: String, default: '' },
        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Category', Category);
