const Product = require('../../models/Product');
const Joi = require('joi');
const Brand = require('../../models/Brand');
const Tag = require('../../models/Tag');
const getFileUrl = require('../../utils/getFileUrl');
const clearImageRequest = require('../../utils/clearImageRequest');
const unlinkAsync = require('../../utils/removeImage');
const moment = require('moment');
const Order = require('../../models/Order');
const formatPath = require('../../utils/formatPath');

const createProductSchema = Joi.object({
    name: Joi.string().required(),
    price: Joi.number().min(0).required(),
    discount: Joi.number().min(0).max(100).required(),
    description: Joi.string().required(),
    category: Joi.string().required(),
    width: Joi.number().min(0).required(),
    height: Joi.number().min(0).required(),
    depth: Joi.number().min(0).required(),
    weight: Joi.number().required(),
    material: Joi.string().required(),
    brand: Joi.string().required(),
    active: Joi.boolean().default(true),
    SKU: Joi.string().required(),
    tags: Joi.string().required(),
    colorName: Joi.string().required(),
    stock: Joi.number().min(0).required(),
    thumb: Joi.any().required(),
    images: Joi.array().required(),
});
const editProductSchema = Joi.object({
    name: Joi.string().required(),
    price: Joi.number().min(0).required(),
    discount: Joi.number().min(0).max(100).required(),
    description: Joi.string().required(),
    category: Joi.string().required(),
    width: Joi.number().min(0).required(),
    height: Joi.number().min(0).required(),
    depth: Joi.number().min(0).required(),
    weight: Joi.number().required(),
    material: Joi.string().required(),
    brand: Joi.string().required(),
    active: Joi.boolean().default(true),
    SKU: Joi.string().required(),
    tags: Joi.array().min(1).required(),
});

const createColor = Joi.object({
    name: Joi.string().required(),
    stock: Joi.number().min(0).required(),
    thumb: Joi.any().required(),
    images: Joi.array().required(),
    model3D: Joi.any().allow(null),
});

const editColor = Joi.object({
    name: Joi.string().required(),
    stock: Joi.number().min(0).required(),
    existedImages: Joi.any(),
    images: Joi.array().min(0),
    thumb: Joi.any().allow(null),
    model3D: Joi.any().allow(null),
    isDeleteModel: Joi.bool().default(false),
});

const formatProduct = (req, product) => {
    let isValid = 0;
    const colors = product?.colors?.map((color) => {
        isValid += color.stock;
        return {
            ...color._doc,
            thumb: getFileUrl(req, color.thumb),
            images: color.images.map((image) => getFileUrl(req, image)),
            model3D: color?.model3D ? getFileUrl(req, color.model3D) : '',
        };
    });
    const salePrice = Math.floor(
        ((100 - product.discount) / 100) * product.price
    );
    const isNew = moment().diff(moment(product.createdAt), 'days') <= 30;
    return {
        ...product._doc,
        category: {
            ...product.category._doc,
            imageUrl: getFileUrl(req, product.category.imageUrl),
        },
        salePrice,
        colors,
        isValid: !!isValid,
        reviews: product.reviews.map((review) => ({
            ...review._doc,
            createdAt: moment().format('DD/MM/YYYY HH:mm'),
        })),
        isNew,
    };
};

class ProductController {
    // [GET] /products/
    async getAllProducts(req, res) {
        const products = await Product.find()
            .populate('brand')
            .populate('category')
            .populate('tags');
        res.status(200).json({
            products: products.map((product) => {
                return formatProduct(req, product);
            }),
        });
    }

    // [POST] /products/
    async createProduct(req, res) {
        const { error, value } = createProductSchema.validate({
            ...req.body,
            thumb: req.files?.thumb?.length
                ? req.files?.thumb[0]?.path
                : undefined,
            images: req.files?.images?.map((file) => file.path),
        });
        if (error) {
            await clearImageRequest(req);
            return res.status(400).json({ error: error.details[0].message });
        }
        try {
            const existedProduct = await Product.findOne({ name: value.name });
            if (existedProduct) {
                throw new Error('This product name is already in use');
            }
            const newColor = {
                name: value.colorName,
                thumb: value.thumb,
                images: value.images,
                stock: value.stock,
            };
            const newProduct = new Product({
                ...value,
                tags: JSON.parse(value.tags),
                colors: [newColor],
                dimensions: {
                    width: value.width,
                    height: value.height,
                    depth: value.depth,
                },
            });
            await newProduct.save();
            res.json({
                message: 'Created a new product',
                product: newProduct,
            });
        } catch (error) {
            await clearImageRequest(req);
            res.status(400).json({ error: error?.message });
        }
    }

