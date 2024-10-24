const defaultRouters = require('./defaultRouters');

function route(app) {
    app.use('./', defaultRouters);
}

module.exports = route;