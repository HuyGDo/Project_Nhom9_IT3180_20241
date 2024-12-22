const defaultRouters = require('./defaultRouters');
const blogRouter = require('./blogRouters');

function route(app) {
    app.use('./', defaultRouters);

    app.use('/blog', blogRouter);
}

module.exports = route;