    // [GET] /products/:slug
    getProductBySlug(req, res) {
        const slug = req.params.slug;
        Product.findOne({ slug })
            .populate('brand')
            .populate('category')
            .populate('tags')
            .populate({
                path: 'reviews',
                populate: {
                    path: 'user',
                    model: 'User',
                    select: 'name avatar firstName lastName',
                },
            })
            .then((product) => {
                res.status(200).json({
                    product: formatProduct(req, product),
                });
            })
            .catch((error) => res.status(400).json({ error: error?.message }));
    }

    // [PUT] /products/:id
    async editProductById(req, res) {
        const id = req.params.id;
        const existedProduct = await Product.findById(id);
        if (!existedProduct)
            return res.status(404).json({ error: 'Product not found' });

        const { error, value } = editProductSchema.validate(req.body);
        if (error)
            return res.status(400).json({ error: error.details[0].message });
        try {
            await existedProduct.updateOne(
                {
                    ...value,
                    tags: value.tags.map((tag) => tag._id),
                    dimensions: {
                        width: value.width,
                        height: value.height,
                        depth: value.depth,
                    },
                },
                { new: true }
            );
            res.status(200).json({
                message: 'Update product successfully',
                product: existedProduct,
            });
        } catch (error) {
            res.status(400).json({ error: error?.message });
        }
    }

    // [PATCH] /products/:id
    async toggleActiveProductById(req, res) {
        const productId = req.params.id;
        const existedProduct = await Product.findById(productId);
        const active = req.body.active || false;
        if (!existedProduct)
            return res.status(404).json({ error: 'Product not found' });
        try {
            await existedProduct.updateOne({ active });
            res.status(200).json({
                message: 'Update active product successfully',
            });
        } catch (error) {
            res.status(400).json({ error: error?.message });
        }
    }

    // [DELETE] /products/:id
    async deleteProductById(req, res) {
        const productId = req.params.id;
        const existedProduct = await Product.findById(productId);
        if (!existedProduct)
            return res.status(404).json({ error: 'Product not found' });
        try {
            const order = await Order.findOne({
                'items.product': existedProduct._id,
            });
            if (order) {
                throw new Error(
                    'Cannot delete product as it is associated with an order.'
                );
            }
            const colors = existedProduct.colors;
            for (const color of colors) {
                if (color?.thumb) await unlinkAsync(color.thumb);
                if (color?.model3D) await unlinkAsync(color.model3D);
                for (const img of color.images) {
                    if (img) await unlinkAsync(img);
                }
            }
            await existedProduct.deleteOne();
            res.status(200).json({ message: 'Delete product successfully' });
        } catch (error) {
            res.status(400).json({ error: error?.message });
        }
    }

    // [GET] /products/search/:query
    async searchProduct(req, res) {
        const query = req.params.query;
        try {
            const searchedProducts = await Product.find({
                name: { $regex: query, $options: 'i' },
            })
                .populate('brand')
                .populate('category')
                .populate('tags');
            res.status(200).json({
                products: searchedProducts.map((product) => {
                    return formatProduct(req, product);
                }),
            });
        } catch (err) {
            res.status(400).json({ error: err?.message });
        }
    }
    // [GET] /products/tag/:tag
    async getProductByTag(req, res) {
        try {
            const tag = req.params.tag;
            const existedTag = await Tag.findOne({ name: tag });
            if (!existedTag) throw new Error('Tag not found');
            const products = await Product.find({
                tags: { $in: existedTag._id },
            })
                .populate('brand')
                .populate('category')
                .populate('tags');
            res.status(200).json({
                products: products.map((product) => {
                    return formatProduct(req, product);
                }),
            });
        } catch (error) {
            res.status(400).json({ error: error?.message });
        }
    }

    // [GET] /products/brand/:brand
    async getProductByBrand(req, res) {
        try {
            const brand = req.params.brand;
            const existedBrand = await Brand.findOne({ name: brand });
            if (!existedBrand) throw new Error('Brand not found');
            const products = await Product.find({ brand: existedBrand._id })
                .populate('brand')
                .populate('category')
                .populate('tags');
            res.status(200).json({
                products: products.map((product) => {
                    return formatProduct(req, product);
                }),
            });
        } catch (error) {
            res.status(400).json({ error: error?.message });
        }
    }

    // [GET] /products/colors/:slug/:colorId
    async getColor(req, res) {
        const colorId = req.params.colorId;
        const slug = req.params.slug;
        const existedProduct = await Product.findOne({ slug });
        if (!existedProduct) {
            throw new Error('Product not found');
        }
        const existedColor = existedProduct.colors.find((color) =>
            color._id.equals(colorId)
        );
        if (!existedColor)
            return res.status(404).json({ error: 'Color not found' });
        res.status(200).json({
            color: {
                ...existedColor._doc,
                thumb: getFileUrl(req, existedColor.thumb),
                images: existedColor.images.map((img) => getFileUrl(req, img)),
                model3D: existedColor?.model3D
                    ? getFileUrl(req, existedColor.model3D)
                    : '',
            },
        });
    }

