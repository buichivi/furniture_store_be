const Cart = require('../models/Cart');
const getFileUrl = require('../utils/getFileUrl');

const formatCart = async (req) => {
    const cart = await Cart.findById(req.cart._id).populate({
        path: 'items',
        populate: [
            {
                path: 'product',
                populate: {
                    path: 'category',
                    model: 'Category',
                },
            },
            {
                path: 'color',
                model: 'Color',
            },
        ],
    });

    if (cart) {
        let subTotal = 0;
        const items = cart.items.map((item) => {
            const cartItem = item;
            const salePrice = Math.floor(
                ((100 - item.product.discount) / 100) * item.product.price
            );
            const productImage = getFileUrl(req, cartItem?.color?.images[0]);
            const itemPrice =
                Math.ceil(
                    (item.product.price * (100 - item.product.discount)) / 100
                ) * item.quantity;
            subTotal += itemPrice;
            return {
                ...cartItem._doc,
                productImage,
                itemPrice,
                product: { ...item.product._doc, salePrice },
            };
        });
        return { ...cart._doc, items, subTotal };
    }
    return {};
};
module.exports = formatCart;
