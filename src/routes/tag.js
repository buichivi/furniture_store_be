const express = require('express');
const router = express.Router();
const Tag = require('../models/Tag');

router.get('/', async (req, res) => {
    try {
        const tags = await Tag.find();
        res.status(200).json({ tags });
    } catch (error) {
        res.status(400).json({ error: error?.message });
    }
});

module.exports = router;