    // [POST] /products/colors/:slug
    async createColor(req, res) {
        try {
            const slug = req.params.slug;
            const existedProduct = await Product.findOne({ slug });
            if (!existedProduct) {
                throw new Error('Product not found');
            }
            const { error, value } = createColor.validate({
                ...req.body,
                thumb: req.files?.thumb?.length
                    ? req.files?.thumb[0]?.path
                    : undefined,
                images: req.files?.images?.map((file) => file.path),
                model3D: req.files?.model3D?.length
                    ? req.files?.model3D[0]?.path
                    : undefined,
            });
            if (error) {
                throw new Error(error.details[0].message);
            }
            const existedColors = existedProduct.colors.map(
                (color) => color.name
            );

            for (var color of existedColors) {
                if (color.toLowerCase() === value.name.toLowerCase()) {
                    await clearImageRequest(req);
                    return res
                        .status(400)
                        .json({ error: 'Color name existed for this product' });
                }
            }

            const newColor = {
                ...value,
                name: value.name.toLowerCase(),
                thumb: req.files.thumb[0].path,
                images: req.files.images.map((file) => file.path),
                model3D: req.files?.model3D?.length
                    ? req.files.model3D[0].path
                    : '',
            };
            existedProduct.colors = [...existedProduct.colors, newColor];
            await existedProduct.save();
            return res.status(201).json({ message: 'Created a new color' });
        } catch (error) {
            await clearImageRequest(req);
            if (req?.files?.model3D?.length)
                await unlinkAsync(req.files.model3D[0].path);
            return res.status(400).json({ error: error?.message });
        }
    }

    // [PUT] /products/colors/:slug/:colorId
    async editColor(req, res) {
        try {
            const slug = req.params.slug;
            const colorId = req.params.colorId;
            const existedProduct = await Product.findOne({ slug });
            if (!existedProduct) {
                throw new Error('Product not found');
            }
            const existedColor = existedProduct.colors.find((color) =>
                color._id.equals(colorId)
            );
            if (!existedColor) {
                throw new Error('Color not found');
            }

            const { error, value } = editColor.validate({
                ...req.body,
                thumb: req.files?.thumb?.length
                    ? req.files?.thumb[0]?.path
                    : undefined,
                images: req.files?.images,
                model3D: req.files?.model3D?.length
                    ? req.files?.model3D[0]?.path
                    : req.body.model3D,
            });
            if (error) throw new Error(error.details[0].message);

            const existedImages = JSON.parse(value.existedImages).map((img) =>
                formatPath(img)
            );
            const newImages =
                value?.images?.map((image) => formatPath(image.path)) || [];
            const thumb = value?.thumb;
            const model3D = value?.model3D;
            const clearImageRequest = existedColor.images
                .map((img) => formatPath(img))
                .filter((img) => !existedImages.includes(img));
            for (const img of clearImageRequest) {
                if (img) await unlinkAsync(img);
            }
            if (thumb && existedColor.thumb)
                await unlinkAsync(existedColor.thumb);
            if (model3D && existedColor.model3D)
                await unlinkAsync(existedColor.model3D);
            if (value.isDeleteModel) await unlinkAsync(existedColor.model3D);

            existedProduct.colors = existedProduct.colors.map((color) => {
                return color._id.equals(colorId)
                    ? {
                          ...existedColor,
                          name: value.name,
                          stock: value.stock,
                          thumb: thumb
                              ? formatPath(thumb)
                              : formatPath(existedColor.thumb),
                          images: [...existedImages, ...newImages],
                          model3D: model3D
                              ? formatPath(model3D)
                              : !value.isDeleteModel
                              ? formatPath(existedColor.model3D)
                              : '',
                      }
                    : color;
            });
            await existedProduct.save();
            res.status(200).json({
                message: 'Update color successfully',
            });
        } catch (error) {
            await clearImageRequest(req);
            if (req?.files?.model3D?.length)
                await unlinkAsync(req.files.model3D[0].path);
            res.status(400).json({ error: error?.message });
        }
    }

    // [DELETE] /products/colors/:slug/:colorId
    async deleteColor(req, res) {
        try {
            const slug = req.params.slug;
            const colorId = req.params.colorId;
            const existedProduct = await Product.findOne({ slug });
            if (!existedProduct) {
                throw new Error('Product not found');
            }
            const existedColor = existedProduct.colors.find((color) =>
                color._id.equals(colorId)
            );
            if (!existedColor) {
                throw new Error('Color not found');
            }
            existedProduct.colors = existedProduct.colors.filter(
                (color) => color._id != colorId
            );
            if (existedColor?.thumb) await unlinkAsync(existedColor.thumb);
            if (existedColor?.model3D) await unlinkAsync(existedColor.model3D);
            for (const image of existedColor.images) {
                if (image) await unlinkAsync(image);
            }
            await existedProduct.save();
            res.json({ message: 'Deleted a color' });
        } catch (error) {
            res.status(400).json({ error: error?.message });
        }
    }
}

module.exports = new ProductController();
