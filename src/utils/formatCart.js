const Cart = require('../models/Cart');
const getFileUrl = require('../utils/getFileUrl');

const formatCart = async (req) => {
    const cart = await Cart.findById(req.cart._id).populate({
        path: 'items.product',
        populate: {
            path: 'category',
            model: 'Category',
        },
    });

    if (cart) {
        let subTotal = 0;
        const items = cart.items.map((item) => {
            const salePrice = Math.floor(
                ((100 - (item.product?.discount || 0)) / 100) *
                    item.product.price
            );
            const color = item.product.colors.find((color) => {
                return color._id.equals(item.color);
            });
            const productImage = getFileUrl(req, color?.images[0]);
            const itemPrice =
                Math.ceil(
                    (item.product.price * (100 - item.product.discount)) / 100
                ) * item.quantity;
            subTotal += itemPrice;
            return {
                ...item._doc,
                productImage,
                itemPrice,
                product: { ...item.product._doc, salePrice },
                color,
            };
        });
        return { ...cart._doc, items, subTotal };
    }
    return {};
};
module.exports = formatCart;
