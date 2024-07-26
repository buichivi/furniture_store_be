const express = require('express');
const router = express.Router();
const TagController = require('../app/controllers/TagController');
const { verifyTokenAndAmin } = require('../middleware/auth');

router.get('/', TagController.getAllTags);
router.post('/', verifyTokenAndAmin, TagController.createTag);
router.put('/:id', verifyTokenAndAmin, TagController.editTag);
router.delete('/:id', verifyTokenAndAmin, TagController.deleteTag);

module.exports = router;
