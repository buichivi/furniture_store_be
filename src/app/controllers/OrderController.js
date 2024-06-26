const Order = require('../../models/Order');
const User = require('../../models/User');
const Joi = require('joi');
const formatCart = require('../../utils/formatCart');
const PromoCode = require('../../models/PromoCode');
const Color = require('../../models/Color');
const moment = require('moment');
const getFileUrl = require('../../utils/getFileUrl');

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
    promoCode: Joi.string().optional().allow(''),
    paymentStatus: Joi.string().valid('paid', 'unpaid').default('unpaid'),
    discount: Joi.number().integer().default(0),
    shippingFee: Joi.number().integer().default(10),
    subTotal: Joi.number().integer().default(10),
});

const editOrderSchema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    phoneNumber: Joi.string().length(10).required(),
    city: Joi.object().required(),
    district: Joi.object().required(),
    ward: Joi.object().required(),
    addressLine: Joi.string().required(),
    paymentStatus: Joi.string().valid('paid', 'unpaid').default('unpaid'),
    orderStatus: Joi.string()
        .valid(
            'pending',
            'failed',
            'processing',
            'shipped',
            'delivered',
            'cancelled',
            'completed'
        )
        .default('pending'),
});

class OrderController {
    // [GET] /orders
    async getAllOrders(req, res) {
        const user = await User.findById(req.userId);
        let orders = [];
        if (user.admin) {
            orders = await Order.find().populate([
                {
                    path: 'user',
                    model: 'User',
                },
                {
                    path: 'items',
                    populate: [
                        {
                            path: 'product',
                            model: 'Product',
                        },
                        {
                            path: 'color',
                            model: 'Color',
                        },
                    ],
                },
                {
                    path: 'promoCode',
                    model: 'PromoCode',
                },
            ]);
        } else {
            console.log(req.userId);
            orders = await Order.find({ user: req.userId }).populate([
                {
                    path: 'user',
                    model: 'User',
                },
                {
                    path: 'items',
                    populate: [
                        {
                            path: 'product',
                            model: 'Product',
                        },
                        {
                            path: 'color',
                            model: 'Color',
                        },
                    ],
                },
                {
                    path: 'promoCode',
                    model: 'PromoCode',
                },
            ]);
        }
        res.status(200).json({
            orders: orders.map((order) => {
                const subTotal = order?.items?.reduce(
                    (acc, item) => acc + item?.itemPrice,
                    0
                );
                let discount = 0;
                if (order?.promoCode?._id) {
                    if (order?.promoCode?.type == 'coupon') {
                        discount = subTotal;
                    }
                }

                return {
                    ...order._doc,
                    items: order.items.map((item) => {
                        const productImage = getFileUrl(
                            req,
                            item?.color?.images[0]
                        );
                        return { ...item._doc, productImage };
                    }),
                    subTotal,
                    createdAt: moment(order.createdAt).format(
                        'DD/MM/YYYY HH:mm'
                    ),
                };
            }),
        });
    }

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
            if (value?.promoCode) {
                const promoCode = await PromoCode.findById(value.promoCode);
                if (!promoCode)
                    return res
                        .status(400)
                        .json({ error: 'Promo code not found' });
                if (promoCode.currentUses + 1 > promoCode.maxUsage) {
                    return res.status(400).json({
                        error: 'This promo code has reached its usage limit',
                    });
                }
                promoCode.currentUses += 1;
                await promoCode.save();
            }

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

            const newOrder = new Order({
                ...value,
                user: userId,
                items,
            });
            await newOrder.save();

            res.status(201).json({
                message: 'Order is created!',
                order: newOrder,
            });
        } catch (err) {
            res.status(400).json({ error: err?.message });
        }
    }

    // [GET] /orders/:id
    async getOrderByID(req, res) {
        const id = req.params.id;
        const order = await Order.findById(id).populate([
            {
                path: 'user',
                model: 'User',
            },
            {
                path: 'items',
                populate: [
                    {
                        path: 'product',
                        model: 'Product',
                    },
                    {
                        path: 'color',
                        model: 'Color',
                    },
                ],
            },
            {
                path: 'promoCode',
                model: 'PromoCode',
            },
        ]);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        return res.status(200).json({
            order: {
                ...order._doc,
                items: order.items.map((item) => {
                    const productImage = getFileUrl(
                        req,
                        item?.color?.images[0]
                    );
                    return { ...item._doc, productImage };
                }),
                createdAt: moment(order.createdAt).format('DD/MM/YYYY HH:mm'),
            },
        });
    }

    // [PUT] /orders/:id
    async editOrder(req, res) {
        const id = req.params.id;
        const order = await Order.findById(id);
        if (!order) return res.status(404).json({ error: 'Order not found' });
        const { value, error } = editOrderSchema.validate(req.body);
        if (error)
            return res.status(400).json({ error: error.details[0].message });
        try {
            const { orderStatus, paymentStatus, ...rest } = value;
            order.shippingAddress = rest;
            order.orderStatus = orderStatus;
            order.paymentStatus = paymentStatus;
            await order.save();
            res.status(200).json({ message: 'Update order successfully' });
        } catch (err) {
            res.status(400).json({ error: err?.message });
        }
    }

    //[DELETE] /orders/:id
    async deleteOrder(req, res) {
        const id = req.params.id;
        const order = await Order.findById(id);
        if (!order) return res.status(404).json({ error: 'Order not found' });
        try {
            await order.deleteOne();
            res.status(200).json({ message: 'Delete order successfully' });
        } catch (err) {
            res.status(400).json({ error: err?.message });
        }
    }
}
module.exports = new OrderController();
