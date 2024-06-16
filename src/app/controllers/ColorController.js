const getFileUrl = require('../../utils/getFileUrl');
const formatPath = require('../../utils/formatPath');
const unlinkAsync = require('../../utils/removeImage');
const clearImageRequest = require('../../utils/clearImageRequest');
const Color = require('../../models/Color');
const Product = require('../../models/Product');
const Joi = require('joi');

const createColor = Joi.object({
    name: Joi.string().required(),
    stock: Joi.number().min(0).required(),
    thumb: Joi.any().required(),
    images: Joi.array().required(),
});

const editColor = Joi.object({
    name: Joi.string().required(),
    stock: Joi.number().min(0).required(),
    existedImages: Joi.any(),
    images: Joi.array().min(0),
    thumb: Joi.any().allow(null),
});
class ColorController {
    // [GET] /:colorId
    async getColorById(req, res) {
        const colorId = req.params.colorId;
        const existedColor = await Color.findById(colorId);
        if (!existedColor)
            return res.status(404).json({ error: 'Color not found' });
        res.status(200).json({
            color: {
                ...existedColor._doc,
                thumb: getFileUrl(req, existedColor.thumb),
                images: existedColor.images.map((img) => getFileUrl(req, img)),
            },
        });
    }

    // [DELETE] /:productId/:colorId
    async deleteColorById(req, res) {
        const productId = req.params.productId;
        const colorId = req.params.colorId;
        const existedProduct = await Product.findById(productId);
        const existedColor = await Color.findById(colorId);
        if (!existedProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }
        if (!existedColor)
            return res.status(404).json({ error: 'Color not found' });
        if (!existedProduct.colors.includes(colorId)) {
            return res
                .status(404)
                .json({ error: 'Product doesnt have this color' });
        }
        try {
            existedProduct.colors = existedProduct.colors.filter(
                (color) => color != colorId
            );
            if (existedProduct?.thumb) await unlinkAsync(existedColor.thumb);
            for (const image of existedColor.images) {
                if (image) await unlinkAsync(image);
            }
            await existedColor.deleteOne();
            await existedProduct.save();
            res.json({ message: 'Deleted a color' });
        } catch (error) {
            res.status(400).json({ error: error?.message });
        }
    }

    // [POST] /colors/:slug
    async createColorByProductSlug(req, res) {
        const slug = req.params.slug;
        const existedProduct = await Product.findOne({ slug }).populate(
            'colors'
        );
        if (!existedProduct) {
            await clearImageRequest(req);
            return res.status(400).json({ message: 'Product not found' });
        }
        const { error, value } = createColor.validate({
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
        const existedColors = existedProduct.colors.map((color) => color.name);

        for (var color of existedColors) {
            if (color.toLowerCase() === value.name.toLowerCase()) {
                await clearImageRequest(req);
                return res
                    .status(400)
                    .json({ error: 'Color name existed for this product' });
            }
        }

        try {
            const newColor = new Color({
                ...value,
                name: value.name.toLowerCase(),
                thumb: req.files.thumb[0].path,
                images: req.files.images.map((file) => file.path),
            });
            existedProduct.colors = [...existedProduct.colors, newColor._id];
            await existedProduct.save();
            await newColor.save();
            return res
                .status(201)
                .json({ message: 'Created a new color', color: newColor });
        } catch (error) {
            await clearImageRequest(req);
            return res.status(400).json({ error: error?.message });
        }
    }

    // [PUT] /colors/:colorId
    async editColorById(req, res) {
        const colorId = req.params.colorId;
        const existedColor = await Color.findById(colorId);
        if (!existedColor) {
            await clearImageRequest(req);
            return res.stasus(404).json({ error: 'Color not found' });
        }

        const { error, value } = editColor.validate({
            ...req.body,
            thumb: req.files?.thumb?.length
                ? req.files?.thumb[0]?.path
                : undefined,
            images: req.files?.images,
        });
        if (error) {
            await clearImageRequest(req);
            return res.status(400).json({ error: error.details[0].message });
        }
        try {
            const existedImages = JSON.parse(value.existedImages).map((img) =>
                formatPath(img)
            );
            const newImages =
                value?.images?.map((image) => formatPath(image.path)) || [];
            const thumb = value?.thumb;
            const clearImageRequest = existedColor.images
                .map((img) => formatPath(img))
                .filter((img) => !existedImages.includes(img));
            for (const img of clearImageRequest) {
                if (img) await unlinkAsync(img);
            }
            if (thumb) await unlinkAsync(existedColor.thumb);
            await existedColor.updateOne(
                {
                    name: value.name,
                    stock: value.stock,
                    thumb: thumb
                        ? formatPath(thumb)
                        : formatPath(existedColor.thumb),
                    images: [...existedImages, ...newImages],
                },
                { new: true }
            );
            res.status(200).json({
                message: 'Update color successfully',
                color: existedColor,
            });
        } catch (error) {
            res.status(400).json({ error: error?.message });
        }
    }
}

module.exports = new ColorController();
