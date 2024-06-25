const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const ReviewController = require('../app/controllers/ReviewController');

router.post('/:productId', verifyToken, ReviewController.createReview);

module.exports = router;
