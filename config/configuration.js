module.exports = {
    mongoDBUrl: 'mongodb://localhost:27017/BussinCookin',
    JWT_SECRET: process.env.JWT_SECRET,
    PORT: process.env.PORT || 3000,
    globalVariables: (req, res, next) => {
        next();
    },
};