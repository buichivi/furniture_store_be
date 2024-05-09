const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BrandSchema = new Schema(
    {
        name: { type: String, unique: true, required: true },
        description: { type: String, default: '' },
        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Brand', BrandSchema);
