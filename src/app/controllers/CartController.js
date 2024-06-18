const Joi = require('joi');
const formatCart = require('../../utils/formatCart');
const Color = require('../../models/Color');

const cartItemValidate = Joi.object({
    product: Joi.string().required(),
    color: Joi.string().required(),
    quantity: Joi.number().required(),
});

class CartController {
    // [GET] /cart
    async getCart(req, res) {
        res.status(200).json({ cart: await formatCart(req) });
    }

    // [POST] /cart
    async addProductToCart(req, res) {
        const { error, value } = cartItemValidate.validate(req.body);
        if (error)
            return res.status(400).json({ error: error.details[0].message });

        try {
            const cart = req.cart;
            const isExistedProduct = cart.items.find(
                (item) => item?.product == value?.product
            );
            const color = await Color.findById(value.color);
            if (isExistedProduct) {
                if (color.stock < isExistedProduct.quantity + value.quantity) {
                    return res.status(400).json({
                        error: 'The current number of products is not enough',
                    });
                }
                cart.items = cart.items.map((item) => {
                    return item.product == value.product &&
                        item.color == value.color
                        ? {
                              ...item._doc,
                              quantity: item.quantity + value.quantity,
                          }
                        : item;
                });
            } else {
                if (color.stock < value.quantity) {
                    return res.status(400).json({
                        error: 'The current number of products is not enough',
                    });
                }
                cart.items.push(value);
            }
            await cart.save();
            res.status(200).json({
                message: 'Add item to cart successfully',
                cart: await formatCart(req),
            });
        } catch (error) {
            res.status(400).json({ error: error?.message });
        }
    }

    // [PATCH] /cart
    async updateQuantity(req, res) {
        try {
            const cart = req.cart;
            const { error, value } = cartItemValidate.validate(req.body);
            if (error)
                return res
                    .status(400)
                    .json({ error: error.details[0].message });
            const color = await Color.findById(value.color);
            const item = cart.items.find((it) => it.product == value.product);
            if (item) {
                if (color.stock < value.quantity) {
                    return res.status(400).json({
                        error: 'The current number of products is not enough',
                        cart: await formatCart(req),
                    });
                }
            } else {
                return res.status(400).json({
                    error: 'This product is not in your cart',
                });
            }
            cart.items = cart.items.map((item) => {
                return item.product == value.product &&
                    item.color == value.color
                    ? {
                          ...item._doc,
                          quantity: value.quantity,
                      }
                    : item;
            });
            cart.items = cart.items.filter((item) => item.quantity != 0);
            await cart.save();
            res.status(200).json({
                message: 'Update item quantity successfully',
                cart: await formatCart(req),
            });
        } catch (error) {
            res.status(400).json({ error: error?.message });
        }
    }

    // [DELETE] /cart/:id
    async deleteCartItem(req, res) {
        try {
            const cart = req.cart;
            const itemId = req.params.id;
            cart.items = cart.items.filter((item) => item._id != itemId);
            await cart.save();
            res.status(200).json({
                message: 'Deleted a cart item',
                cart: await formatCart(req),
            });
        } catch (error) {
            res.status(400).json({ error: error?.message });
        }
    }

    // [DELETE] /cart/clear
    async clearCart(req, res) {
        try {
            const cart = req.cart;
            cart.items = [];
            await cart.save();
            res.status(200).json({
                message: 'Deleted all cart item',
            });
        } catch (error) {
            res.status(400).json({ error: error?.message });
        }
    }
}

module.exports = new CartController();
