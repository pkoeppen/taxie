import { redis } from ".";
import { isMain } from "../util";

/**
 * Flushes Redis.
 */
export async function flushRedis() {
  await redis.flushAll();
}

if (isMain(import.meta.url)) {
  await flushRedis();
}
