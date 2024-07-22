const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-updater');

mongoose.plugin(slug);

const ReviewSchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        rating: { type: Number, min: 0, max: 5, default: 0, required: true },
        comment: { type: String, required: true },
    },
    { timestamps: true }
);

const ColorSchema = new Schema(
    {
        name: { type: String, default: '' },
        thumb: { type: String, default: '' },
        stock: { type: Number, min: 0, default: 0 },
        images: [{ type: String }],
        model3D: { type: String, default: '' },
    },
    { timestamps: true }
);

const Product = new Schema(
    {
        name: { type: String, unique: true, required: true },
        SKU: { type: String, unique: true },
        price: { type: Number, min: 0, default: 0 },
        discount: { type: Number, min: 0, max: 100, default: 0 },
        description: { type: String, required: true },
        slug: { type: String, slug: 'name', unique: true },
        category: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            require: true,
        },
        brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
        // colors: [{ type: Schema.Types.ObjectId, ref: 'Color' }],
        colors: [ColorSchema],
        tags: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
        dimensions: {
            width: { type: Number, default: 0 },
            height: { type: Number, default: 0 },
            depth: { type: Number, default: 0 },
        },
        weight: { type: Number, default: 0 },
        material: { type: String, default: '' },
        reviews: [ReviewSchema],
        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Product', Product);
