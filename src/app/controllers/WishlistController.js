const User = require('../../models/User');
const moment = require('moment');
const getFileUrl = require('../../utils/getFileUrl');

const formatWishlist = async (req) => {
    const user = await User.findById(req.userId)
        .populate({
            path: 'wishlist',
            populate: {
                path: 'product',
                model: 'Product',
                populate: [
                    { path: 'category', model: 'Category' },
                    { path: 'colors', model: 'Color' },
                ],
            },
        })
        .exec();
    const wishlist = user.wishlist.map((item) => {
        const salePrice = Math.floor(
            ((100 - item.product.discount) / 100) * item.product.price
        );
        const productImage = getFileUrl(
            req,
            item?.product?.colors[0]?.images[0]
        );
        let isValid = 0;
        item?.product?.colors.forEach((color) => {
            isValid += color.stock;
        });
        return {
            ...item._doc,
            product: {
                ...item.product._doc,
                productImage,
                salePrice,
                isValid: !!isValid,
            },
        };
    });
    return wishlist;
};

class WishlistController {
    // [GET] /wishlist/
    async getWishlist(req, res) {
        return res.status(200).json({ wishlist: await formatWishlist(req) });
    }

    // [POST] /wishlist/
    async addProducToWishlist(req, res) {
        try {
            const user = await User.findById(req.userId);
            if (!user) {
                return res.status(400).json({ error: 'Unauthorized' });
            }
            const { product } = req.body;
            user.wishlist.forEach((item) => {
                if (item.product == product)
                    throw new Error(
                        'This product is already in your wishlist!'
                    );
            });
            user.wishlist = [
                ...user.wishlist,
                { product, addedAt: moment().format('DD/MM/YYYY HH:mm') },
            ];
            await user.save();
            return res.status(200).json({
                message: 'Add product to your wishlist successfully',
                wishlist: await formatWishlist(req),
            });
        } catch (err) {
            return res.status(400).json({ error: err?.message });
        }
    }

    // [DELETE] /wishlist/:productId
    async removeProductFromWishlist(req, res) {
        try {
            const user = await User.findById(req.userId);
            const product = req.params.productId;
            if (user.wishlist.find((item) => item?.product == product)) {
                user.wishlist = user.wishlist.filter(
                    (item) => item.product != product
                );
                await user.save();
                return res.status(200).json({
                    message: 'Remove product from wishtlist successfully',
                    wishlist: await formatWishlist(req),
                });
            } else {
                throw new Error('This product is not in your wishlist');
            }
        } catch (error) {
            res.status(400).json({ error: error?.message });
        }
    }
}
module.exports = new WishlistController();
