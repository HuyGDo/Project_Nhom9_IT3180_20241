const { getRedisClient } = require("./redis");

module.exports = {
    mongoDBUrl: "mongodb://localhost:27017/BussinCookin",
    // mongoDBUrl:
    //     "mongodb+srv://huydg226085:818Dt5bQCl4YD70A@moji-web-cluster.r57n8.mongodb.net/BussinCookin",

    PORT: process.env.PORT || 3000,
    globalVariables: (req, res, next) => {
        next();
    },
    checkRedisHealth: async () => {
        try {
            const redis = getRedisClient();
            await redis.ping();
            console.log("Redis connection is healthy");
            return true;
        } catch (error) {
            console.error("Redis health check failed:", error);
            return false;
        }
    },
};
