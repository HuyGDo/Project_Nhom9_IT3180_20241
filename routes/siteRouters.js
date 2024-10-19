const defaultRouter = require('./defaultRouters')
function route(app){
    app.use('/', defaultRouter);

}
module.exports = route;