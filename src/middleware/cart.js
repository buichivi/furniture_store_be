const Cart = require('../models/Cart');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const cartMiddleware = async (req, res, next) => {
    let cart;
    const authorizedHeader = req.headers.authorization;
    const token = authorizedHeader && authorizedHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        req.userId = decoded.userId;
        cart = await Cart.findOne({ user: req.userId });
        if (!cart) {
            if (req.cookies.sessionId) {
                cart = await Cart.findOne({ sessionId: req.cookies.sessionId });
                if (cart) {
                    cart.set({ user: req.userId, sessionId: undefined });
                } else cart = new Cart({ user: req.userId });
            } else {
                cart = new Cart({ user: req.userId });
            }
        }
    } catch (error) {
        if (!req.cookies?.sessionId) {
            const sessionId = crypto.randomUUID();
            res.cookie('sessionId', sessionId, {
                maxAge: 30 * 24 * 60 * 60 * 1000, //30 days
                httpOnly: true,
                sameSite: 'none',
                secure: true,
            });
            req.sessionId = sessionId;
        } else {
            req.sessionId = req.cookies.sessionId;
        }
        cart = await Cart.findOne({ sessionId: req.sessionId });
        if (!cart) {
            cart = new Cart({ sessionId: req.sessionId });
        }
    }
    await cart.save();
    req.cart = cart;
    next();
};

module.exports = cartMiddleware;
