const Tag = require('../../models/Tag');
const Product = require('../../models/Product');
const moment = require('moment');

class TagController {
    // [GET] /tags/
    async getAllTags(req, res) {
        const tags = await Tag.find();
        res.status(200).json({
            tags: tags.map((tag) => ({
                ...tag._doc,
                createdAt: moment(tag.createdAt).format('DD/MM/YYYY HH:mm'),
            })),
        });
    }

    // [POST] /tags/
    async createTag(req, res) {
        const { name } = req.body;
        const existedTag = await Tag.findOne({ name });
        if (existedTag)
            return res
                .status(400)
                .json({ error: 'This tag name is already existed' });
        try {
            const newTag = new Tag({ name });
            await newTag.save();
            return res
                .status(201)
                .json({ message: 'Created a new tag', tag: newTag });
        } catch (error) {
            return res.status(400).json({ error: error?.message });
        }
    }

    // [PUT] /tags/:id
    async editTag(req, res) {
        try {
            const id = req.params.id;
            const { name } = req.body;
            if (!name) {
                throw new Error('Name is required');
            }
            const existedTag = await Tag.findById(id);
            if (!existedTag) throw new Error('Tag not found');
            existedTag.name = name;
            await existedTag.save();
            return res
                .status(200)
                .json({ message: 'Update tag successfully', tag: existedTag });
        } catch (error) {
            return res.status(400).json({ error: error?.message });
        }
    }

    // [DELETE] /tags/:id
    async deleteTag(req, res) {
        try {
            const id = req.params.id;
            const existedTag = await Tag.findById(id);
            if (!existedTag) throw new Error('Tag not found');
            const product = await Product.findOne({
                tags: { $in: [id] },
            });
            if (product) {
                return res.status(400).json({
                    error: 'Cannot delete category as it is associated with a product.',
                });
            }
            await existedTag.deleteOne();
            return res.status(200).json({ message: 'Delete tag successfully' });
        } catch (error) {
            return res.status(400).json({ error: error?.message });
        }
    }
}

module.exports = new TagController();
