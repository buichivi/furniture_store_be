const Order = require('../../models/Order');
const Joi = require('joi');
const formatCart = require('../../utils/formatCart');
const PromoCode = require('../../models/PromoCode');
const Color = require('../../models/Color');

const orderSchema = Joi.object({
    totalAmount: Joi.number().greater(0).required(),
    paymentMethod: Joi.string().valid('cod', 'paypal', 'vnpay').default('cod'),
    shippingAddress: Joi.object({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        phoneNumber: Joi.string().length(10).required(),
        city: Joi.object().required(),
        district: Joi.object().required(),
        ward: Joi.object().required(),
        addressLine: Joi.string().required(),
    }).required(),
    promoCode: Joi.string().hex().length(24).optional(),
    paymentStatus: Joi.string().default('pending'),
});

class OrderController {
    // [GET] /orders
    async getAllOrders(req, res) {}

    // [POST] /orders
    async createOrder(req, res) {
        const userId = req.userId;
        const cart = req.cart;
        if (cart?.items?.length == 0) {
            return res.status(400).json({ error: 'Your cart is empty' });
        }
        const { value, error } = orderSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        try {
            const cartFormat = await formatCart(req);
            const items = cartFormat?.items?.map((item) => {
                return {
                    product: item.product._id,
                    color: item.color._id,
                    quantity: item.quantity,
                    itemPrice: item.itemPrice,
                };
            });

            // Increase usage of promo code + 1
            const promoCode = await PromoCode.findById(value.promoCode);
            if (promoCode.currentUses + 1 > promoCode.maxUsage) {
                return res.status(400).json({
                    error: 'This promo code has reached its usage limit',
                });
            }
            promoCode.currentUses += 1;
            await promoCode.save();

            // Decrease number of product
            for (let item of cartFormat?.items) {
                const color = await Color.findById(item.color._id);
                if (color.stock < item.quantity) {
                    return res.status(400).json({
                        error: `Product '${item.product.name}' is currently out of stock`,
                    });
                }
                color.stock -= item.quantity;
                await color.save();
            }

            // Empty cart when create order
            cart.items = [];
            await cart.save();

            const newOrder = new Order({ ...value, user: userId, items });
            await newOrder.save();

            res.status(201).json({
                message: 'Order is created!',
                order: newOrder,
            });
        } catch (err) {
            res.status(400).json({ error: err?.message });
        }
    }
}
module.exports = new OrderController();
