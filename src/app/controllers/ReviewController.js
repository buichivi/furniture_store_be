const Product = require('../../models/Product');
const Joi = require('joi');
const Order = require('../../models/Order');
const moment = require('moment');

const reviewSchema = Joi.object({
    rating: Joi.number().integer().min(0).max(5).required(),
    comment: Joi.string().required(),
});

const isBuyProduct = (orders, productId) => {
    for (const order of orders) {
        if (order.orderStatus == 'completed') {
            for (const item of order.items) {
                if (item.product == productId) {
                    return true;
                }
            }
        }
    }
    return false;
};

class ReviewController {
    // [POST] /reviews/:productId
    async createReview(req, res) {
        try {
            const productId = req.params.productId;
            const userId = req.userId;
            const product = await Product.findById(productId);
            if (!product) throw new Error('Product not found');

            const orders = await Order.find({ user: userId });
            if (orders.length == 0 || !isBuyProduct(orders, productId))
                throw new Error('You have not purchased this product yet');

            const { value, error } = reviewSchema.validate(req.body);
            if (error) throw new Error(error.details[0].message);

            product.reviews.push({ user: userId, ...value });
            await product.save();
            res.status(200).json({
                message:
                    'You have successfully created a review for this product',
                review: {
                    ...value,
                    createdAt: moment().format('DD/MM/YYYY HH:mm'),
                },
            });
        } catch (error) {
            return res.status(400).json({ error: error?.message });
        }
    }
}

module.exports = new ReviewController();
