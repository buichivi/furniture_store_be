const express = require('express');
const router = express.Router();
const TagController = require('../app/controllers/TagController');

router.get('/', TagController.getAllTags);
router.post('/', TagController.createTag);
router.put('/:id', TagController.editTag);
router.delete('/:id', TagController.deleteTag);

module.exports = router;
