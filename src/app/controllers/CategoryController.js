const Category = require('../../models/Category');
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
            await unlinkAsync(req.file.path);
            return res.status(400).json({ error: error.details[0].message });
        }
        const newCate = new Category({
            ...value,
            imageUrl: req.file ? req.file.path : '',
        });
        try {
            await newCate.save();
            res.status(201).json({
                message: 'Create a new category successfully',
                category: {
                    ...newCate._doc,
                    imageUrl: getFileUrl(req, newCate.imageUrl),
                },
            });
        } catch (error) {
            await unlinkAsync(req.file.path);
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
            await unlinkAsync(existedCate.imageUrl);
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
            await cate.deleteOne();
            if (cate.imageUrl) await unlinkAsync(cate.imageUrl);
            return res
                .status(200)
                .json({ message: 'Delete category successfully' });
        } catch (error) {
            res.status(400).json({ error: error?.message });
        }
    }
}

module.exports = new CategoryController();
