const Blog = require('../../models/Blog');
const Joi = require('joi');
const getFileUrl = require('../../utils/getFileUrl');
const unlinkAsync = require('../../utils/removeImage');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const uploadsDir = path.join('public', 'uploads');

const isExist = (filePath) => {
    if (fs.existsSync(filePath)) {
        return true;
    } else {
        return false;
    }
};

const blogSchema = Joi.object({
    title: Joi.string().required(),
    tags: Joi.string().required(),
    thumb: Joi.any().required(),
    post: Joi.string().required(),
    description: Joi.string().required(),
    author: Joi.string().required(),
});

const editBlogSchema = Joi.object({
    title: Joi.string().required(),
    tags: Joi.string().required(),
    thumb: Joi.any(),
    post: Joi.string(),
    description: Joi.string().required(),
    author: Joi.string().required(),
});

class BlogController {
    // [GET] /blogs/
    async getAllBlogs(req, res) {
        const blogs = await Blog.find()
            .populate({
                path: 'author',
                select: 'firstName lastName avatar',
            })
            .populate('tags');
        res.status(200).json({
            blogs: blogs.map((blog) => {
                return {
                    ...blog._doc,
                    author: {
                        ...blog.author._doc,
                        avatar: blog.avatar ? getFileUrl(req, blog.avatar) : '',
                    },
                    thumb: getFileUrl(req, blog.thumb),
                };
            }),
        });
    }

    // [GET] /blogs/:slug
    async getBlogBySlug(req, res) {
        try {
            const slug = req.params.slug;
            const blog = await Blog.findOne({ slug })
                .populate({
                    path: 'author',
                    select: 'firstName lastName avatar',
                })
                .populate('tags');
            if (!blog) throw new Error('Blog not found');
            res.status(200).json({
                blog: { ...blog._doc, thumb: getFileUrl(req, blog.thumb) },
            });
        } catch (error) {
            res.status(400).json({ error: error?.message });
        }
    }

    // [POST] /blogs
    async createBlog(req, res) {
        try {
            const { error, value } = blogSchema.validate({
                ...req.body,
                thumb: req.file.path,
                author: req.userId,
            });
            if (error) throw new Error(error.details[0].message);
            const newBlog = new Blog({
                ...value,
                tags: JSON.parse(value.tags),
            });
            await newBlog.save();
            res.status(201).json({
                message: 'Create new blog successfully!',
            });
        } catch (error) {
            if (req.file) await unlinkAsync(req.file.path);
            res.status(400).json({ error: error?.message });
        }
    }

    // [PUT] /blogs/:slug
    async editBlog(req, res) {
        try {
            const slug = req.params.slug;
            const blog = await Blog.findOne({ slug });
            if (!blog) throw new Error('Blog not found');
            if (blog.author != req.userId)
                throw new Error('You are not the author of this blog');
            const { error, value } = editBlogSchema.validate({
                ...req.body,
                thumb: req.file ? req.file.path : blog.thumb,
                author: req.userId,
            });
            if (error) throw new Error(error.details[0].message);
            if (req.file) await unlinkAsync(blog.thumb);
            await blog.updateOne({ ...value, tags: JSON.parse(value.tags) });
            res.status(200).json({ message: 'Update blog successfully!' });
        } catch (error) {
            if (req.file) await unlinkAsync(req.file.path);
            res.status(400).json({ error: error?.message });
        }
    }

    // [POST] /blogs/images
    async uploadBlogImage(req, res) {
        try {
            res.status(200).json({ url: getFileUrl(req, req.file.path) });
        } catch (error) {
            res.status(400).json({ error: { message: 'Upload failed' } });
        }
    }

    // [DELETE] /blogs/
    async deleteBlogImages(req, res) {
        try {
            const { images } = req.body;
            if (!images || images?.length == 0)
                throw new Error('Images not found');
            for (const image of images) {
                const parsedUrl = new URL(image);
                const fileName = path.basename(parsedUrl.pathname);
                const filePath = path.join(uploadsDir, fileName);
                if (isExist(filePath)) await unlinkAsync(filePath);
            }
            res.status(200).json({ message: '123' });
        } catch (error) {
            res.status(400).json({ error: error?.message });
        }
    }

    // [DELETE] /blogs/:id
    async deleteBlog(req, res) {
        try {
            const id = req.params.id;
            const blog = await Blog.findById(id);
            if (!blog) throw new Error('Blog not found');
            if (blog.author != req.userId)
                throw new Error('You are not the author of this blog');
            const listBlogImages = Array.from(
                new JSDOM(blog.post).window.document.querySelectorAll('img')
            ).map((img) => img.getAttribute('src'));
            for (const image of listBlogImages) {
                const parsedUrl = new URL(image);
                const fileName = path.basename(parsedUrl.pathname);
                const filePath = path.join(uploadsDir, fileName);
                if (isExist(filePath)) await unlinkAsync(filePath);
            }
            if (isExist(blog.thumb)) await unlinkAsync(blog.thumb);
            await blog.deleteOne();
            res.status(200).json({ message: 'Deleted a blog successfully' });
        } catch (error) {
            res.status(400).json({ error: error?.message });
        }
    }
}

module.exports = new BlogController();
