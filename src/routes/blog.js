const express = require('express');
const router = express.Router();
const BlogController = require('../app/controllers/BlogController');
const { verifyTokenAndAmin } = require('../middleware/auth');
const upload = require('../middleware/file');

router.post(
    '/images',
    verifyTokenAndAmin,
    upload.single('upload'),
    BlogController.uploadBlogImage
);
router.delete('/images', verifyTokenAndAmin, BlogController.deleteBlogImages);
router.get('/:slug', BlogController.getBlogBySlug);
router.get('/', BlogController.getAllBlogs);
router.post(
    '/',
    verifyTokenAndAmin,
    upload.single('thumb'),
    BlogController.createBlog
);
router.put(
    '/:slug',
    verifyTokenAndAmin,
    upload.single('thumb'),
    BlogController.editBlog
);
router.delete('/:id', verifyTokenAndAmin, BlogController.deleteBlog);

module.exports = router;
