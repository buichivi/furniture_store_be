const Order = require('../../models/Order');
const User = require('../../models/User');
const Joi = require('joi');
const formatCart = require('../../utils/formatCart');
const PromoCode = require('../../models/PromoCode');
const Color = require('../../models/Color');
const moment = require('moment');
const getFileUrl = require('../../utils/getFileUrl');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

const vnpayConfig = {
    vnp_TmnCode: '0NP1XRTC',
    vnp_HashSecret: '7WZW1IEMFHF0LEU52VXL3TN5ZULYAH36',
    vnp_Url: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    vnp_ReturnUrl: 'http://localhost:5173/checkout',
};

const transpoter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.USER,
        pass: process.env.PASSWORD,
    },
});

const mailOptions = {
    from: { name: 'Fixtures store', address: process.env.USER },
    to: 'zronglonz@gmail.com',
    subject: 'Send test email',
    text: 'Plain text body',
    html: '<h1>HELLO WORLD</h1>',
};

const sendMail = async (transpoter, mailOptions) => {
    try {
        await transpoter.sendMail(mailOptions);
        console.log('Sended email');
    } catch (error) {
        console.log(error);
    }
};

function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(
            /%20/g,
            '+'
        );
    }
    return sorted;
}

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
            await sendMail(transpoter, mailOptions);
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

    // [POST] /orders/create-vnpay-url
    async createVNPayUrl(req, res) {
        let date = new Date();
        let createDate = moment(date).format('YYYYMMDDHHmmss');

        let ipAddr =
            req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;

        let tmnCode = vnpayConfig.vnp_TmnCode;
        let secretKey = vnpayConfig.vnp_HashSecret;
        let vnpUrl = vnpayConfig.vnp_Url;
        let returnUrl = vnpayConfig.vnp_ReturnUrl;
        let orderId = moment(date).format('DDHHmmss');
        let amount = req.body.amount;

        let locale = 'vn';
        let currCode = 'VND';
        let vnp_Params = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = tmnCode;
        vnp_Params['vnp_Locale'] = locale;
        vnp_Params['vnp_CurrCode'] = currCode;
        vnp_Params['vnp_TxnRef'] = orderId;
        vnp_Params['vnp_OrderInfo'] = 'Thanh toan cho ma GD:' + orderId;
        vnp_Params['vnp_OrderType'] = 'other';
        vnp_Params['vnp_Amount'] = amount * 100;
        vnp_Params['vnp_ReturnUrl'] = returnUrl;
        vnp_Params['vnp_IpAddr'] = ipAddr;
        vnp_Params['vnp_CreateDate'] = createDate;

        vnp_Params = sortObject(vnp_Params);

        let querystring = require('qs');
        let signData = querystring.stringify(vnp_Params, { encode: false });
        let crypto = require('crypto');
        let hmac = crypto.createHmac('sha512', secretKey);
        let signed = hmac.update(new Buffer(signData, 'utf-8')).digest('hex');
        vnp_Params['vnp_SecureHash'] = signed;
        vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

        res.json({ paymentUrl: vnpUrl });
    }

    // [GET] /orders/vnpay-return
    async vnPayReturn(req, res, next) {
        var vnp_Params = req.query;
        var secureHash = vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];
        vnp_Params = sortObject(vnp_Params);

        var tmnCode = vnpayConfig['vnp_TmnCode'];
        var secretKey = vnpayConfig['vnp_HashSecret'];

        var querystring = require('qs');
        var signData = querystring.stringify(vnp_Params, { encode: false });
        var crypto = require('crypto');
        var hmac = crypto.createHmac('sha512', secretKey);
        var signed = hmac.update(new Buffer(signData, 'utf-8')).digest('hex');

        if (secureHash === signed) {
            //Kiem tra xem du lieu trong db co hop le hay khong va thong bao ket qua
            const code = vnp_Params['vnp_TransactionStatus'];
            if (code == '00') {
                res.status(200).json({
                    message: 'Successful transaction',
                    code: vnp_Params['vnp_TransactionStatus'],
                });
            } else {
                res.status(400).json({
                    message: 'Transaction error',
                    code: vnp_Params['vnp_TransactionStatus'],
                });
            }
        } else {
            res.status(400).json({
                error: 'An error occurred during the payment process!',
            });
        }
    }
}
module.exports = new OrderController();
