const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ColorSchema = new Schema({
    name: { type: String, default: '' },
    product: { type: Schema.Types.ObjectId, ref: 'Product', require: true },
    thumb: { type: String, default: '' },
    stock: { type: Number, min: 0, default: 0 },
    images: [{ type: String }],
});

module.exports = mongoose.model('Color', ColorSchema);
