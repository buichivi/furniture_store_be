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
                model3D: existedColor?.model3D
                    ? getFileUrl(req, existedColor.model3D)
                    : '',
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
            if (existedColor?.thumb) await unlinkAsync(existedColor.thumb);
            if (existedColor?.model3D) await unlinkAsync(existedColor.model3D);
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
        try {
            const slug = req.params.slug;
            const existedProduct = await Product.findOne({ slug }).populate(
                'colors'
            );
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

            const newColor = new Color({
                ...value,
                name: value.name.toLowerCase(),
                thumb: req.files.thumb[0].path,
                images: req.files.images.map((file) => file.path),
                model3D: req.files?.model3D?.length
                    ? req.files.model3D[0].path
                    : '',
            });
            existedProduct.colors = [...existedProduct.colors, newColor._id];
            await existedProduct.save();
            await newColor.save();
            return res
                .status(201)
                .json({ message: 'Created a new color', color: newColor });
        } catch (error) {
            await clearImageRequest(req);
            if (req?.files?.model3D?.length)
                await unlinkAsync(req.files.model3D[0].path);
            return res.status(400).json({ error: error?.message });
        }
    }

    // [PUT] /colors/:colorId
    async editColorById(req, res) {
        try {
            const colorId = req.params.colorId;
            const existedColor = await Color.findById(colorId);
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

            await existedColor.updateOne(
                {
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
                },
                { new: true }
            );
            res.status(200).json({
                message: 'Update color successfully',
                color: existedColor,
            });
        } catch (error) {
            await clearImageRequest(req);
            if (req?.files?.model3D?.length)
                await unlinkAsync(req.files.model3D[0].path);
            res.status(400).json({ error: error?.message });
        }
    }
}

module.exports = new ColorController();
