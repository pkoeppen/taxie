import { createClient } from "redis";
import "colors";

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (error) => console.error(`Redis: ${error}`.red));
redisClient.connect().catch((error) => console.error(`Redis: ${error}`.red));

export const redis = redisClient;
