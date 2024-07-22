const Category = require('../../models/Category');
const Product = require('../../models/Product');
const Joi = require('joi');
const getFileUrl = require('../../utils/getFileUrl');
const unlinkAsync = require('../../utils/removeImage');

const addCateSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    parentId: Joi.string().allow(''),
    imageUrl: Joi.any(),
});

const editCateSchema = Joi.object({
    name: Joi.string().allow(''),
    description: Joi.string().allow(''),
    parentId: Joi.string().allow(''),
    active: Joi.bool().allow(null),
    imageUrl: Joi.any().allow(null),
});

class CategoryController {
    // [GET] /categories/
    async getAllCategories(req, res) {
        const categories = await Category.find().exec();
        const allCategories = categories.map((cate) => ({
            ...cate._doc,
            imageUrl: cate.imageUrl ? getFileUrl(req, cate.imageUrl) : '',
        }));
        return res.status(200).json({
            categories: allCategories,
        });
    }

    // [POST] /categories/
    async createCate(req, res) {
        const { error, value } = addCateSchema.validate(req.body);
        if (error) {
            if (req?.file?.path) await unlinkAsync(req.file.path);
            return res.status(400).json({ error: error.details[0].message });
        }
        try {
            const existedCategory = await Category.findOne({
                name: value.name,
            });
            if (existedCategory) {
                throw new Error('This category name is already in use');
            }
            const newCate = new Category({
                ...value,
                imageUrl: req.file ? req.file.path : '',
            });
            await newCate.save();
            res.status(201).json({
                message: 'Create a new category successfully',
                category: {
                    ...newCate._doc,
                    imageUrl: getFileUrl(req, newCate.imageUrl),
                },
            });
        } catch (error) {
            if (req?.file?.path) await unlinkAsync(req.file.path);
            res.status(400).json({ error: error?.message });
        }
    }

    // [PATCH] /categories/:id
    changeActiveAndParentIdCateById(req, res) {
        const cateId = req.params.id;
        const active = req.body?.active;
        const parentId = req.body?.parentId;
        Category.findOneAndUpdate(
            { _id: cateId },
            { active, parentId },
            { new: true }
        )
            .then((cate) =>
                res.json({
                    message: 'Update category successfully',
                    category: cate,
                })
            )
            .catch((err) => res.status(400).json({ error: err?.message }));
    }

    // [PUT] /categories/:id
    async updateCateById(req, res) {
        const cateId = req.params.id;
        var imageUrl = '';
        const existedCate = await Category.findOne({ _id: cateId });
        const { error, value } = editCateSchema.validate(req.body);

        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        if (!existedCate)
            return res.status(404).json({ error: 'Category is not found' });

        if (req.file) {
            // When update new image we need to delete the old image
            if (existedCate?.imageUrl) await unlinkAsync(existedCate.imageUrl);
            imageUrl = req.file.path;
        }
        const newData = { ...value };
        if (imageUrl) {
            newData.imageUrl = imageUrl;
        } else {
            delete newData.imageUrl;
        }

        Category.findOneAndUpdate({ _id: cateId }, newData, { new: true })
            .then((cate) => {
                res.json({
                    message: 'Update category successfully',
                    category: {
                        ...cate._doc,
                        imageUrl: req.file
                            ? getFileUrl(req, req.file.path)
                            : getFileUrl(req, cate.imageUrl),
                    },
                });
            })
            .catch((err) => res.status(400).json({ error: err?.message }));
    }

    // [DELETE] /categories/:id
    async deleteCateById(req, res) {
        const cate = await Category.findOne({ _id: req.params.id });
        if (!cate) return res.status(404).json({ error: 'Category not found' });
        try {
            const product = await Product.findOne({ category: cate._id });
            if (product) {
                return res.status(400).json({
                    error: 'Cannot delete category as it is associated with an product.',
                });
            }

            await cate.deleteOne();
            if (cate.imageUrl) await unlinkAsync(cate.imageUrl);
            const cateChilds = await Category.find({ parentId: cate._id });
            for (var child of cateChilds) {
                child.parentId = '';
                await child.save();
            }
            return res
                .status(200)
                .json({ message: 'Delete category successfully' });
        } catch (error) {
            res.status(400).json({ error: error?.message });
        }
    }

    // [GET] /categories/:slug
    async getCategoryBySlug(req, res) {
        const cateSlug = req.params.slug;
        const cate = await Category.findOne({ slug: cateSlug });
        if (!cate) {
            return res.status(404).json({ error: 'Category not found' });
        }
        return res.status(200).json({ category: cate });
    }
}

module.exports = new CategoryController();
