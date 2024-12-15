module.exports = {
    mongoDBUrl: 'mongodb://localhost:27017/BussinCookin',

    PORT: process.env.PORT || 3000,
    globalVariables: (req, res, next) => {
        next();
    },
};