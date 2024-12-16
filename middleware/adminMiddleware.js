// middleware/adminMiddleware.js
module.exports.requireAdmin = (req, res, next) => {
    const user = res.locals.user;
    if (user && user.role === 'admin') {
        next();
    } else {
        res.status(403).render('default/403', {
            layout: 'default',
            title: 'Access Denied',
        });
    }
};