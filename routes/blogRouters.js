const { Router } = require('express');
const blogController = require('../controllers/blogController');

const router = Router();

router.get('/:slug', blogController.show);
router.get('/', blogController.index);

router.get('/blog/get-blog', blogController.readBlog);

module.exports = router;