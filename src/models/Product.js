const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');

mongoose.plugin(slug);

const Product = new Schema(
    {
        name: { type: String, unique: true, required: true },
        SKU: { type: String, unique: true },
        price: { type: Number, min: 0, default: 0 },
        currency: { type: String, default: '$' },
        discount: { type: Number, min: 0, max: 100, default: 0 },
        description: { type: String, required: true },
        slug: { type: String, slug: 'name', unique: true },
        category: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            require: true,
        },
        dimensions: {
            width: { type: Number, default: 0 },
            height: { type: Number, default: 0 },
            depth: { type: Number, default: 0 },
        },
        weight: { type: Number, default: 0 },
        material: { type: String },
        colors: [{ type: Schema.Types.ObjectId, ref: 'Color' }],
        brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Product', Product);
