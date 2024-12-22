module.exports = {
    mongoDBUrl: "mongodb://localhost:27017/BussinCookin",
    // mongoDBUrl:
    //     "mongodb+srv://huydg226085:818Dt5bQCl4YD70A@moji-web-cluster.r57n8.mongodb.net/BussinCookin",

    PORT: process.env.PORT || 3000,
    globalVariables: (req, res, next) => {
        next();
    },
};
