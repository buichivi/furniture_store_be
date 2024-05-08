const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');

mongoose.plugin(slug);

const Product = new Schema(
    {
        name: { type: String, unique: true },
        SKU: { type: String, unique: true },
        price: { type: Number, min: 0 },
        discount: { type: Number, min: 0, max: 100 },
        description: { type: String },
        published: { type: Boolean, default: true },
        slug: { type: String, slug: 'name', unique: true },
        category: { type: Schema.Types.ObjectId, ref: 'Category' },
    },
    { timestamps }
);

module.exports = mongoose.model('Product', Product);
