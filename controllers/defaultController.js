const Config = require('../config/configuration');
const { redirect } = require('express/lib/response');

class defaultController {
    // [GET] /index
    index(req, res, next) {
        res.render('default/index', { title: 'Trang chủ', path: "index", });
    }

}

module.exports = new defaultController;