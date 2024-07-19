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
};

const infoOptions = (to, subject, html) => {
    return {
        to,
        subject,
        html,
    };
};

const orderConfirmContent = (
    items,
    subTotal,
    totalAmount,
    discount,
    shippingAddress,
    orderId
) => {
    const productList = items
        .map((item) => {
            console.log(item);
            return `<tr>
            <td>
                <div style="width: 100%; display: flex; align-items: center; padding: 8px; gap: 12px">
                <div style="width: 50%; max-width: 120px; aspect-ratio: 1 / 0.8">
                    <img src=${item.productImage} alt="" style="width: 100%; object-fit: cover">
                </div>
                <span style="flex: 1 1 auto; font-size: 14px">${item.product.name}</span>
                </div>
            </td>
            <td align="center" style="padding: 8px">x${item.quantity}</td>
            <td align="right" style="padding: 8px">$${item.itemPrice}</td>
        </tr>`;
        })
        .join('');

    return `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap" rel="stylesheet">
    </head>
    <style>
        * {
        margin: 0;
        padding: 0;
        box-sizing: content-box;
        font-family: "Open Sans", sans-serif;
        font-optical-sizing: auto;
        font-weight: <weight>;
        font-style: normal;
        font-variation-settings:
            "wdth" 100;
        }
        .wrapper {
        width: 100%;
        height: 100%;
        background: #eee;
        }
        .container {
        min-width: 320px;
        max-width: 640px;
        background: #fff;
        padding: 12px 20px;
        height: auto;
        margin: 0 auto;
        }
        tbody > tr:nth-child(odd) {
        background: #eeeeee80
        }
    </style>
    <body>
        <div class="wrapper">
        <div class="container">
            <div style="border-bottom: 1px solid #000">
            <div style="width: 200px; margin: 0 auto; padding: 24px">
                <img
                src="https://i.postimg.cc/zBSQ6QcC/logo.png"
                class=""
                style="width: 100%; object-fit: cover"
                />
            </div>
            </div>
            <div>
            <div style="text-align: center; padding: 24px">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Eo_circle_green_checkmark.svg/800px-Eo_circle_green_checkmark.svg.png" alt="" style="width: 106px">
            </span>
            </div>
            <p style="text-align: center; font-size: 36px; font-weight: 700; color: black">Thank you for placing your order with our store</p>
            <p  style="text-align: center; padding: 16px; font-weight: 500; color: black">This email is to confirm your recent order. <span style="font-weight: 700">Order ID: ${orderId}</span></p>
            <table style="width: 100%">
            <thead>
                <tr style="background: black; color: white;">
                <th style="padding: 10px">Product</th>
                <th>Quantity</th>
                <th>Price</th>
                </tr>
            </thead>
            <tbody>
                ${productList}
                <tr>
                <td></td>
                <td align="right" style="padding: 8px">Subtotal: </td>
                <td align="right" style="padding: 8px">$${subTotal}</td>
                </tr>
                <tr>
                <td></td>
                <td align="right" style="padding: 8px">Discount: </td>
                <td align="right" style="padding: 8px">$${discount}</td>
                </tr>
                <tr>
                <td></td>
                <td align="right" style="padding: 8px">Shipping: </td>
                <td align="right" style="padding: 8px">$10</td>
                </tr>
                <tr>
                <td></td>
                <td align="right" style="padding: 8px; font-weight: 900">Total: </td>
                <td align="right" style="padding: 8px; font-weight: 900">$${totalAmount}</td>
                </tr>
            </tbody>
            </table>
            <div style="margin-top: 12px; font-size: 14px">
            <h3>Shipping address</h3>
            <div style="color: black">${
                shippingAddress.addressLine +
                ', ' +
                shippingAddress.ward.name +
                ', ' +
                shippingAddress.district.name +
                ', ' +
                shippingAddress.city.name
            }</div>
            </div>
            <p style="margin-top: 24px; color: black">
            Please do not hesitate to contact us on if you have any questions.
            </p>
            <div style="margin-top: 24px; color: black">
            <p>Many thanks,</p>
            <p>Fixtures</p>
            </div>
        </div>
        </div>
    </body>
</html>
`;
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
            'shipping',
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
            await sendMail(transpoter, {
                ...mailOptions,
                ...infoOptions(
                    value.shippingAddress.email,
                    'Thank you for your order',
                    orderConfirmContent(
                        cartFormat?.items,
                        value.subTotal,
                        value.totalAmount,
                        value.discount,
                        value.shippingAddress,
                        newOrder._id
                    )
                ),
            });
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

    // [GET] /orders/statistics
    async getStatisticsData(req, res) {
        const startOfMonth = moment().startOf('month').toDate();
        const endOfMonth = moment().endOf('month').toDate();

        const orders = await Order.aggregate([
            {
                $match: {
                    $or: [
                        { orderStatus: 'completed' },
                        { paymentStatus: 'paid' },
                    ],
                    updatedAt: {
                        $gte: startOfMonth,
                        $lte: endOfMonth,
                    },
                },
            },
            {
                $group: {
                    _id: { $dayOfMonth: '$updatedAt' },
                    totalRevenue: { $sum: '$totalAmount' },
                },
            },
            {
                $sort: { _id: 1 },
            },
        ]);

        // Tạo mảng chứa tất cả các ngày trong tháng
        const daysInMonth = [];
        const currentDay = moment(startOfMonth);

        while (
            currentDay.isBefore(endOfMonth) ||
            currentDay.isSame(endOfMonth, 'day')
        ) {
            daysInMonth.push({
                date: currentDay.format('DD-MM'),
                revenue: 0,
            });
            currentDay.add(1, 'days');
        }

        // Kết hợp dữ liệu đơn hàng với mảng ngày
        const dailyData = daysInMonth.map((day) => {
            const order = orders.find(
                (order) => order._id === parseInt(day.date.split('-')[0])
            );
            return {
                day: day.date,
                revenue: order ? order.totalRevenue : 0,
            };
        });

        const revenueData = await Order.aggregate([
            {
                $match: {
                    $or: [
                        { orderStatus: 'completed' },
                        { paymentStatus: 'paid' },
                    ],
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$updatedAt' },
                        month: { $month: '$updatedAt' },
                    },
                    totalRevenue: { $sum: '$totalAmount' },
                },
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 },
            },
        ]);

        // Format the data into the desired structure
        const monthlyData = {};
        revenueData.forEach((item) => {
            const { year, month } = item._id;
            if (!monthlyData[year]) {
                monthlyData[year] = Array(12).fill(0);
            }
            monthlyData[year][month - 1] = item.totalRevenue;
        });

        const topProducts = await Order.aggregate([
            {
                $match: {
                    $or: [
                        { orderStatus: 'completed' },
                        { paymentStatus: 'paid' },
                    ],
                },
            }, // Chỉ lấy các đơn hàng có trạng thái là 'completed'
            { $unwind: '$items' }, // Tách mảng items thành các tài liệu riêng lẻ
            {
                $group: {
                    _id: { product: '$items.product', color: '$items.color' },
                    sold: { $sum: '$items.quantity' },
                },
            },
            { $sort: { sold: -1 } }, // Sắp xếp theo tổng doanh số bán giảm dần
            {
                $lookup: {
                    from: 'products',
                    localField: '_id.product',
                    foreignField: '_id',
                    as: 'productDetails',
                },
            },
            { $unwind: '$productDetails' }, // Tách mảng productDetails
            {
                $lookup: {
                    from: 'colors',
                    localField: '_id.color',
                    foreignField: '_id',
                    as: 'colorDetails',
                },
            },
            { $unwind: '$colorDetails' }, // Tách mảng colorDetails
            {
                $project: {
                    _id: 0,
                    product: '$productDetails.name',
                    color: '$colorDetails.name',
                    images: '$colorDetails.images',
                    sold: 1,
                },
            },
        ]);
        const users = await User.find();
        return res.status(200).json({
            users: users.map((user) => {
                user.password = undefined;
                user.salt = undefined;
                user.token = undefined;
                user.addresses = undefined;
                user.wishlist = undefined;
                return user;
            }),
            orders: await Order.find(),
            monthlyData,
            dailyData,
            topProducts: topProducts.map((item) => {
                return {
                    ...item,
                    productImage: getFileUrl(req, item.images[0]),
                    images: undefined,
                };
            }),
        });
    }
}
module.exports = new OrderController();
