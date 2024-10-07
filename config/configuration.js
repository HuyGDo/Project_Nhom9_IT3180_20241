module.exports = {
    mongoDBUrl: '',
    PORT: process.env.PORT || 3000,
    globalVariables: (req, res, next) => {
        next();
    },
};