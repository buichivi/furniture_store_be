const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');

router.get('/', verifyToken, (req, res) => {
    console.log(req.userId);
    res.status(200).json('My orders');
});

module.exports = router;
