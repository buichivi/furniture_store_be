const Product = require('../../models/Product');
const Joi = require('joi');

const createProductSchema = Joi.object({
    name: Joi.string().required(),
    SKU: Joi.string().required(),
    price: Joi.number().min(0).default(0),
    currency: Joi.string().default('$'),
    discount: Joi.number().min(0).max(100).default(0),
    description: Joi.string().required(),
    category: Joi.string().required(),
    colors: Joi.array().required(),
    active: Joi.string().default(true),
});

class ProductController {
    // [GET] /products/
    async getAllProducts(req, res) {
        const products = await Product.find();
        res.status(200).json({ products });
    }

    // [POST] /products/
    async createProduct(req, res) {}
}

module.exports = new ProductController();
