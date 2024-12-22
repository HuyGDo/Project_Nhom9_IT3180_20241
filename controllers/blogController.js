const res = require('express/lib/response');
const Blog = require('../models/Blog');

class blogController {
    
    index(req, res, next) {
        Blog.find({})
            .then(blogs => res.render('blog',{blogs}))
            .catch(next);
    }
 //   index(req, res) {
 //       res.render('blog');
 //   }

    readBlog(req, res) {
        res.send('Read blog functionality is not implemented yet.');
    }

    show(req, res) {
        res.send('NEWS DETAIL!!!');
    }

}

module.exports = new blogController;
