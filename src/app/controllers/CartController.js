const Cart = require('../../models/Cart');
const Joi = require('joi');
const getFileUrl = require('../../utils/getFileUrl');

const cartItemValidate = Joi.object({
    product: Joi.string().required(),
    color: Joi.string().required(),
    quantity: Joi.number().required(),
});

const formatCart = async (req) => {
    const cart = await Cart.findById(req.cart._id)
        .populate({
            path: 'items.product',
            model: 'Product',
            select: 'name price discount',
        })
        .populate({
            path: 'items.color',
            model: 'Color',
            select: 'name images',
        });

    if (cart) {
        let subTotal = 0;
        const items = cart.items.map((item) => {
            const cartItem = item;
            const productImage = getFileUrl(req, cartItem?.color?.images[0]);
            const itemPrice =
                Math.ceil(
                    (item.product.price * (100 - item.product.discount)) / 100
                ) * item.quantity;
            subTotal += itemPrice;
            return { ...cartItem._doc, productImage, itemPrice };
        });
        return { ...cart._doc, items, subTotal };
    }
    return {};
};

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
            if (isExistedProduct) {
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
}

module.exports = new CartController();
