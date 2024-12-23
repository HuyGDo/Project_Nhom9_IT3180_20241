const Redis = require("ioredis");

const redisConfig = {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times) => {
        // Retry connection every 3 seconds for 5 times
        if (times <= 5) {
            return 3000;
        }
        return null; // Stop retrying
    },
    maxRetriesPerRequest: 3,
};

let redisClient;

const getRedisClient = () => {
    if (!redisClient) {
        redisClient = new Redis(redisConfig);

        redisClient.on("error", (error) => {
            console.error("Redis connection error:", error);
        });

        redisClient.on("connect", () => {
            console.log("Connected to Redis successfully");
        });
    }
    return redisClient;
};

module.exports = {
    getRedisClient,
    redisConfig,
};
